import 'server-only'

import { createHmac, scryptSync, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

const IS_PROD = process.env.NODE_ENV === 'production'

/**
 * 本番では __Host- 接頭辞を使う。ブラウザ側で「Secure かつ Path=/ かつ Domain 指定なし」
 * を強制してくれるので、サブドメインからの cookie 上書き攻撃を防げる。
 */
export const SESSION_COOKIE = IS_PROD ? '__Host-oh_admin' : 'oh_admin_dev'

const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 14 // 14日
const SCRYPT_KEYLEN = 64

/* ------------------------------------------------------------------ */
/* パスワード                                                          */
/* ------------------------------------------------------------------ */

/**
 * ADMIN_PASSWORD_HASH の形式: `scrypt:<salt hex>:<key hex>`
 * 生成は scripts/admin-password.mjs が行う（形式を変えるときは両方直すこと）。
 *
 * 区切りに `$` を使わないのは、.env ファイルの変数展開で `$xxx` が
 * 別の値に置き換わって壊れるため。
 */
function storedHash(): string | null {
  const hash = process.env.ADMIN_PASSWORD_HASH
  return hash && hash.startsWith('scrypt:') ? hash : null
}

export function verifyPassword(password: string): boolean {
  const stored = storedHash()
  if (!stored) return false

  const [, saltHex, keyHex] = stored.split(':')
  if (!saltHex || !keyHex) return false

  let expected: Buffer
  try {
    expected = Buffer.from(keyHex, 'hex')
  } catch {
    return false
  }
  if (expected.length !== SCRYPT_KEYLEN) return false

  // scrypt は意図的に遅い。総当たりの1回あたりのコストを上げる役割も兼ねる。
  const actual = scryptSync(password.normalize('NFKC'), Buffer.from(saltHex, 'hex'), SCRYPT_KEYLEN)
  return timingSafeEqual(actual, expected)
}

/* ------------------------------------------------------------------ */
/* セッション                                                          */
/* ------------------------------------------------------------------ */

function sessionSecret(): string | null {
  const secret = process.env.SESSION_SECRET
  return secret && secret.length >= 32 ? secret : null
}

/**
 * 現在のパスワードから作る短い指紋。トークンに埋めておくことで、
 * パスワードを変えた瞬間に既存のログインセッションが全部無効になる。
 */
function passwordFingerprint(): string {
  const stored = storedHash() ?? ''
  return createHmac('sha256', sessionSecret() ?? '').update(stored).digest('hex').slice(0, 16)
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

export function createSessionToken(): string | null {
  const secret = sessionSecret()
  if (!secret) return null

  const payload = Buffer.from(
    JSON.stringify({ exp: Date.now() + SESSION_MAX_AGE_SEC * 1000, fp: passwordFingerprint() })
  ).toString('base64url')

  return `${payload}.${sign(payload, secret)}`
}

export function verifySessionToken(token: string | undefined): boolean {
  const secret = sessionSecret()
  if (!secret || !token) return false

  const [payload, signature] = token.split('.')
  if (!payload || !signature) return false

  const expected = Buffer.from(sign(payload, secret))
  const actual = Buffer.from(signature)
  if (expected.length !== actual.length || !timingSafeEqual(actual, expected)) return false

  try {
    const { exp, fp } = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (typeof exp !== 'number' || Date.now() > exp) return false
    return fp === passwordFingerprint()
  } catch {
    return false
  }
}

export async function startSession(): Promise<boolean> {
  const token = createSessionToken()
  if (!token) return false

  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_MAX_AGE_SEC,
  })
  return true
}

export async function endSession(): Promise<void> {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

export async function isLoggedIn(): Promise<boolean> {
  const store = await cookies()
  return verifySessionToken(store.get(SESSION_COOKIE)?.value)
}

/**
 * Server Action / ページの入口で必ず呼ぶ。proxy.ts のガードだけに頼らないこと
 * （Server Action は proxy を通らない経路で呼ばれうるため）。
 */
export async function requireAdmin(): Promise<void> {
  if (!(await isLoggedIn())) throw new Error('認証されていません。ログインし直してください。')
}

/** ログインに必要な環境変数の確認。 */
export function authConfigError(): string | null {
  if (!storedHash()) return 'ADMIN_PASSWORD_HASH が設定されていません。'
  if (!sessionSecret()) return 'SESSION_SECRET が未設定、または32文字未満です。'
  return null
}
