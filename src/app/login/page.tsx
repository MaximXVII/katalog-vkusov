'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Получаем IP клиента для передачи в authorize (rate limiting)
    let clientIp = 'unknown'
    try {
      const ipRes = await fetch('/api/auth/ip', { method: 'GET' })
      if (ipRes.ok) {
        const { ip } = await ipRes.json() as { ip: string }
        clientIp = ip
      }
    } catch {
      // Не критично — rate limit будет работать по 'unknown'
    }

    const result = await signIn('credentials', {
      email,
      password,
      _ip: clientIp,
      redirect: false,
    })

    setIsLoading(false)

    if (result?.error) {
      // Проверяем на блокировку по брутфорсу
      if (result.error.startsWith('TOO_MANY_ATTEMPTS:')) {
        const mins = result.error.split(':')[1]
        setError(
          'Слишком много попыток входа. ' +
          'Вход заблокирован на ' + mins + ' мин. Попробуй позже.'
        )
      } else {
        setError('Неверный email или пароль')
      }
      return
    }

    router.push('/admin')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        {/* Лого */}
        <div className="mb-8 text-center">
          <div className="text-5xl">🍳</div>
          <h1 className="mt-3 text-2xl font-bold text-gray-900">Каталог Вкусов</h1>
          <p className="mt-1 text-sm text-gray-500">Вход в панель администратора</p>
        </div>

        {/* Форма */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
        >
          <div className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
                Пароль
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            {/* Ошибка */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-orange-500 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? 'Вхожу...' : 'Войти'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
