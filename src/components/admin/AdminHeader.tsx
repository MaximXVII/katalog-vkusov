'use client'

import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { href: '/admin', label: 'Рецепты' },
  { href: '/admin/tags', label: 'Теги' },
]

export function AdminHeader() {
  const pathname = usePathname()

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Лого и навигация */}
        <div className="flex items-center gap-8">
          <Link href="/admin" className="flex items-center gap-2.5">
            <span className="text-2xl">🍳</span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-orange-500">Admin</p>
              <p className="text-sm font-bold text-gray-900">Мои Рецепты</p>
            </div>
          </Link>

          <nav className="flex items-center gap-1">
            {NAV_LINKS.map(({ href, label }) => {
              const isActive = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-orange-50 text-orange-600'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {label}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Правая часть */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            target="_blank"
            className="text-sm text-gray-500 hover:text-gray-800 transition"
          >
            ↗ Сайт
          </Link>

          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            Выйти
          </button>
        </div>
      </div>
    </header>
  )
}
