import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    // Пользователь авторизован — пропускаем дальше
    return NextResponse.next()
  },
  {
    callbacks: {
      // Разрешаем доступ только если есть JWT токен с role=admin
      authorized({ token }) {
        return token?.role === 'admin'
      },
    },
    pages: {
      signIn: '/login',
    },
  }
)

// Применяем middleware только к /admin/* маршрутам
// /api/admin/* защищается отдельно внутри каждого роута через getServerSession
export const config = {
  matcher: ['/admin/:path*'],
}
