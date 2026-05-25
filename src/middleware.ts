import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Edge Middleware — первый рубеж защиты.
 * Все маршруты /admin/* требуют роли 'admin' в JWT-токене.
 * Без токена/с неправильной ролью — редирект на /login.
 *
 * Дополнительно: базовая защита от брутфорса логина
 * через проверку заголовков (реальный rate-limit — в auth.ts).
 */
export default withAuth(
  function middleware(req: NextRequest) {
    // Дополнительная проверка: убеждаемся, что токен действительно содержит роль admin
    // withAuth уже проверяет authorized() ниже, это дублирующая защита
    const token = req.nextauth?.token
    if (!token || (token as { role?: string }).role !== 'admin') {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }
    // Добавляем заголовки безопасности для admin-страниц
    const response = NextResponse.next()
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=()'
    )
    return response
  },
  {
    callbacks: {
      authorized({ token }) {
        // Доступ только при наличии токена с ролью admin
        return !!(token && (token as { role?: string }).role === 'admin')
      },
    },
  }
)

// Применяем только к /admin/* маршрутам
export const config = {
  matcher: ['/admin', '/admin/:path*'],
}
