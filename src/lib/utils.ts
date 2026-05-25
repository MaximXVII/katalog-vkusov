import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Difficulty, TagCategorySlug } from '@/types'

// ============================================================
// Стили
// ============================================================

/** Безконфликтное объединение Tailwind классов */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

// ============================================================
// Слаги
// ============================================================

const CYRILLIC_MAP: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo',
  ж: 'zh', з: 'z', и: 'i', й: 'j', к: 'k', л: 'l', м: 'm',
  н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
  ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
}

/** Транслитерация и генерация slug из заголовка */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .split('')
    .map((char) => CYRILLIC_MAP[char] ?? char)
    .join('')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ============================================================
// Время
// ============================================================

/** Форматирование времени из минут в читаемый вид */
export function formatTime(minutes: number): string {
  if (minutes <= 0) return '—'
  if (minutes < 60) return `${minutes} мин`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours} ч ${mins} мин` : `${hours} ч`
}

/** Общее время приготовления */
export function totalTime(prepTime: number, cookTime: number): string {
  return formatTime(prepTime + cookTime)
}

// ============================================================
// Лейблы
// ============================================================

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Простое',
  medium: 'Среднее',
  hard: 'Сложное',
}

export const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-red-100 text-red-800',
}

export const TAG_CATEGORY_LABELS: Record<string, string> = {
  ingredient: 'По ингредиенту',
  cuisine: 'По кухне',
  difficulty: 'По сложности',
  type: 'По типу блюда',
  cost: 'По стоимости',
}

// ============================================================
// Закладки (работает на клиенте)
// ============================================================

/** Ограничить строку по длине с многоточием */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength).trim() + '…'
}
