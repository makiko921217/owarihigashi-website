import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // 管理画面から最大10MBのPDFを送るため。multipart のオーバーヘッド分を上乗せしている。
      bodySizeLimit: '12mb',
    },
  },
}

export default nextConfig
