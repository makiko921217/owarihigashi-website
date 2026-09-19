import rawContent from '@/data/content.json'

import { contentSchema, type SiteContent } from './site-content-schema'

/**
 * サイト本体が表示する内容。
 *
 * data/content.json はリポジトリにコミットされているので、ビルド時に読み込まれる。
 * 管理画面が保存するとこのファイルへのコミットが積まれ、Vercel の自動デプロイで
 * 新しい内容に入れ替わる（反映まで数分かかるのはこのため）。
 */
const parsed = contentSchema.safeParse(rawContent)

if (!parsed.success) {
  // ビルド時に気づけるよう、ここは握りつぶさず落とす
  throw new Error(`data/content.json の形式が不正です: ${parsed.error.issues[0]?.message}`)
}

export const siteContent: SiteContent = parsed.data
