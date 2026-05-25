'use client'

import { useState, useRef, useEffect } from 'react'

interface OriginalBadgeProps {
  show: boolean
}

const TEXT =
  'Максимально приближен к оригиналу — традиционный рецепт, приготовленный так, как его готовили изначально.'

export function OriginalBadge({ show }: OriginalBadgeProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  if (!show) return null

  return (
    <>
      {/* Бейдж — обёртка с group для тултипа */}
      <div ref={ref} className="relative inline-flex">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label="Оригинальный рецепт — подробнее"
          className="group flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 transition-colors hover:bg-brand-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
        >
          {/* Галочка */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={15}
            height={15}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-brand-500"
            aria-hidden
          >
            <path d="M9 12l2 2 4-4" />
            <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
          </svg>
          <span className="text-xs font-semibold text-brand-700">Оригинал</span>

          {/* Тултип — внутри group, показывается при ховере на десктопе */}
          <span
            role="tooltip"
            className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2
                       hidden -translate-x-1/2 rounded-xl bg-gray-900 px-3 py-2
                       text-xs leading-relaxed text-white shadow-lg
                       group-hover:block w-60 text-center whitespace-normal"
          >
            {TEXT}
            <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
          </span>
        </button>
      </div>

      {/* Модалка — на любом устройстве при клике */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
          aria-modal
          role="dialog"
        >
          {/* Оверлей */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          {/* Карточка */}
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mb-3 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={20}
                height={20}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="flex-shrink-0 text-brand-500"
                aria-hidden
              >
                <path d="M9 12l2 2 4-4" />
                <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
              </svg>
              <span className="font-bold text-gray-900">Оригинальный рецепт</span>
            </div>
            <p className="text-sm leading-relaxed text-gray-600">{TEXT}</p>
            <button
              onClick={() => setOpen(false)}
              className="mt-4 w-full rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
            >
              Понятно
            </button>
          </div>
        </div>
      )}
    </>
  )
}
