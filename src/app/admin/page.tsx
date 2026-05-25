'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface AdminRecipe {
  id: string
  slug: string
  title: string
  imageUrl: string
  difficulty: 'easy' | 'medium' | 'hard'
  published: boolean
  createdAt: string
  updatedAt: string
  _count: { tags: number }
  tags: { tag: { name: string; category: string } }[]
}

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: 'Легко',
  medium: 'Средне',
  hard: 'Сложно',
}

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-amber-100 text-amber-700',
  hard: 'bg-red-100 text-red-700',
}

export default function AdminDashboardPage() {
  const [recipes, setRecipes] = useState<AdminRecipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/recipes')
      if (!res.ok) throw new Error('Ошибка загрузки')
      const json = await res.json()
      setRecipes(json.data ?? [])
    } catch {
      setError('Не удалось загрузить рецепты')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Удалить рецепт «${title}»? Действие необратимо.`)) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/recipes/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setRecipes((prev) => prev.filter((r) => r.id !== id))
    } catch {
      alert('Ошибка при удалении')
    } finally {
      setDeleting(null)
    }
  }

  const filtered = recipes.filter((r) => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filter === 'all' ||
      (filter === 'published' && r.published) ||
      (filter === 'draft' && !r.published)
    return matchSearch && matchFilter
  })

  const publishedCount = recipes.filter((r) => r.published).length
  const draftCount = recipes.filter((r) => !r.published).length

  return (
    <div>
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Все рецепты</h1>
          <p className="mt-1 text-sm text-gray-500">
            Всего: {recipes.length} · Опубликовано: {publishedCount} · Черновиков: {draftCount}
          </p>
        </div>
        <Link
          href="/admin/recipe/new"
          className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Новый рецепт
        </Link>
      </div>

      {/* Фильтры */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Поиск по названию..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div className="flex rounded-lg border border-gray-200 bg-white overflow-hidden">
          {(['all', 'published', 'draft'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors',
                filter === f
                  ? 'bg-brand-500 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              {f === 'all' ? 'Все' : f === 'published' ? 'Опубликованные' : 'Черновики'}
            </button>
          ))}
        </div>
      </div>

      {/* Список */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
          {error}
          <button onClick={load} className="ml-2 underline">Повторить</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-400 text-sm">
            {search ? 'Ничего не найдено' : 'Рецептов пока нет'}
          </p>
          {!search && (
            <Link href="/admin/recipe/new" className="mt-4 inline-block text-sm font-medium text-brand-600 hover:underline">
              Создать первый рецепт →
            </Link>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Рецепт</th>
                <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Сложность</th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Статус</th>
                <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Обновлён</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((recipe) => (
                <tr key={recipe.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        {recipe.imageUrl ? (
                          <Image
                            src={recipe.imageUrl}
                            alt={recipe.title}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xl">🍽️</div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 line-clamp-1">{recipe.title}</p>
                        <p className="text-xs text-gray-400">/{recipe.slug}</p>
                        <p className="sm:hidden mt-1">
                          <span className={cn('inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold', recipe.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                            {recipe.published ? 'Опубликован' : 'Черновик'}
                          </span>
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-4 py-3">
                    <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold', DIFFICULTY_COLOR[recipe.difficulty])}>
                      {DIFFICULTY_LABEL[recipe.difficulty]}
                    </span>
                  </td>
                  <td className="hidden md:table-cell px-4 py-3">
                    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', recipe.published ? 'text-green-600' : 'text-gray-400')}>
                      <span className={cn('h-1.5 w-1.5 rounded-full', recipe.published ? 'bg-green-500' : 'bg-gray-300')} />
                      {recipe.published ? 'Опубликован' : 'Черновик'}
                    </span>
                  </td>
                  <td className="hidden lg:table-cell px-4 py-3 text-xs text-gray-400">
                    {new Date(recipe.updatedAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/recipe/${recipe.slug}`}
                        target="_blank"
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                        title="Открыть на сайте"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        </svg>
                      </Link>
                      <Link
                        href={`/admin/recipe/${recipe.id}/edit`}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                        title="Редактировать"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        </svg>
                      </Link>
                      <button
                        onClick={() => handleDelete(recipe.id, recipe.title)}
                        disabled={deleting === recipe.id}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40"
                        title="Удалить"
                      >
                        {deleting === recipe.id ? (
                          <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
