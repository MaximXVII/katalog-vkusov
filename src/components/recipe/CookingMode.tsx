'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { RecipeStep } from '@/types'

interface CookingModeProps {
  steps: RecipeStep[]
  title: string
}

export function CookingMode({ steps, title }: CookingModeProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [current, setCurrent] = useState(0)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

  // Только реальные шаги (без разделителей) для режима готовки
  const realSteps = steps.filter((s) => s.type !== 'divider')

  // Запрос блокировки экрана при входе в режим
  const acquireWakeLock = useCallback(async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen')
      }
    } catch {
      // wakeLock недоступен — игнорируем
    }
  }, [])

  const releaseWakeLock = useCallback(async () => {
    try {
      await wakeLockRef.current?.release()
      wakeLockRef.current = null
    } catch {
      // игнорируем
    }
  }, [])

  const open = useCallback(() => {
    setCurrent(0)
    setIsOpen(true)
    acquireWakeLock()
  }, [acquireWakeLock])

  const close = useCallback(() => {
    setIsOpen(false)
    releaseWakeLock()
  }, [releaseWakeLock])

  const prev = useCallback(() => setCurrent((c) => Math.max(0, c - 1)), [])
  const next = useCallback(() => setCurrent((c) => Math.min(realSteps.length - 1, c + 1)), [realSteps.length])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next()
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   prev()
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, next, prev, close])

  // Swipe support
  const touchStart = useRef<number>(0)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStart.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      if (diff > 0) next()
      else prev()
    }
  }

  if (realSteps.length === 0) return null

  const step = realSteps[current]
  const progress = ((current + 1) / realSteps.length) * 100

  // Функция рендера жирного текста
  function renderBold(text: string): React.ReactNode {
    const parts = text.split(/\*\*(.+?)\*\*/g)
    return parts.map((part, i) =>
      i % 2 === 1 ? <strong key={i} className="font-bold text-white">{part}</strong> : part
    )
  }

  return (
    <>
      {/* Кнопка запуска */}
      <button
        type="button"
        onClick={open}
        className="flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-600 hover:shadow-md active:scale-95"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24"
          fill="currentColor" stroke="none">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
        Начать готовить
      </button>

      {/* Fullscreen overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-gray-900 text-white"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Шапка */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/50">
                {title}
              </p>
              <p className="text-sm font-medium text-white/80">
                Шаг {current + 1} из {realSteps.length}
              </p>
            </div>
            <button
              type="button"
              onClick={close}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
              aria-label="Закрыть"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Прогресс-бар */}
          <div className="h-1 w-full bg-white/10">
            <div
              className="h-full bg-brand-400 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Контент шага */}
          <div className="flex flex-1 flex-col items-center justify-center px-8 py-10 text-center">
            {/* Номер */}
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-500 text-2xl font-extrabold text-white shadow-lg">
              {current + 1}
            </div>

            {/* Текст */}
            <p className="max-w-lg text-xl leading-relaxed text-white/90 sm:text-2xl">
              {renderBold(step.text)}
            </p>
          </div>

          {/* Навигация */}
          <div className="flex items-center justify-between gap-4 px-5 pb-8 pt-4">
            <button
              type="button"
              onClick={prev}
              disabled={current === 0}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Предыдущий шаг"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width={22} height={22} viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>

            {/* Точки */}
            <div className="flex gap-1.5">
              {realSteps.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrent(i)}
                  className="h-2 rounded-full transition-all duration-200"
                  style={{
                    width: i === current ? 20 : 8,
                    backgroundColor: i === current ? '#f97316' : 'rgba(255,255,255,0.3)',
                  }}
                  aria-label={`Шаг ${i + 1}`}
                />
              ))}
            </div>

            {current < realSteps.length - 1 ? (
              <button
                type="button"
                onClick={next}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 transition-colors hover:bg-brand-400"
                aria-label="Следующий шаг"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width={22} height={22} viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                onClick={close}
                className="flex h-12 items-center gap-2 rounded-full bg-green-500 px-5 font-semibold text-sm transition-colors hover:bg-green-400"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Готово!
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}
