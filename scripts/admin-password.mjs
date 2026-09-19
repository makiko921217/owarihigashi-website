#!/usr/bin/env node
/**
 * 管理画面のパスワードと環境変数を作るスクリプト。
 *
 *   node scripts/admin-password.mjs            … パスワードを自動生成する
 *   node scripts/admin-password.mjs "好きな文字列" … 自分で決めたパスワードを使う
 *
 * 出力された 2 行を Vercel の Environment Variables に登録する。
 * パスワード本体はどこにも保存されないので、控えを忘れないこと。
 */
import { randomBytes, scryptSync } from 'node:crypto'

// 形式は lib/admin-auth.ts の storedHash / verifyPassword と対になっている

const WORDS = 'abcdefghijkmnpqrstuvwxyz23456789' // 紛らわしい l/1/o/0 は除外

function generatePassword() {
  const bytes = randomBytes(20)
  const chars = Array.from(bytes, (byte) => WORDS[byte % WORDS.length])
  // 4文字ずつ区切って読み上げ・書き写しをしやすくする
  return chars.join('').replace(/(.{4})(?=.)/g, '$1-')
}

const password = process.argv[2] ?? generatePassword()

if (password.length < 12) {
  console.error('パスワードは12文字以上にしてください。')
  process.exit(1)
}

const salt = randomBytes(16)
const key = scryptSync(password.normalize('NFKC'), salt, 64)
const hash = `scrypt:${salt.toString('hex')}:${key.toString('hex')}`
const sessionSecret = randomBytes(32).toString('hex')

console.log(`
────────────────────────────────────────────────────────
 パスワード（お母様に渡すもの・これは保存されません）
────────────────────────────────────────────────────────

   ${password}

────────────────────────────────────────────────────────
 Vercel の Environment Variables に登録する 2 つ
────────────────────────────────────────────────────────

ADMIN_PASSWORD_HASH
${hash}

SESSION_SECRET
${sessionSecret}

※ SESSION_SECRET を変えると全員ログアウトされます。
※ パスワードを変えたときも、既存のログインは自動で無効になります。
`)
