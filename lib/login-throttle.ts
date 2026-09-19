import 'server-only'

/**
 * ログインの総当たり対策。
 *
 * サーバーレスなのでインスタンスごとのメモリしか持てず、これ単体では完璧ではない。
 * 本当の防波堤は (1) scrypt がハッシュ1回あたり数十msかかること、
 * (2) パスワードが十分に長いこと の2つで、これはその上に重ねる追加の壁。
 * より厳密にやるなら Vercel ダッシュボードの Firewall で /admin/login に
 * レート制限ルールを足す。
 */

const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 15 * 60 * 1000

type Record = { failures: number[]; lockedUntil: number }

const attempts = new Map<string, Record>()

function prune(record: Record, now: number) {
  record.failures = record.failures.filter((at) => now - at < WINDOW_MS)
}

export function checkThrottle(key: string): { allowed: true } | { allowed: false; retryAfterSec: number } {
  const now = Date.now()
  const record = attempts.get(key)
  if (!record) return { allowed: true }

  if (record.lockedUntil > now) {
    return { allowed: false, retryAfterSec: Math.ceil((record.lockedUntil - now) / 1000) }
  }

  prune(record, now)
  return { allowed: true }
}

export function recordFailure(key: string): void {
  const now = Date.now()
  const record = attempts.get(key) ?? { failures: [], lockedUntil: 0 }

  prune(record, now)
  record.failures.push(now)
  if (record.failures.length >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_MS
    record.failures = []
  }

  attempts.set(key, record)

  // 際限なく増えないように古い記録を落とす
  if (attempts.size > 1000) {
    for (const [k, v] of attempts) {
      if (v.lockedUntil < now && v.failures.length === 0) attempts.delete(k)
    }
  }
}

export function recordSuccess(key: string): void {
  attempts.delete(key)
}
