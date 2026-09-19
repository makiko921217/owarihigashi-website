import type { Metadata } from 'next'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoginForm } from '@/components/admin/login-form'

export const metadata: Metadata = {
  title: '管理画面ログイン｜尾張東剣道連盟',
  robots: { index: false, follow: false },
}

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-16">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">ホームページ管理画面</CardTitle>
          <CardDescription className="text-base">
            パスワードを入れて「ログイン」を押してください。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  )
}
