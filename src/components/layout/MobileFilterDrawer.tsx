'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { FilterSidebar } from '@/components/layout/FilterSidebar'
import type { TagCategory } from '@/types'

interface MobileFilterDrawerProps {
  categories: TagCategory[]
  baseTagSlug?: string
}

export function MobileFilterDrawer({ categories, baseTagSlug }: MobileFilterDrawerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const searchParams = useSearchParams()

  // Считаем активные фильтры для бейджа на кнопке
  const activeTags = (searchParams.get('tags') ?? '').split(',').filter((s) => s && s !== baseTagSlug)
  const activeTime = searchParams.get('maxTime') ? 1 : 0
  const filterCount = activeTags.length + activeTime

  // Закрываем при смене параметров
  useEffect(() => {
    setIsOpen(false)
  }, [searchParams])

  // Блокируем прокрутку страницы при открытом дровере
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <>
      {/* Кнопка "Фильтры" — только на мобиле */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="lg:hidden flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="8" y1="12" x2="16" y2="12" />
          <line x1="11" y1="18" x2="13" y2="18" />
        </svg>
        Фильтры
        {filterCount > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
            {filterCount}
          </span>
        )}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden
        />
      )}

      {/* Drawer снизу */}
      <div
        className={[
          'fixed bottom-0 left-0 right-0 z-50 lg:hidden',
          'flex flex-col rounded-t-2xl bg-white shadow-2xl',
          'transition-transform duration-300 ease-out',
          isOpen ? 'translate-y-0' : 'translate-y-full',
        ].join(' ')}
        style={{ maxHeight: '85vh' }}
      >
        {/* Ручка */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-gray-200" />
        </div>

        {/* Заголовок */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Фильтры</h2>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200"
            aria-label="Закрыть"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Контент фильтров — скроллится */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <FilterSidebar categories={categories} baseTagSlug={baseTagSlug} />
        </div>

        {/* Кнопка "Применить" */}
        <div className="border-t border-gray-100 px-5 py-4">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
          >
            Показать результаты
          </button>
        </div>
      </div>
    </>
  )
}
