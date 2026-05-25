'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { Ingredient } from '@/types'

interface IngredientsSectionProps {
  ingredients: Ingredient[]
}

// Множители: 1 → 1.5 → 2.25 → 3.375 → ... (или назад)
const STEPS = [1, 1.5, 2, 2.5, 3, 4, 5]

/** Красиво форматируем число: убираем лишние знаки после запятой */
function formatNum(n: number): string {
  if (Number.isInteger(n)) return String(n)
  // До 2 знаков, убирая хвостовые нули
  return parseFloat(n.toFixed(2)).toString()
}

/** Пытаемся умножить числовую часть строки amount */
function scaleAmount(raw: string, factor: number): string {
  if (!raw.trim()) return raw
  // Парсим первое число в строке (может быть "200", "1.5", "½" — простой случай)
  const match = raw.match(/^(\d+(?:[.,]\d+)?)(.*)$/)
  if (!match) return raw
  const num = parseFloat(match[1].replace(',', '.'))
  if (isNaN(num)) return raw
  return formatNum(num * factor) + match[2]
}

export function IngredientsSection({ ingredients }: IngredientsSectionProps) {
  const [stepIdx, setStepIdx] = useState(0)
  const factor = STEPS[stepIdx]

  const canIncrease = stepIdx < STEPS.length - 1
  const canDecrease = stepIdx > 0

  return (
    <section>
      {/* Заголовок + множитель */}
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-xl font-bold text-gray-900">Ингредиенты</h2>

        {/* Контрол порций */}
        <div className="ml-auto flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 p-0.5">
          {/* Минус */}
          <button
            type="button"
            onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
            disabled={!canDecrease}
            aria-label="Уменьшить порции"
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-lg text-gray-600 transition-colors',
              canDecrease
                ? 'hover:bg-white hover:text-brand-600 hover:shadow-sm'
                : 'cursor-not-allowed text-gray-300'
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
            </svg>
          </button>

          {/* Текущий множитель */}
          <button
            type="button"
            onClick={() => setStepIdx(0)}
            title="Сбросить до исходного"
            className={cn(
              'min-w-[3.5rem] rounded-lg px-2 py-0.5 text-center text-xs font-bold transition-colors',
              stepIdx === 0
                ? 'text-gray-400'
                : 'bg-brand-500 text-white hover:bg-brand-600'
            )}
          >
            {stepIdx === 0 ? '×1' : `×${formatNum(factor)}`}
          </button>

          {/* Плюс */}
          <button
            type="button"
            onClick={() => setStepIdx((i) => Math.min(STEPS.length - 1, i + 1))}
            disabled={!canIncrease}
            aria-label="Увеличить порции"
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-lg text-gray-600 transition-colors',
              canIncrease
                ? 'hover:bg-white hover:text-brand-600 hover:shadow-sm'
                : 'cursor-not-allowed text-gray-300'
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      </div>

      {/* Подсказка при изменении */}
      {stepIdx > 0 && (
        <p className="mb-3 text-xs text-brand-600 font-medium">
          Количество пересчитано ×{formatNum(factor)} — нажми на множитель чтобы сбросить
        </p>
      )}

      {/* Список ингредиентов */}
      <ul className="space-y-2.5">
        {ingredients.map((ing, i) => {
          const scaledAmount = scaleAmount(ing.amount ?? '', factor)
          return (
            <li
              key={i}
              className="flex items-baseline justify-between gap-3 border-b border-gray-100 pb-2.5 last:border-0 last:pb-0"
            >
              <span className="text-sm text-gray-800">{ing.name}</span>
              <span className="flex-shrink-0 text-sm font-semibold text-gray-700">
                {scaledAmount}{ing.unit ? ` ${ing.unit}` : ''}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
