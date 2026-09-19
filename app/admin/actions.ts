'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { authConfigError, endSession, requireAdmin, startSession, verifyPassword } from '@/lib/admin-auth'
import { checkThrottle, recordFailure, recordSuccess } from '@/lib/login-throttle'
import { ContentConflictError, commitContent, commitPdf, loadContent } from '@/lib/github-content'
import { MAX_PDF_BYTES, contentSchema } from '@/lib/site-content-schema'

export type ActionState = { ok: boolean; message: string }

/* ------------------------------------------------------------------ */
/* ログイン / ログアウト                                                */
/* ------------------------------------------------------------------ */

async function clientKey(): Promise<string> {
  const headerList = await headers()
  return headerList.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const configError = authConfigError()
  if (configError) return { ok: false, message: `設定エラー: ${configError}` }

  const key = await clientKey()
  const throttle = checkThrottle(key)
  if (!throttle.allowed) {
    const minutes = Math.ceil(throttle.retryAfterSec / 60)
    return {
      ok: false,
      message: `ログインの失敗が続いたため一時的にロックされています。約${minutes}分後にもう一度お試しください。`,
    }
  }

  const password = formData.get('password')
  if (typeof password !== 'string' || password.length === 0 || password.length > 512 || !verifyPassword(password)) {
    recordFailure(key)
    return { ok: false, message: 'パスワードが正しくありません。' }
  }

  recordSuccess(key)
  if (!(await startSession())) {
    return { ok: false, message: '設定エラー: セッションを作成できませんでした。' }
  }

  redirect('/admin')
}

export async function logoutAction(): Promise<void> {
  await endSession()
  redirect('/admin/login')
}

/* ------------------------------------------------------------------ */
/* 内容の保存（= GitHub へコミット）                                    */
/* ------------------------------------------------------------------ */

export type SaveState = ActionState & {
  /** 保存後の最新 SHA。次回保存の衝突検出に使う。 */
  sha?: string | null
}

export async function saveContentAction(_prev: SaveState, formData: FormData): Promise<SaveState> {
  await requireAdmin()

  const raw = formData.get('payload')
  const knownSha = formData.get('sha')
  if (typeof raw !== 'string') return { ok: false, message: '保存するデータが読み取れませんでした。' }

  let parsedJson: unknown
  try {
    parsedJson = JSON.parse(raw)
  } catch {
    return { ok: false, message: '保存するデータが壊れています。ページを再読み込みしてやり直してください。' }
  }

  const result = contentSchema.safeParse(parsedJson)
  if (!result.success) {
    return { ok: false, message: result.error.issues[0]?.message ?? '入力内容を確認してください。' }
  }

  // 空行は保存しない（行を足したまま書かずに保存したときのため）
  const content = {
    ...result.data,
    events: result.data.events.filter((event) => event.date || event.title || event.place),
  }

  try {
    await commitContent(content, typeof knownSha === 'string' && knownSha ? knownSha : null)
  } catch (error) {
    if (error instanceof ContentConflictError) {
      return {
        ok: false,
        message: 'ほかの場所で内容が更新されていたため、保存を中止しました。ページを再読み込みしてからやり直してください。',
      }
    }
    return { ok: false, message: error instanceof Error ? error.message : '保存に失敗しました。' }
  }

  // 次回保存用に最新の SHA を取り直す
  let nextSha: string | null = null
  try {
    nextSha = (await loadContent()).sha
  } catch {
    // 取れなくても保存自体は成功している
  }

  return {
    ok: true,
    message: '公開しました。サイトへの反映まで2〜3分かかります。',
    sha: nextSha,
  }
}

/* ------------------------------------------------------------------ */
/* PDF アップロード（= GitHub へコミット）                              */
/* ------------------------------------------------------------------ */

export type UploadState = { ok: boolean; message: string; url?: string; name?: string }

/**
 * 配信 URL に使うファイル名を作る。
 *
 * 元のファイル名が日本語でも URL は ASCII だけにする。パーセントエンコードの
 * 扱いは配信環境ごとに差が出やすく、リンク切れの原因になりやすいため。
 * お母様に見える表示名は pdfName のほうで元のまま保持している。
 */
function safeFileName(original: string): string {
  const cleaned = original
    .replace(/\.pdf$/i, '')
    .normalize('NFKD')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)

  // 日本語だけの名前だと削った結果がほぼ空になる。そのときは既定名にする。
  const stem = cleaned.length >= 3 ? cleaned : 'shinsa'

  return `${stem}-${Date.now().toString(36)}.pdf`
}

export async function uploadPdfAction(formData: FormData): Promise<UploadState> {
  await requireAdmin()

  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: 'PDFファイルを選んでください。' }
  }
  if (file.size > MAX_PDF_BYTES) {
    return { ok: false, message: `ファイルが大きすぎます（上限 ${MAX_PDF_BYTES / 1024 / 1024}MB）。` }
  }

  // 拡張子と中身の両方を確認する。PDF は必ず "%PDF-" で始まる。
  const bytes = Buffer.from(await file.arrayBuffer())
  if (!file.name.toLowerCase().endsWith('.pdf') || bytes.subarray(0, 5).toString('latin1') !== '%PDF-') {
    return { ok: false, message: 'PDFファイルではないようです。PDFを選んでください。' }
  }

  try {
    const url = await commitPdf(safeFileName(file.name), bytes)
    return { ok: true, message: `${file.name} を読み込みました。`, url, name: file.name }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'アップロードに失敗しました。' }
  }
}
