import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/auth/ip
 * Возвращает IP-адрес клиента для использования в rate limiting.
 * Публичный маршрут — не требует авторизации.
 */
export async function GET(req: NextRequest) {
  // Читаем IP из заголовков (учитываем reverse proxy)
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded
    ? forwarded.split(',')[0].trim()
    : (req.headers.get('x-real-ip') ?? 'unknown')

  return NextResponse.json({ ip })
}
