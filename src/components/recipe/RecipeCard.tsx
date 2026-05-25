import Link from 'next/link'
import Image from 'next/image'
import { cn, formatTime, DIFFICULTY_LABELS, DIFFICULTY_COLORS } from '@/lib/utils'
import { TagBadge } from '@/components/ui/TagBadge'
import { BookmarkButton } from '@/components/ui/BookmarkButton'
import type { RecipeCard as RecipeCardType } from '@/types'

interface RecipeCardProps {
  recipe: RecipeCardType
  compact?: boolean
  className?: string
}

export function RecipeCard({ recipe, compact = false, className }: RecipeCardProps) {
  const totalMinutes = recipe.prepTime + recipe.cookTime

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm',
        'transition-all duration-300 hover:-translate-y-1 hover:shadow-md',
        compact ? 'w-56 flex-shrink-0 xs:w-64' : 'w-full',
        className
      )}
    >
      {/* Картинка */}
      <Link href={`/recipe/${recipe.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-gray-100">
        {recipe.imageUrl ? (
          <Image
            src={recipe.imageUrl}
            alt={recipe.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes={compact ? '256px' : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'}
            quality={70}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-100 to-brand-200">
            <div className="relative h-14 w-14 opacity-60">
              <Image src="/logo.png" alt="" fill className="object-contain" />
            </div>
          </div>
        )}

        {/* Бейдж сложности */}
        <span className={cn(
          'absolute left-2.5 top-2.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
          DIFFICULTY_COLORS[recipe.difficulty]
        )}>
          {DIFFICULTY_LABELS[recipe.difficulty]}
        </span>

        {/* Кнопка закладки */}
        <div className="absolute right-2.5 top-2.5">
          <BookmarkButton recipeId={recipe.id} size="sm" />
        </div>
      </Link>

      {/* Тело карточки */}
      <div className="flex flex-1 flex-col gap-2 p-3.5">
        {/* Заголовок + бейдж оригинала */}
        <Link href={`/recipe/${recipe.slug}`} className="flex items-start gap-1.5">
          <h3 className={cn(
            'flex-1 min-w-0 font-semibold text-gray-900 leading-snug',
            'transition-colors group-hover:text-brand-600',
            compact ? 'line-clamp-2 text-sm' : 'line-clamp-2 text-base'
          )}>
            {recipe.title}
          </h3>
          {recipe.isOriginal && (
            <span
              title="Оригинальный рецепт — максимально приближен к традиционному"
              className="mt-0.5 flex-shrink-0 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-white"
              aria-label="Оригинальный рецепт"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width={10} height={10} viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
          )}
        </Link>

        {/* Описание (только в обычном режиме) */}
        {!compact && recipe.description && (
          <p className="line-clamp-2 text-sm text-gray-500">{recipe.description}</p>
        )}

        {/* Время */}
        {totalMinutes > 0 && (
          <div className="flex items-center gap-1.5 text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" width={13} height={13} viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="text-xs">{formatTime(totalMinutes)}</span>
          </div>
        )}

        {/* Теги */}
        {recipe.tags.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
            {recipe.tags.slice(0, compact ? 2 : 3).map((tag) => (
              <TagBadge key={tag.id} tag={tag} size="sm" />
            ))}
            {recipe.tags.length > (compact ? 2 : 3) && (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                +{recipe.tags.length - (compact ? 2 : 3)}
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
