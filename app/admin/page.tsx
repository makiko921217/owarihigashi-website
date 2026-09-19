import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { LogOut, TriangleAlert } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ContentEditor } from '@/components/admin/content-editor'
import { authConfigError, isLoggedIn } from '@/lib/admin-auth'
import { checkAccess, githubConfigError, loadContent } from '@/lib/github-content'
import { logoutAction } from './actions'

export const metadata: Metadata = {
  title: '管理画面｜尾張東剣道連盟',
  robots: { index: false, follow: false },
}

// cookie と GitHub の最新内容を読むので毎回サーバーで描画する
export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  // proxy.ts でも弾いているが、ここでも必ず確認する（多層防御）
  if (!(await isLoggedIn())) redirect('/admin/login')

  const configError = authConfigError() ?? githubConfigError() ?? (await checkAccess())

  let initial = { events: [], examButtons: [] } as Awaited<ReturnType<typeof loadContent>>['content']
  let sha: string | null = null
  let loadError: string | null = null

  if (!configError) {
    try {
      const loaded = await loadContent()
      initial = loaded.content
      sha = loaded.sha
    } catch (error) {
      loadError = error instanceof Error ? error.message : '内容の読み込みに失敗しました。'
    }
  }

  const blocker = configError ?? loadError

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-5">
          <div>
            <h1 className="text-xl font-bold">ホームページ管理画面</h1>
            <p className="text-sm text-muted-foreground">尾張東剣道連盟</p>
          </div>
          <form action={logoutAction}>
            <Button type="submit" variant="outline">
              <LogOut />
              ログアウト
            </Button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {blocker ? (
          <p className="mb-8 flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <span>
              サーバーの設定が足りていないため保存できません（{blocker}）。 サイトの管理者に連絡してください。
            </span>
          </p>
        ) : null}

        <ContentEditor initial={initial} sha={sha} />
      </main>
    </div>
  )
}
