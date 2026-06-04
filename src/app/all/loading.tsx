import { RecipeGridSkeleton } from '@/components/recipe/RecipeGridSkeleton'

export default function AllLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <div className="h-9 w-48 animate-pulse rounded-lg bg-gray-200" />
        <div className="mt-1 h-4 w-36 animate-pulse rounded-full bg-gray-100" />
      </div>
      <div className="flex gap-8">
        {/* Заглушка сайдбара */}
        <aside className="hidden w-56 flex-shrink-0 lg:block">
          <div className="space-y-4">
            <div className="h-5 w-20 animate-pulse rounded-full bg-gray-200" />
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-24 animate-pulse rounded-full bg-gray-100" />
                <div className="flex flex-wrap gap-2">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-7 w-16 animate-pulse rounded-full bg-gray-100" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          <RecipeGridSkeleton count={12} />
        </div>
      </div>
    </div>
  )
}
