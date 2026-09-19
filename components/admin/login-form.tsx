'use client'

import { useActionState } from 'react'
import { KeyRound, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { loginAction, type ActionState } from '@/app/admin/actions'

const initialState: ActionState = { ok: false, message: '' }

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState)

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="password" className="text-base">
          パスワード
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          autoFocus
          required
          className="h-12 text-base"
        />
      </div>

      {state.message ? (
        <p role="alert" className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.message}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} size="lg" className="h-12 w-full text-base">
        {pending ? <Loader2 className="animate-spin" /> : <KeyRound />}
        ログイン
      </Button>
    </form>
  )
}
