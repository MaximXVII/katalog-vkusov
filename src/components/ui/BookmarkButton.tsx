'use client'

import { useBookmarks } from '@/hooks/useBookmarks'
import { useCookieContext } from '@/components/layout/CookieProvider'
import { cn } from '@/lib/utils'

interface BookmarkButtonProps {
  recipeId: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function BookmarkButton({ recipeId, className, size = 'md' }: BookmarkButtonProps) {
  const { cookiesAllowed } = useCookieContext()
  const { isBookmarked, toggleBookmark, isReady } = useBookmarks({ cookiesAllowed })
  const saved = isReady && isBookmarked(recipeId)

  const sizeClasses = { sm: 'w-7 h-7', md: 'w-9 h-9', lg: 'w-11 h-11' }
  const iconSize    = { sm: 14,         md: 18,         lg: 22          }

  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggleBookmark(recipeId)
      }}
      aria-label={saved ? 'Убрать из закладок' : 'Добавить в закладки'}
      className={cn(
        'flex items-center justify-center rounded-full transition-all duration-200',
        'bg-white/90 shadow-sm hover:scale-110 active:scale-95',
        saved ? 'text-brand-500' : 'text-gray-400 hover:text-brand-500',
        sizeClasses[size],
        className
      )}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={iconSize[size]}
        height={iconSize[size]}
        viewBox="0 0 24 24"
        fill={saved ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    </button>
  )
}
