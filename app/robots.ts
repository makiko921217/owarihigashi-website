import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  // 管理画面用デプロイは丸ごと検索避けする（本番サイトの重複扱いを防ぐ）
  if (process.env.ADMIN_MODE === '1') {
    return { rules: { userAgent: '*', disallow: '/' } }
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/admin',
    },
  }
}
