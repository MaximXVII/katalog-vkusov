export default function AllPageLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 animate-pulse">
      {/* Header skeleton */}
      <div className="mb-6">
        <div className="h-10 w-40 rounded-lg bg-gray-200" />
        <div className="mt-2 h-4 w-28 rounded bg-gray-200" />
      </div>

      <div className="flex gap-8">
        {/* Sidebar skeleton */}
        <aside className="hidden w-56 flex-shrink-0 lg:block space-y-5">
          <div className="h-5 w-16 rounded bg-gray-200" />
          <div className="space-y-3">
            <div className="h-3 w-12 rounded bg-gray-200" />
            <div className="flex gap-2">
              {[80, 96, 112].map((w) => (
                <div key={w} className="h-8 rounded-full bg-gray-200" style={{ width: w }} />
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-3 w-20 rounded bg-gray-200" />
            <div className="flex flex-wrap gap-2">
              {[60, 80, 70, 90, 65, 75].map((w, i) => (
                <div key={i} className="h-8 rounded-full bg-gray-200" style={{ width: w }} />
              ))}
            </div>
          </div>
        </aside>

        {/* Recipe grid skeleton */}
        <div className="min-w-0 flex-1 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl bg-gray-100">
              <div className="aspect-[4/3] w-full bg-gray-200" />
              <div className="p-3.5 space-y-2">
                <div className="h-4 w-3/4 rounded bg-gray-200" />
                <div className="h-3 w-1/2 rounded bg-gray-200" />
                <div className="h-3 w-1/3 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
