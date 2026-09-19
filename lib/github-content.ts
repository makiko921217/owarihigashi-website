import 'server-only'

import { contentSchema, type SiteContent } from './site-content-schema'

/**
 * 管理画面から GitHub リポジトリを直接読み書きする層。
 *
 * 保存すると makiko921217/owarihigashi-website にコミットが積まれ、
 * それをトリガーに本番サイト側の Vercel が自動で再デプロイされる。
 * つまりこの管理画面は、お母様の Vercel アカウントには一切触れない。
 */

export const CONTENT_PATH = 'data/content.json'
export const PDF_DIR = 'public/pdf'

const API = 'https://api.github.com'

function config() {
  const token = process.env.GITHUB_TOKEN
  const repo = process.env.GITHUB_REPO
  const branch = process.env.GITHUB_BRANCH || 'main'
  return { token, repo, branch }
}

export function githubConfigError(): string | null {
  const { token, repo } = config()
  if (!token) return 'GITHUB_TOKEN が設定されていません。'
  if (!repo || !repo.includes('/')) return 'GITHUB_REPO が "owner/name" の形式で設定されていません。'
  return null
}

async function gh(path: string, init?: RequestInit) {
  const { token } = config()

  const response = await fetch(`${API}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })

  return response
}

/* ------------------------------------------------------------------ */
/* 読み込み                                                            */
/* ------------------------------------------------------------------ */

export type LoadedContent = {
  content: SiteContent
  /** 更新時の衝突検出に使う。ファイルが無い場合は null。 */
  sha: string | null
}

export async function loadContent(): Promise<LoadedContent> {
  const { repo, branch } = config()

  const response = await gh(`/repos/${repo}/contents/${CONTENT_PATH}?ref=${encodeURIComponent(branch)}`)

  if (response.status === 404) {
    // まだ data/content.json が無いリポジトリでも管理画面は開けるようにする
    return { content: { events: [], examButtons: [] }, sha: null }
  }
  if (!response.ok) {
    throw new Error(`GitHub からの読み込みに失敗しました (${response.status})`)
  }

  const file = (await response.json()) as { content: string; encoding: string; sha: string }
  const text = Buffer.from(file.content, file.encoding as BufferEncoding).toString('utf8')

  const parsed = contentSchema.safeParse(JSON.parse(text))
  if (!parsed.success) {
    throw new Error('data/content.json の内容が想定の形式ではありません。')
  }

  return { content: parsed.data, sha: file.sha }
}

/* ------------------------------------------------------------------ */
/* 書き込み                                                            */
/* ------------------------------------------------------------------ */

export class ContentConflictError extends Error {
  constructor() {
    super('ほかの場所で内容が更新されています。')
    this.name = 'ContentConflictError'
  }
}

/**
 * data/content.json を1コミットで更新する。
 * `expectedSha` が現在の SHA と食い違う場合は上書きせず中止する。
 */
export async function commitContent(content: SiteContent, expectedSha: string | null): Promise<void> {
  const { repo, branch } = config()

  const body = JSON.stringify({
    message: '行事予定・審査案内を更新（管理画面より）',
    content: Buffer.from(`${JSON.stringify(content, null, 2)}\n`, 'utf8').toString('base64'),
    branch,
    ...(expectedSha ? { sha: expectedSha } : {}),
  })

  const response = await gh(`/repos/${repo}/contents/${CONTENT_PATH}`, { method: 'PUT', body })

  // 409/422 は「こちらが持っている SHA が古い」＝ 他所で更新された、のサイン
  if (response.status === 409 || response.status === 422) throw new ContentConflictError()
  if (!response.ok) {
    throw new Error(`GitHub への保存に失敗しました (${response.status})`)
  }
}

/**
 * PDF を public/pdf/ にコミットし、サイト上での参照パスを返す。
 * 同名ファイルがあれば上書きする。
 */
export async function commitPdf(fileName: string, bytes: Buffer): Promise<string> {
  const { repo, branch } = config()
  const path = `${PDF_DIR}/${fileName}`

  // 既存ファイルがあれば sha を渡さないと 422 になる
  const existing = await gh(`/repos/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`)
  const sha = existing.ok ? ((await existing.json()) as { sha: string }).sha : undefined

  const response = await gh(`/repos/${repo}/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify({
      message: `審査案内PDFを追加: ${fileName}`,
      content: bytes.toString('base64'),
      branch,
      ...(sha ? { sha } : {}),
    }),
  })

  if (!response.ok) {
    throw new Error(`PDFのアップロードに失敗しました (${response.status})`)
  }

  return `/pdf/${fileName}`
}

/** トークンとリポジトリ権限が生きているかの確認（管理画面の起動時チェック用） */
export async function checkAccess(): Promise<string | null> {
  const { repo } = config()

  const response = await gh(`/repos/${repo}`)
  if (response.status === 401) return 'GITHUB_TOKEN が無効か期限切れです。'
  if (response.status === 404) return `リポジトリ ${repo} が見つからない、またはトークンに権限がありません。`
  if (!response.ok) return `GitHub への接続に失敗しました (${response.status})`

  const data = (await response.json()) as { permissions?: { push?: boolean } }
  if (!data.permissions?.push) return `リポジトリ ${repo} への書き込み権限がトークンにありません。`

  return null
}
