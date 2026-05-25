'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface HorizontalScrollProps {
  children: React.ReactNode
  className?: string
}

export function HorizontalScroll({ children, className }: HorizontalScrollProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 8)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    checkScroll()
    el.addEventListener('scroll', checkScroll, { passive: true })
    const ro = new ResizeObserver(checkScroll)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', checkScroll)
      ro.disconnect()
    }
  }, [checkScroll])

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    const amount = el.clientWidth * 0.8
    el.scrollBy({ left: dir === 'right' ? amount : -amount, behavior: 'smooth' })
  }

  return (
    <div className={cn('relative', className)}>
      {/* Кнопка влево — только на десктопе */}
      <button
        onClick={() => scroll('left')}
        aria-label="Прокрутить влево"
        className={cn(
          'absolute left-0 top-1/2 z-10 -translate-y-1/2 -translate-x-3',
          'hidden sm:flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md',
          'border border-gray-100 text-gray-600 transition-all duration-200',
          'hover:bg-brand-50 hover:text-brand-600 hover:scale-105',
          !canScrollLeft && 'pointer-events-none opacity-0'
        )}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>

      {/* Карточки */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory [&>*]:snap-start"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children}
      </div>

      {/* Кнопка вправо — только на десктопе */}
      <button
        onClick={() => scroll('right')}
        aria-label="Прокрутить вправо"
        className={cn(
          'absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-3',
          'hidden sm:flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md',
          'border border-gray-100 text-gray-600 transition-all duration-200',
          'hover:bg-brand-50 hover:text-brand-600 hover:scale-105',
          !canScrollRight && 'pointer-events-none opacity-0'
        )}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>
    </div>
  )
}
