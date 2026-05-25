'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { SITE_NAME } from '@/lib/constants'

const TELEGRAM_URL = 'https://t.me/+s7bnJzXlDw04NmUy'

import { SearchBar } from '@/components/ui/SearchBar'
import { useBookmarks } from '@/hooks/useBookmarks'
import { useCookieContext } from '@/components/layout/CookieProvider'

export function Navbar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === 'admin'

  // Передаём согласие на cookie в хук закладок
  const { cookiesAllowed } = useCookieContext()
  const { count: bookmarkCount, isReady } = useBookmarks({ cookiesAllowed })

  const [compact, setCompact] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const lastScrollY = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY
      setCompact(y > 72)
      lastScrollY.current = y
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  const isSearch    = pathname === '/search'
  const isBookmarks = pathname === '/bookmarks'

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur-sm',
        'transition-all duration-300 ease-in-out',
        compact ? 'shadow-sm' : 'shadow-none'
      )}
    >
      <div
        className={cn(
          'mx-auto flex max-w-7xl items-center gap-3 px-4 transition-all duration-300',
          compact ? 'h-12' : 'h-16'
        )}
      >
        {/* Логотип */}
        <Link
          href="/"
          className={cn(
            'flex flex-shrink-0 items-center gap-2.5 font-bold text-gray-900',
            'transition-all duration-300 hover:opacity-80'
          )}
        >
          <div className={cn('relative flex-shrink-0 transition-all duration-300', compact ? 'h-7 w-7' : 'h-9 w-9')}>
            <Image
              src="/logo.png"
              alt={SITE_NAME}
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className={cn(
            'hidden sm:inline transition-all duration-300 leading-tight',
            compact ? 'text-sm' : 'text-lg'
          )}>
            {SITE_NAME}
          </span>
        </Link>

        {/* Поиск */}
        <div className="flex-1 max-w-xl mx-auto">
          <SearchBar variant="compact" className="w-full" />
        </div>

        {/* Правые кнопки */}
        <nav className="flex items-center gap-1" aria-label="Основная навигация">
          <Link
            href="/all"
            className={cn(
              'hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium',
              'text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900',
              pathname === '/all' && 'bg-brand-50 text-brand-700'
            )}
          >
            Все рецепты
          </Link>

          <Link
            href="/about"
            className={cn(
              'hidden md:flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium',
              'text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900',
              pathname === '/about' && 'bg-brand-50 text-brand-700'
            )}
          >
            О проекте
          </Link>

          {/* Telegram */}
          {TELEGRAM_URL && (
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Присоединиться в Telegram"
              className="flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-sm font-semibold text-sky-600 transition-colors hover:bg-sky-100 hover:text-sky-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
              <span className="hidden sm:inline">Присоединиться</span>
            </a>
          )}

          {/* Закладки */}
          <Link
            href="/bookmarks"
            aria-label={`Закладки${isReady && bookmarkCount > 0 ? ': ' + bookmarkCount : ''}`}
            className={cn(
              'relative flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium',
              'text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900',
              isBookmarks && 'bg-brand-50 text-brand-700'
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24"
              fill={isBookmarks ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            <span className="hidden sm:inline">Закладки</span>
            {isReady && bookmarkCount > 0 && (
              <span className={cn(
                'flex h-4 min-w-4 items-center justify-center rounded-full px-1',
                'bg-brand-500 text-[10px] font-bold leading-none text-white',
                'absolute -right-1 -top-1 sm:static sm:ml-0.5 sm:rounded-full'
              )}>
                {bookmarkCount > 99 ? '99+' : bookmarkCount}
              </span>
            )}
          </Link>

          {/* Admin */}
          {isAdmin && (
            <Link href="/admin"
              className={cn(
                'hidden sm:flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium',
                'text-brand-500 transition-colors hover:bg-brand-50 hover:text-brand-600',
                pathname.startsWith('/admin') && 'bg-brand-50 text-brand-600'
              )}>
              <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a5 5 0 1 0 5 5 5 5 0 0 0-5-5zm0 8a3 3 0 1 1 3-3 3 3 0 0 1-3 3zm9 11v-1a7 7 0 0 0-7-7h-4a7 7 0 0 0-7 7v1" />
              </svg>
              <span>Admin</span>
            </Link>
          )}

          {/* Мобильный гамбургер */}
          <button onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={menuOpen}
            className="flex sm:hidden items-center justify-center rounded-lg p-1.5 text-gray-600 transition-colors hover:bg-gray-50">
            {menuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" x2="20" y1="12" y2="12" />
                <line x1="4" x2="20" y1="6" y2="6" />
                <line x1="4" x2="20" y1="18" y2="18" />
              </svg>
            )}
          </button>
        </nav>
      </div>

      {/* Мобильное меню */}
      {menuOpen && (
        <div className="border-t border-gray-100 bg-white px-4 py-3 sm:hidden">
          <nav className="flex flex-col gap-1">
            <Link href="/" className={cn('rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors', pathname === '/' && 'bg-brand-50 text-brand-700')}>
              Главная
            </Link>
            <Link href="/all" className={cn('rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors', pathname === '/all' && 'bg-brand-50 text-brand-700')}>
              Все рецепты
            </Link>
            <Link href="/search" className={cn('rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors', isSearch && 'bg-brand-50 text-brand-700')}>
              Поиск
            </Link>
            <Link href="/about" className={cn('rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors', pathname === '/about' && 'bg-brand-50 text-brand-700')}>
              О проекте
            </Link>
            {TELEGRAM_URL && (
              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg bg-sky-50 px-3 py-2.5 text-sm font-semibold text-sky-600 hover:bg-sky-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                Присоединиться в Telegram
              </a>
            )}
            {isAdmin && (
              <Link href="/admin" className={cn('rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-brand-500 hover:bg-brand-50', pathname.startsWith('/admin') && 'bg-brand-50')}>
                Панель администратора
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
