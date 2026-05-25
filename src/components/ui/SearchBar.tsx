'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSearch } from '@/hooks/useSearch'
import { cn } from '@/lib/utils'
import { formatTime } from '@/lib/utils'
import Image from 'next/image'

interface SearchBarProps {
  /** Полноэкранный режим (страница /search) или компактный (в Navbar) */
  variant?: 'compact' | 'full'
  className?: string
  /** Начальный запрос (для страницы поиска) */
  defaultQuery?: string
  /** Callback при выборе результата или нажатии Enter */
  onSearch?: (query: string) => void
}

export function SearchBar({ variant = 'compact', className, defaultQuery = '', onSearch }: SearchBarProps) {
  const router = useRouter()
  const { query, setQuery, results, isLoading, hasResults, clear } = useSearch()
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Инициализируем из defaultQuery (страница поиска)
  const displayQuery = defaultQuery || query

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim() || defaultQuery.trim()
    if (!q) return
    setIsOpen(false)
    if (onSearch) {
      onSearch(q)
    } else {
      router.push(`/search?q=${encodeURIComponent(q)}`)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    setIsOpen(true)
  }

  const handleResultClick = (slug: string) => {
    clear()
    setIsOpen(false)
    router.push(`/recipe/${slug}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      clear()
      setIsOpen(false)
      inputRef.current?.blur()
    }
  }

  return (
    <div className={cn('relative', className)}>
      <form onSubmit={handleSubmit} role="search">
        <div className="relative flex items-center">
          {/* Иконка поиска */}
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </span>

          <input
            ref={inputRef}
            type="search"
            value={query || defaultQuery}
            onChange={handleChange}
            onFocus={() => hasResults && setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Поиск рецептов..."
            aria-label="Поиск рецептов"
            className={cn(
              'w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-gray-900',
              'placeholder:text-gray-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200',
              'transition-all duration-200',
              variant === 'full'
                ? 'py-3 text-base'
                : 'py-2 text-sm'
            )}
          />

          {/* Кнопка очистки */}
          {(query || defaultQuery) && (
            <button
              type="button"
              onClick={() => { clear(); onSearch?.('') }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Очистить поиск"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </form>

      {/* Dropdown с результатами (только в compact-режиме) */}
      {variant === 'compact' && isOpen && (query.length >= 2) && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
          {isLoading && (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              Поиск...
            </div>
          )}

          {!isLoading && !hasResults && (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              Ничего не найдено
            </div>
          )}

          {!isLoading && hasResults && (
            <ul role="listbox" className="max-h-80 overflow-y-auto divide-y divide-gray-50">
              {results.slice(0, 6).map((recipe) => (
                <li key={recipe.id}>
                  <button
                    type="button"
                    onClick={() => handleResultClick(recipe.slug)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                  >
                    {recipe.imageUrl && (
                      <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg">
                        <Image
                          src={recipe.imageUrl}
                          alt={recipe.title}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{recipe.title}</p>
                      <p className="text-xs text-gray-400">
                        {formatTime(recipe.prepTime + recipe.cookTime)}
                      </p>
                    </div>
                  </button>
                </li>
              ))}

              {results.length > 6 && (
                <li>
                  <button
                    type="button"
                    onClick={handleSubmit as unknown as React.MouseEventHandler}
                    className="w-full px-4 py-2.5 text-center text-sm font-medium text-brand-600 hover:bg-brand-50 transition-colors"
                  >
                    Показать все результаты ({results.length})
                  </button>
                </li>
              )}
            </ul>
          )}
        </div>
      )}

      {/* Overlay чтобы закрыть dropdown */}
      {variant === 'compact' && isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
          aria-hidden
        />
      )}
    </div>
  )
}
