'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

interface PaginationProps {
  page: number
  totalPages: number
}

export function Pagination({ page, totalPages }: PaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  if (totalPages <= 1) return null

  const goTo = (p: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(p))
    router.push(`${pathname}?${params.toString()}`, { scroll: true })
  }

  // Показываем максимум 5 кнопок вокруг текущей страницы
  const getPages = () => {
    const pages: (number | 'ellipsis')[] = []
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    pages.push(1)
    if (page > 3) pages.push('ellipsis')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i)
    }
    if (page < totalPages - 2) pages.push('ellipsis')
    pages.push(totalPages)
    return pages
  }

  const btnBase =
    'flex h-9 min-w-9 items-center justify-center rounded-lg px-2.5 text-sm font-medium transition-colors'

  return (
    <nav aria-label="Пагинация" className="flex items-center justify-center gap-1 pt-8">
      {/* Назад */}
      <button
        onClick={() => goTo(page - 1)}
        disabled={page <= 1}
        aria-label="Предыдущая страница"
        className={cn(btnBase, 'border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>

      {/* Страницы */}
      {getPages().map((p, i) =>
        p === 'ellipsis' ? (
          <span key={`e${i}`} className={cn(btnBase, 'text-gray-400 cursor-default')}>…</span>
        ) : (
          <button
            key={p}
            onClick={() => goTo(p)}
            aria-current={p === page ? 'page' : undefined}
            className={cn(
              btnBase,
              p === page
                ? 'bg-brand-500 text-white shadow-sm'
                : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
            )}
          >
            {p}
          </button>
        )
      )}

      {/* Вперёд */}
      <button
        onClick={() => goTo(page + 1)}
        disabled={page >= totalPages}
        aria-label="Следующая страница"
        className={cn(btnBase, 'border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>
    </nav>
  )
}
