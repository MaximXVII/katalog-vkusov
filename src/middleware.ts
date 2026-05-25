import { withAuth, NextRequestWithAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

/**
 * Edge Middleware — первый рубеж защиты.
 * Все маршруты /admin/* требуют роли 'admin' в JWT-токене.
 * Без токена/с неправильной ролью — редирект на /login.
 */
export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const token = req.nextauth?.token
    if (!token || (token as { role?: string }).role !== 'admin') {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }
    const response = NextResponse.next()
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    return response
  },
  {
    callbacks: {
      authorized({ token }) {
        return !!(token && (token as { role?: string }).role === 'admin')
      },
    },
  }
)

export const config = {
  matcher: ['/admin', '/admin/:path*'],
}
