'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import { cn } from '@/lib/utils'
import { TAG_CATEGORY_LABELS } from '@/lib/utils'
import type { TagCategory, TagCategorySlug } from '@/types'

interface FilterSidebarProps {
  categories: TagCategory[]
  baseTagSlug?: string
  className?: string
}

const TIME_OPTIONS = [
  { label: 'до 20 мин', value: '20' },
  { label: 'до 45 мин', value: '45' },
  { label: 'до 1.5 часов', value: '90' },
]

export function FilterSidebar({ categories, baseTagSlug, className }: FilterSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const activeTags = (searchParams.get('tags') ?? '').split(',').filter(Boolean)
  const excludedTags = (searchParams.get('exclude') ?? '').split(',').filter(Boolean)
  const activeTime = searchParams.get('maxTime') ?? ''
  const activeOriginal = searchParams.get('original') === 'true'

  const navigate = useCallback((url: string) => {
    startTransition(() => {
      router.push(url, { scroll: false })
    })
  }, [router])

  const toggleTag = useCallback((slug: string) => {
    const params = new URLSearchParams(searchParams.toString())
    const currentActive = new Set(activeTags)
    const currentExcluded = new Set(excludedTags)

    if (currentExcluded.has(slug)) {
      currentExcluded.delete(slug)
    } else if (currentActive.has(slug)) {
      currentActive.delete(slug)
      currentExcluded.add(slug)
    } else {
      currentActive.add(slug)
    }

    const activeFiltered = Array.from(currentActive).filter((s) => s !== baseTagSlug)
    const excludedFiltered = Array.from(currentExcluded).filter((s) => s !== baseTagSlug)

    if (activeFiltered.length > 0) params.set('tags', activeFiltered.join(','))
    else params.delete('tags')
    if (excludedFiltered.length > 0) params.set('exclude', excludedFiltered.join(','))
    else params.delete('exclude')
    params.delete('page')
    navigate(`${pathname}?${params.toString()}`)
  }, [activeTags, excludedTags, baseTagSlug, pathname, navigate, searchParams])

  const toggleTime = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (activeTime === value) params.delete('maxTime')
    else params.set('maxTime', value)
    params.delete('page')
    navigate(`${pathname}?${params.toString()}`)
  }, [activeTime, pathname, navigate, searchParams])

  const toggleOriginal = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (activeOriginal) params.delete('original')
    else params.set('original', 'true')
    params.delete('page')
    navigate(`${pathname}?${params.toString()}`)
  }, [activeOriginal, pathname, navigate, searchParams])

  const clearAll = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('tags')
    params.delete('exclude')
    params.delete('maxTime')
    params.delete('original')
    params.delete('page')
    navigate(`${pathname}?${params.toString()}`)
  }, [pathname, navigate, searchParams])

  const hasActiveFilters =
    activeTags.filter((s) => s !== baseTagSlug).length > 0 ||
    excludedTags.length > 0 || !!activeTime || activeOriginal

  const filteredCategories = categories.filter((cat) => cat.tags && cat.tags.length > 0)

  return (
    <aside className={cn('relative w-full', className)}>
      {/* Индикатор загрузки — не блокирует клики */}
      {isPending && (
        <div className="pointer-events-none absolute top-0 right-0 z-10">
          <div className="flex items-center gap-1.5 rounded-full border border-gray-100 bg-white/90 px-3 py-1 shadow-sm">
            <svg className="h-3 w-3 animate-spin text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-xs font-medium text-gray-500">Загрузка...</span>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Заголовок + кнопка сброса */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Фильтры</h2>
          {hasActiveFilters && (
            <button onClick={clearAll} className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors">
              Сбросить
            </button>
          )}
        </div>

        {/* Фильтр по времени */}
        <div>
          <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Время</h3>
          <div className="flex flex-wrap gap-2">
            {TIME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => toggleTime(opt.value)}
                className={cn(
                  'rounded-full px-3 py-1 text-sm font-medium transition-all duration-150',
                  'border focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                  activeTime === opt.value
                    ? 'border-brand-500 bg-brand-500 text-white shadow-sm'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-brand-300 hover:text-brand-600'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Фильтр: только оригинальные */}
        <div>
          <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Оригинальность</h3>
          <button
            onClick={toggleOriginal}
            className={cn(
              'flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium transition-all duration-150',
              'border focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
              activeOriginal
                ? 'border-brand-500 bg-brand-500 text-white shadow-sm'
                : 'border-gray-200 bg-white text-gray-700 hover:border-brand-300 hover:text-brand-600'
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} viewBox="0 0 24 24"
              fill={activeOriginal ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}
              strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            Только оригинальные
          </button>
        </div>

        {/* Группы тегов */}
        {filteredCategories.map((category) => (
          <div key={category.slug}>
            <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
              {TAG_CATEGORY_LABELS[category.slug as TagCategorySlug] ?? category.name}
            </h3>
            <div className="flex flex-wrap gap-2">
              {category.tags.map((tag) => {
                const isBase = tag.slug === baseTagSlug
                const isActive = isBase || activeTags.includes(tag.slug)
                const isExcluded = !isBase && excludedTags.includes(tag.slug)
                return (
                  <button
                    key={tag.id}
                    onClick={() => !isBase && toggleTag(tag.slug)}
                    disabled={isBase}
                    className={cn(
                      'rounded-full px-3 py-1 text-sm font-medium transition-all duration-150',
                      'border focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                      isExcluded
                        ? 'border-red-500 bg-red-500 text-white shadow-sm'
                        : isActive
                        ? 'border-brand-500 bg-brand-500 text-white shadow-sm'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-brand-300 hover:text-brand-600',
                      isBase && 'cursor-default opacity-80'
                    )}
                  >
                    {tag.name}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}
