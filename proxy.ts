import { NextResponse, type NextRequest } from 'next/server'

import { SESSION_COOKIE, verifySessionToken } from '@/lib/admin-auth'

/**
 * ADMIN_MODE が立っているデプロイは「管理画面専用」として振る舞う。
 *
 * このリポジトリは2箇所にデプロイされる:
 *   - 本番サイト（お母様の Vercel）… ADMIN_MODE なし。公開ページだけを出す
 *   - 管理画面（あなたの Vercel）… ADMIN_MODE=1。公開ページは出さず /admin へ寄せる
 */
const ADMIN_MODE = process.env.ADMIN_MODE === '1'

/**
 * 注意: これは「1枚目」の防御でしかない。Server Action は proxy を通らない
 * 経路で呼ばれうるので、各 Action の中でも requireAdmin() を呼ぶこと。
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith('/admin')) {
    // robots.txt はクローラに「全面拒否」を伝える必要があるので素通しする
    if (ADMIN_MODE && pathname !== '/robots.txt') {
      // 管理画面デプロイでは、公開ページの重複公開を避けて /admin に寄せる
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    return NextResponse.next()
  }

  // 本番サイト側のデプロイには管理画面を出さない。
  // 環境変数が無いのでログインは元々できないが、入れないフォームを
  // 会員に見せても混乱するだけなので、そもそも存在しない扱いにする。
  if (!ADMIN_MODE) return NextResponse.redirect(new URL('/', request.url))

  const loggedIn = verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)

  if (pathname === '/admin/login') {
    if (loggedIn) return NextResponse.redirect(new URL('/admin', request.url))
    return applySecurityHeaders(NextResponse.next())
  }

  if (!loggedIn) return NextResponse.redirect(new URL('/admin/login', request.url))

  return applySecurityHeaders(NextResponse.next())
}

function applySecurityHeaders(response: NextResponse) {
  // 管理画面は検索エンジンにもアーカイブにも載せない
  response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'no-referrer')
  response.headers.set('Cache-Control', 'no-store, max-age=0')
  return response
}

export const config = {
  // 静的ファイルと画像最適化は素通しする
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|pdf)$).*)'],
}
