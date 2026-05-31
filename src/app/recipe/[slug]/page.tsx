import { notFound } from 'next/navigation'
import { Suspense, cache } from 'react'
import Image from 'next/image'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { recipeFullSelect, transformFull } from '@/lib/recipe-helpers'
import { REVALIDATE_SECONDS, SITE_NAME, SITE_URL } from '@/lib/constants'
import {
  formatTime,
  totalTime,
  DIFFICULTY_LABELS,
  DIFFICULTY_COLORS,
  cn,
} from '@/lib/utils'
import { TagBadge } from '@/components/ui/TagBadge'
import { BookmarkButton } from '@/components/ui/BookmarkButton'
import { SimilarRecipesRow } from '@/components/recipe/SimilarRecipesRow'
import { OriginalBadge } from '@/components/recipe/OriginalBadge'
import { IngredientsSection } from '@/components/recipe/IngredientsSection'
import { ShareButtons } from '@/components/recipe/ShareButtons'
import { PrintButton } from '@/components/recipe/PrintButton'
import { CookingMode } from '@/components/recipe/CookingMode'
import type { Ingredient, RecipeStep } from '@/types'

// Кешируем запрос — generateMetadata и страница используют один и тот же вызов
const getRecipe = cache(async (slug: string) => {
  return prisma.recipe.findUnique({
    where: { slug, published: true },
    select: recipeFullSelect,
  })
})

// Пребилд всех опубликованных рецептов при деплое → статические HTML с CDN
export async function generateStaticParams() {
  const recipes = await prisma.recipe.findMany({
    where: { published: true },
    select: { slug: true },
  })
  return recipes.map((r) => ({ slug: r.slug }))
}

export const revalidate = REVALIDATE_SECONDS

interface Props {
  params: { slug: string }
}

// Парсинг **жирного** текста
function renderBold(text: string): React.ReactNode {
  const parts = text.split(/\*\*(.+?)\*\*/g)
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold text-gray-900">{part}</strong> : part
  )
}

