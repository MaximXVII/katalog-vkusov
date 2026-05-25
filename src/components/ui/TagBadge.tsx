import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Tag } from '@/types'

// Палитры для тегов — циклически по хешу категории
const PALETTES = [
  'bg-emerald-100 text-emerald-800 hover:bg-emerald-200',
  'bg-sky-100 text-sky-800 hover:bg-sky-200',
  'bg-violet-100 text-violet-800 hover:bg-violet-200',
  'bg-rose-100 text-rose-800 hover:bg-rose-200',
  'bg-amber-100 text-amber-800 hover:bg-amber-200',
  'bg-teal-100 text-teal-800 hover:bg-teal-200',
  'bg-orange-100 text-orange-800 hover:bg-orange-200',
  'bg-indigo-100 text-indigo-800 hover:bg-indigo-200',
  'bg-pink-100 text-pink-800 hover:bg-pink-200',
  'bg-lime-100 text-lime-800 hover:bg-lime-200',
]

// Детерминированный цвет по слагу категории — одна категория = один цвет
function getCategoryStyle(category: string): string {
  let hash = 0
  for (let i = 0; i < category.length; i++) {
    hash = (hash * 31 + category.charCodeAt(i)) >>> 0
  }
  return PALETTES[hash % PALETTES.length]
}

interface TagBadgeProps {
  tag: Tag
  static?: boolean
  className?: string
  size?: 'sm' | 'md'
}

export function TagBadge({ tag, static: isStatic, className, size = 'md' }: TagBadgeProps) {
  const base = cn(
    'inline-flex items-center rounded-full font-medium transition-colors',
    size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
    getCategoryStyle(tag.category),
    className
  )

  if (isStatic) {
    return <span className={base}>{tag.name}</span>
  }

  return (
    <Link href={`/tag/${tag.slug}`} className={base}>
      {tag.name}
    </Link>
  )
}
