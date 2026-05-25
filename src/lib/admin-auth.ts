import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'

/**
 * Проверяет что запрос идёт от авторизованного администратора.
 * Используется в каждом /api/admin/* роуте.
 *
 * @returns null если всё ок, NextResponse с 401 если не авторизован
 *
 * Использование:
 *   const deny = await requireAdmin()
 *   if (deny) return deny
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions)

  if (!session || (session.user as { role?: string })?.role !== 'admin') {
    return NextResponse.json(
      { error: 'Доступ запрещён. Войдите как администратор.' },
      { status: 401 }
    )
  }

  return null
}

/**
 * Валидирует тело запроса по списку обязательных полей.
 * Возвращает массив названий отсутствующих полей.
 */
export function validateRequired(
  body: Record<string, unknown>,
  fields: string[]
): string[] {
  return fields.filter((f) => {
    const val = body[f]
    return val === undefined || val === null || val === ''
  })
}