// ── generateMetadata ──────────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const raw = await getRecipe(params.slug)
  if (!raw) return { title: 'Рецепт не найден' }
  const recipe = transformFull(raw)

  const url = `${SITE_URL}/recipe/${recipe.slug}`
  const images = recipe.imageUrl
    ? [{ url: recipe.imageUrl, width: 1200, height: 630, alt: recipe.title }]
    : []

  return {
    title: recipe.title,
    description: recipe.description,
    alternates: { canonical: url },
    openGraph: {
      title: `${recipe.title} | ${SITE_NAME}`,
      description: recipe.description,
      url,
      type: 'article',
      siteName: SITE_NAME,
      locale: 'ru_RU',
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${recipe.title} | ${SITE_NAME}`,
      description: recipe.description,
      images: recipe.imageUrl ? [recipe.imageUrl] : [],
    },
  }
}

// ── Schema.org/Recipe JSON-LD ─────────────────────────────────
function RecipeJsonLd({
  recipe,
  ingredients,
  steps,
}: {
  recipe: ReturnType<typeof transformFull>
  ingredients: Ingredient[]
  steps: RecipeStep[]
}) {
  const difficultyMap: Record<string, string> = {
    easy: 'Легко',
    medium: 'Средне',
    hard: 'Сложно',
  }

  const toIsoDuration = (minutes: number): string => {
    if (minutes <= 0) return 'PT0M'
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return `PT${h > 0 ? `${h}H` : ''}${m > 0 ? `${m}M` : ''}`
  }

  const realSteps = steps.filter((s) => s.type !== 'divider')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.title,
    description: recipe.description,
    image: recipe.imageUrl ? [recipe.imageUrl] : undefined,
    url: `${SITE_URL}/recipe/${recipe.slug}`,
    inLanguage: 'ru',
    author: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    datePublished: recipe.createdAt instanceof Date
      ? recipe.createdAt.toISOString()
      : new Date().toISOString(),
    dateModified: recipe.updatedAt instanceof Date
      ? recipe.updatedAt.toISOString()
      : new Date().toISOString(),
    prepTime: recipe.prepTime > 0 ? toIsoDuration(recipe.prepTime) : undefined,
    cookTime: recipe.cookTime > 0 ? toIsoDuration(recipe.cookTime) : undefined,
    totalTime: (recipe.prepTime + recipe.cookTime) > 0
      ? toIsoDuration(recipe.prepTime + recipe.cookTime)
      : undefined,
    recipeIngredient: ingredients.map((i) =>
      [i.amount, i.unit, i.name].filter(Boolean).join(' ')
    ),
    recipeInstructions: realSteps.map((step, i) => ({
      '@type': 'HowToStep',
      position: step.stepNumber ?? i + 1,
      text: step.text.replace(/\*\*(.+?)\*\*/g, '$1'),
      image: step.imageUrl || undefined,
    })),
    recipeCategory: recipe.tags
      .filter((t) => t.category === 'type')
      .map((t) => t.name)
      .join(', ') || undefined,
    recipeCuisine: recipe.tags
      .filter((t) => t.category === 'cuisine')
      .map((t) => t.name)
      .join(', ') || undefined,
    keywords: recipe.tags.map((t) => t.name).join(', ') || undefined,
    difficulty: difficultyMap[recipe.difficulty] ?? recipe.difficulty,
  }

  const clean = JSON.parse(JSON.stringify(jsonLd))

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(clean) }}
    />
  )
}

// ── Страница рецепта ──────────────────────────────────────────
export default async function RecipePage({ params }: Props) {
  const raw = await getRecipe(params.slug)
  if (!raw) notFound()

  const recipe = transformFull(raw)
  const ingredients = (recipe.ingredients as unknown) as Ingredient[]
  const steps = (recipe.steps as unknown) as RecipeStep[]
  const total = recipe.prepTime + recipe.cookTime

  let stepNum = 0

  return (
    <>
      <RecipeJsonLd recipe={recipe} ingredients={ingredients} steps={steps} />

      <article className="mx-auto max-w-4xl px-4 py-8">

        {/* ── Картинка ── */}
        <div className="mb-6">
          {recipe.imageUrl ? (
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-gray-100 shadow-md">
              <Image
                src={recipe.imageUrl}
                alt={recipe.title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 896px) 100vw, 896px"
              />
            </div>
          ) : (
            <div className="flex aspect-video w-full items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 to-brand-200">
              <span className="text-6xl" aria-hidden>🍳</span>
            </div>
          )}
        </div>

        {/* ── Заголовок + закладка + бейдж ── */}
        <div className="mb-3 flex items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5 min-w-0">
            <h1 className="text-3xl font-extrabold leading-tight text-gray-900 sm:text-4xl">
              {recipe.title}
            </h1>
            <OriginalBadge show={(recipe as { isOriginal?: boolean }).isOriginal ?? false} />
          </div>
          <BookmarkButton recipeId={recipe.id} size="lg" className="flex-shrink-0 mt-1 print-hide" />
        </div>

        {/* ── Действия: шеринг, печать, готовить ── */}
        <div className="mb-5 flex flex-wrap items-center gap-2 print-hide">
          <ShareButtons slug={recipe.slug} title={recipe.title} />
          <PrintButton className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100" />
          {steps.filter((s) => s.type !== 'divider').length > 0 && (
            <CookingMode steps={steps} title={recipe.title} />
          )}
        </div>

        {/* ── Мета-блок: время, сложность ── */}
        <div className="mb-6 flex flex-wrap gap-5 rounded-xl bg-gray-50 px-5 py-4 border border-gray-100">
          {recipe.prepTime > 0 && (
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Подготовка</span>
              <span className="text-base font-bold text-gray-800">{formatTime(recipe.prepTime)}</span>
            </div>
          )}
          {recipe.cookTime > 0 && (
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Приготовление</span>
              <span className="text-base font-bold text-gray-800">{formatTime(recipe.cookTime)}</span>
            </div>
          )}
          {total > 0 && (
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Итого</span>
              <span className="text-base font-bold text-brand-600">{totalTime(recipe.prepTime, recipe.cookTime)}</span>
            </div>
          )}
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Сложность</span>
            <span className={cn('inline-flex w-fit rounded-full px-2.5 py-0.5 text-sm font-semibold', DIFFICULTY_COLORS[recipe.difficulty])}>
              {DIFFICULTY_LABELS[recipe.difficulty]}
            </span>
          </div>
        </div>

        {/* ── Теги ── */}
        {recipe.tags.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2 print-hide">
            {recipe.tags.map((tag) => (
              <TagBadge key={tag.id} tag={tag} />
            ))}
          </div>
        )}

        {/* ── Основная сетка: ингредиенты | шаги ── */}
        <div className="grid gap-8 md:grid-cols-5">

          {/* Ингредиенты с множителем */}
          {ingredients.length > 0 && (
            <div className="md:col-span-2">
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-5">
                <IngredientsSection ingredients={ingredients} />
              </div>
            </div>
          )}

          {/* Шаги приготовления */}
          {steps.length > 0 && (
            <section className={cn(ingredients.length > 0 ? 'md:col-span-3' : 'md:col-span-5')}>
              <h2 className="mb-5 text-xl font-bold text-gray-900">Приготовление</h2>
              <div className="space-y-4">
                {steps.map((step, i) => {
                  if (step.type === 'divider') {
                    return (
                      <div key={i} className="flex items-center gap-3 py-2">
                        <div className="h-px flex-1 bg-gray-200" />
                        <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-500">
                          <span className="text-base">{step.emoji}</span>
                          {step.text && <span>{step.text}</span>}
                        </span>
                        <div className="h-px flex-1 bg-gray-200" />
                      </div>
                    )
                  }

                  stepNum++
                  return (
                    <div key={i} className="flex gap-4">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white shadow-sm">
                        {stepNum}
                      </div>
                      <div className="flex-1 pt-0.5">
                        <p className="text-sm leading-relaxed text-gray-700">
                          {renderBold(step.text)}
                        </p>
                        {step.imageUrl && (
                          <div className="relative mt-3 aspect-video overflow-hidden rounded-xl">
                            <Image
                              src={step.imageUrl}
                              alt={`Шаг ${stepNum}`}
                              fill
                              className="object-cover"
                              sizes="(max-width: 896px) 100vw, 600px"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </div>

        {/* ── Описание (под ингредиентами и шагами) ── */}
        {recipe.description && (
          <div className="mt-8 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-2 flex items-center gap-2 text-base font-bold text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                className="text-brand-400" aria-hidden>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
              О блюде
            </h2>
            <p className="text-sm leading-relaxed text-gray-600">{recipe.description}</p>
          </div>
        )}

        {/* ── Похожие рецепты ── */}
        <div className="mt-14 border-t border-gray-100 pt-10 print-hide">
          <Suspense fallback={null}>
            <SimilarRecipesRow recipeSlug={params.slug} />
          </Suspense>
        </div>

      </article>
    </>
  )
}
