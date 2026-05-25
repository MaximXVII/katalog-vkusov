'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { TagCategorySlug } from '@/types'

// ── Типы ──────────────────────────────────────────────────────
interface Ingredient {
  name: string
  amount: string
  unit: string
}

interface StepItem {
  type: 'step'
  id: string
  text: string
}

interface DividerItem {
  type: 'divider'
  id: string
  emoji: string
  label: string
}

type StepOrDivider = StepItem | DividerItem

interface TagOption {
  id: string
  slug: string
  name: string
  category: TagCategorySlug
  _count: { recipes: number }
}

interface TagGroup {
  slug: TagCategorySlug
  name: string
  tags: TagOption[]
}

interface RecipeFormProps {
  recipeId?: string
  initialData?: Partial<FormData>
  availableTags: TagGroup[]
}

interface FormData {
  title: string
  slug: string
  description: string
  imageUrl: string
  prepTime: string
  cookTime: string
  difficulty: 'easy' | 'medium' | 'hard'
  ingredients: Ingredient[]
  steps: StepOrDivider[]
  tagIds: string[]
  published: boolean
  isOriginal: boolean
}

// ── Константы ──────────────────────────────────────────────────
const DRAFT_KEY = 'admin-recipe-draft'

const CATEGORY_LABELS: Record<TagCategorySlug, string> = {
  ingredient: 'Ингредиент',
  cuisine: 'Кухня',
  difficulty: 'Сложность',
  type: 'Тип блюда',
  cost: 'Стоимость',
}

// Стикеры для разделителей этапов
const DIVIDER_STICKERS = [
  { emoji: '🔪', label: 'Нарезать' },
  { emoji: '🧼', label: 'Помыть' },
  { emoji: '🥘', label: 'Варить' },
  { emoji: '🍳', label: 'Жарить' },
  { emoji: '🌡️', label: 'Нагреть' },
  { emoji: '❄️', label: 'Охладить' },
  { emoji: '🧂', label: 'Приправить' },
  { emoji: '🫙', label: 'Смешать' },
  { emoji: '⏲️', label: 'Подождать' },
  { emoji: '🍽️', label: 'Подать' },
]

// Шаблон пустого рецепта
const EMPTY_FORM: FormData = {
  title: '',
  slug: '',
  description: '',
  imageUrl: '',
  prepTime: '',
  cookTime: '',
  difficulty: 'easy',
  ingredients: [{ name: '', amount: '', unit: '' }],
  steps: [{ type: 'step', id: crypto.randomUUID(), text: '' }],
  tagIds: [],
  published: false,
  isOriginal: false,
}

// Шаблон для быстрого старта
const TEMPLATE_FORM: Partial<FormData> = {
  difficulty: 'easy',
  prepTime: '15',
  cookTime: '30',
  ingredients: [
    { name: '', amount: '200', unit: 'г' },
    { name: '', amount: '1', unit: 'шт' },
    { name: '', amount: '2', unit: 'ст.л.' },
    { name: '', amount: '', unit: 'по вкусу' },
  ],
  steps: [
    { type: 'divider', id: crypto.randomUUID(), emoji: '🧼', label: 'Подготовка' },
    { type: 'step', id: crypto.randomUUID(), text: '' },
    { type: 'step', id: crypto.randomUUID(), text: '' },
    { type: 'divider', id: crypto.randomUUID(), emoji: '🍳', label: 'Приготовление' },
    { type: 'step', id: crypto.randomUUID(), text: '' },
    { type: 'step', id: crypto.randomUUID(), text: '' },
    { type: 'divider', id: crypto.randomUUID(), emoji: '🍽️', label: 'Подача' },
    { type: 'step', id: crypto.randomUUID(), text: '' },
  ],
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[а-яё]/g, (ch) => {
      const map: Record<string, string> = {
        а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya'
      }
      return map[ch] ?? ch
    })
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ── Компонент ─────────────────────────────────────────────────
export function RecipeForm({ recipeId, initialData, availableTags }: RecipeFormProps) {
  const router = useRouter()
  const [form, setForm] = useState<FormData>(() => ({
    ...EMPTY_FORM,
    ...initialData,
    ingredients: initialData?.ingredients?.length
      ? initialData.ingredients
      : EMPTY_FORM.ingredients,
    steps: initialData?.steps?.length
      ? initialData.steps
      : EMPTY_FORM.steps,
    tagIds: initialData?.tagIds ?? [],
  }))

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>(initialData?.imageUrl ?? '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [activeSection, setActiveSection] = useState<'main' | 'ingredients' | 'steps' | 'tags'>('main')
  const [showStickers, setShowStickers] = useState(false)
  const [slugManual, setSlugManual] = useState(!!initialData?.slug)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Автосохранение черновика в localStorage
  const saveDraft = useCallback(() => {
    if (recipeId) return // Не сохраняем черновик при редактировании существующего
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form))
      setLastSaved(new Date())
    } catch {
      // ignore
    }
  }, [form, recipeId])

  // Загружаем черновик при создании нового рецепта
  useEffect(() => {
    if (!recipeId && !initialData) {
      try {
        const saved = localStorage.getItem(DRAFT_KEY)
        if (saved) {
          const parsed = JSON.parse(saved) as FormData
          if (parsed.title) {
            setForm(parsed)
          }
        }
      } catch {
        // ignore
      }
    }
  }, [recipeId, initialData])

  // Запускаем автосохранение с задержкой 30с после изменений
  useEffect(() => {
    if (recipeId) return
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
    autoSaveRef.current = setTimeout(saveDraft, 30_000)
    return () => {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
    }
  }, [form, saveDraft, recipeId])

  // Генерируем slug из title
  useEffect(() => {
    if (!slugManual && form.title) {
      setForm((prev) => ({ ...prev, slug: slugify(form.title) }))
    }
  }, [form.title, slugManual])

  // ── Изображение ───────────────────────────────────────────
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const url = URL.createObjectURL(file)
    setImagePreview(url)
    setErrors((prev) => ({ ...prev, image: '' }))
  }

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return form.imageUrl || null
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', imageFile)
      fd.append('folder', 'recipes')
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      if (!res.ok) {
        const j = await res.json()
        throw new Error(j.error ?? 'Ошибка загрузки')
      }
      const { url } = await res.json()
      return url as string
    } catch (err) {
      setErrors((prev) => ({ ...prev, image: err instanceof Error ? err.message : 'Ошибка загрузки' }))
      return null
    } finally {
      setUploading(false)
    }
  }

  // ── Ингредиенты ───────────────────────────────────────────
  const updateIngredient = (idx: number, field: keyof Ingredient, value: string) => {
    setForm((prev) => {
      const updated = [...prev.ingredients]
      updated[idx] = { ...updated[idx], [field]: value }
      return { ...prev, ingredients: updated }
    })
  }

  const addIngredient = (after?: number) => {
    setForm((prev) => {
      const updated = [...prev.ingredients]
      const idx = after !== undefined ? after + 1 : updated.length
      updated.splice(idx, 0, { name: '', amount: '', unit: '' })
      return { ...prev, ingredients: updated }
    })
  }

  const removeIngredient = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== idx),
    }))
  }

  // ── Шаги ──────────────────────────────────────────────────
  const updateStep = (id: string, text: string) => {
    setForm((prev) => ({
      ...prev,
      steps: prev.steps.map((s) => (s.id === id && s.type === 'step' ? { ...s, text } : s)),
    }))
  }

  const addStep = (afterId?: string) => {
    const newStep: StepItem = { type: 'step', id: uid(), text: '' }
    setForm((prev) => {
      if (!afterId) return { ...prev, steps: [...prev.steps, newStep] }
      const idx = prev.steps.findIndex((s) => s.id === afterId)
      const updated = [...prev.steps]
      updated.splice(idx + 1, 0, newStep)
      return { ...prev, steps: updated }
    })
  }

  const removeStep = (id: string) => {
    setForm((prev) => ({
      ...prev,
      steps: prev.steps.filter((s) => s.id !== id),
    }))
  }

  const addDivider = (sticker: typeof DIVIDER_STICKERS[0]) => {
    const newDivider: DividerItem = { type: 'divider', id: uid(), emoji: sticker.emoji, label: sticker.label }
    setForm((prev) => ({ ...prev, steps: [...prev.steps, newDivider] }))
    setShowStickers(false)
  }

  const updateDividerLabel = (id: string, label: string) => {
    setForm((prev) => ({
      ...prev,
      steps: prev.steps.map((s) => (s.id === id && s.type === 'divider' ? { ...s, label } : s)),
    }))
  }

  const removeItem = (id: string) => {
    setForm((prev) => ({ ...prev, steps: prev.steps.filter((s) => s.id !== id) }))
  }

  // ── Теги ──────────────────────────────────────────────────
  const toggleTag = (id: string) => {
    setForm((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(id)
        ? prev.tagIds.filter((t) => t !== id)
        : [...prev.tagIds, id],
    }))
  }

  // ── Шаблон ────────────────────────────────────────────────
  const applyTemplate = () => {
    if (!confirm('Применить шаблон? Текущие ингредиенты и шаги будут заменены.')) return
    setForm((prev) => ({
      ...prev,
      ...TEMPLATE_FORM,
      ingredients: TEMPLATE_FORM.ingredients ?? prev.ingredients,
      steps: TEMPLATE_FORM.steps ?? prev.steps,
    }))
  }

  // ── Валидация ─────────────────────────────────────────────
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!form.title.trim()) newErrors.title = 'Введите название'
    if (!form.description.trim()) newErrors.description = 'Введите описание'
    const stepsWithText = form.steps.filter((s) => s.type === 'step' && (s as StepItem).text.trim())
    if (stepsWithText.length === 0) newErrors.steps = 'Добавьте хотя бы один шаг'
    const filledIngredients = form.ingredients.filter((i) => i.name.trim())
    if (filledIngredients.length === 0) newErrors.ingredients = 'Добавьте хотя бы один ингредиент'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ── Сохранение ────────────────────────────────────────────
  const handleSubmit = async (publishOverride?: boolean) => {
    if (!validate()) return
    setSaving(true)

    try {
      const imageUrl = await uploadImage()
      if (imageFile && !imageUrl) {
        setSaving(false)
        return
      }

      const filledIngredients = form.ingredients.filter((i) => i.name.trim())
      let stepNum = 0
      const numberedSteps = form.steps
        .filter((s) => s.type === 'divider' || (s as StepItem).text.trim())
        .map((s) => {
          if (s.type === 'divider') {
            const d = s as DividerItem
            return { type: 'divider' as const, emoji: d.emoji, text: d.label }
          }
          stepNum++
          return { type: 'step' as const, stepNumber: stepNum, text: (s as StepItem).text }
        })

      const body = {
        title: form.title.trim(),
        slug: form.slug.trim() || slugify(form.title),
        description: form.description.trim(),
        imageUrl: imageUrl ?? '',
        prepTime: parseInt(form.prepTime || '0', 10),
        cookTime: parseInt(form.cookTime || '0', 10),
        difficulty: form.difficulty,
        ingredients: filledIngredients,
        steps: numberedSteps,
        tagIds: form.tagIds,
        published: publishOverride !== undefined ? publishOverride : form.published,
        isOriginal: form.isOriginal,
      }

      const url = recipeId ? `/api/admin/recipes/${recipeId}` : '/api/admin/recipes'
      const method = recipeId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const j = await res.json()
        throw new Error(j.error ?? 'Ошибка сохранения')
      }

      // Очищаем черновик
      try { localStorage.removeItem(DRAFT_KEY) } catch { /**/ }

      router.push('/admin')
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  // ── Перемещение блоков ────────────────────────────────────
  const moveItem = (index: number, dir: 'up' | 'down') => {
    setForm((prev) => {
      const steps = [...prev.steps]
      const target = dir === 'up' ? index - 1 : index + 1
      if (target < 0 || target >= steps.length) return prev
      ;[steps[index], steps[target]] = [steps[target], steps[index]]
      return { ...prev, steps }
    })
  }

  // ── Жирный текст: оборачиваем выделение в **...** ────────
  const applyBold = (itemId: string) => {
    const ta = document.getElementById(`step-ta-${itemId}`) as HTMLTextAreaElement | null
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const val = ta.value
    const newVal = val.slice(0, start) + '**' + val.slice(start, end) + '**' + val.slice(end)
    updateStep(itemId, newVal)
    setTimeout(() => { ta.focus(); ta.setSelectionRange(start + 2, end + 2) }, 0)
  }

  // ── Счётчик шагов (только type=step) ─────────────────────
  let stepCounter = 0

  // ── UI ────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto">
      {/* Топ-бар с действиями */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900">
            {recipeId ? 'Редактировать рецепт' : 'Новый рецепт'}
          </h1>
          {lastSaved && (
            <span className="text-xs text-gray-400">
              Черновик сохранён {lastSaved.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={applyTemplate}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            📋 Шаблон
          </button>
          {!recipeId && (
            <button
              type="button"
              onClick={() => saveDraft()}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              💾 Сохранить черновик
            </button>
          )}
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={saving || uploading}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {saving ? 'Сохранение...' : 'Сохранить черновик'}
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={saving || uploading}
            className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-colors disabled:opacity-50"
          >
            {saving ? '...' : (recipeId ? 'Сохранить' : 'Опубликовать')}
          </button>
        </div>
      </div>

      {/* Навигация по секциям */}
      <div className="mb-6 flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1">
        {([
          ['main', '📝 Основное'],
          ['ingredients', '🥕 Ингредиенты'],
          ['steps', '👨‍🍳 Шаги'],
          ['tags', '🏷️ Теги'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveSection(key)}
            className={cn(
              'flex-1 rounded-lg py-2 text-sm font-medium transition-colors',
              activeSection === key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── СЕКЦИЯ: Основное ─────────────────────────────── */}
      {activeSection === 'main' && (
        <div className="space-y-6">
          {/* Фото */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold text-gray-700">Фотография блюда</h2>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              {/* Превью */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'relative flex-shrink-0 h-40 w-60 cursor-pointer overflow-hidden rounded-xl border-2 border-dashed',
                  imagePreview ? 'border-transparent' : 'border-gray-200 hover:border-brand-300',
                  'transition-colors'
                )}
              >
                {imagePreview ? (
                  <Image src={imagePreview} alt="Preview" fill className="object-cover" sizes="240px" />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                      <circle cx="9" cy="9" r="2" />
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                    </svg>
                    <span className="text-xs">Нажми чтобы загрузить</span>
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {imagePreview ? 'Заменить фото' : 'Выбрать фото'}
                </button>
                {imagePreview && (
                  <button
                    type="button"
                    onClick={() => { setImagePreview(''); setImageFile(null); setForm((p) => ({ ...p, imageUrl: '' })) }}
                    className="ml-2 text-sm text-red-400 hover:text-red-500"
                  >
                    Удалить
                  </button>
                )}
                <p className="text-xs text-gray-400">JPEG, PNG, WebP, AVIF · до 5 МБ</p>
                {errors.image && <p className="text-xs text-red-500">{errors.image}</p>}
                {uploading && <p className="text-xs text-brand-500 animate-pulse">Загружаем фото...</p>}
                {/* URL вручную */}
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Или вставь URL изображения</label>
                  <input
                    type="url"
                    value={form.imageUrl}
                    onChange={(e) => { setForm((p) => ({ ...p, imageUrl: e.target.value })); setImagePreview(e.target.value); setImageFile(null) }}
                    placeholder="https://..."
                    className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Основные поля */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
            <h2 className="text-sm font-semibold text-gray-700">Основная информация</h2>

            {/* Название */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Название <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Борщ украинский со сметаной"
                className={cn(
                  'w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400',
                  'focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100',
                  errors.title ? 'border-red-300' : 'border-gray-200'
                )}
              />
              {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
            </div>

            {/* Slug */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                URL (slug)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 flex-shrink-0">/recipe/</span>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => { setSlugManual(true); setForm((p) => ({ ...p, slug: e.target.value })) }}
                  placeholder="borshch-ukrainskiy"
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono text-gray-900 placeholder-gray-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
                {slugManual && (
                  <button
                    type="button"
                    onClick={() => { setSlugManual(false); setForm((p) => ({ ...p, slug: slugify(p.title) })) }}
                    className="text-xs text-brand-500 hover:underline flex-shrink-0"
                  >
                    Авто
                  </button>
                )}
              </div>
            </div>

            {/* Описание */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Описание <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Сытный украинский суп с говядиной, свёклой и капустой..."
                className={cn(
                  'w-full resize-none rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400',
                  'focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100',
                  errors.description ? 'border-red-300' : 'border-gray-200'
                )}
              />
              {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
            </div>

            {/* Время и сложность */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Подготовка, мин</label>
                <input
                  type="number"
                  min="0"
                  value={form.prepTime}
                  onChange={(e) => setForm((p) => ({ ...p, prepTime: e.target.value }))}
                  placeholder="15"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Готовка, мин</label>
                <input
                  type="number"
                  min="0"
                  value={form.cookTime}
                  onChange={(e) => setForm((p) => ({ ...p, cookTime: e.target.value }))}
                  placeholder="60"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Сложность</label>
                <div className="flex gap-2">
                  {(['easy', 'medium', 'hard'] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, difficulty: d }))}
                      className={cn(
                        'flex-1 rounded-lg border py-2 text-xs font-semibold transition-colors',
                        form.difficulty === d
                          ? d === 'easy' ? 'border-green-400 bg-green-50 text-green-700'
                            : d === 'medium' ? 'border-amber-400 bg-amber-50 text-amber-700'
                            : 'border-red-400 bg-red-50 text-red-700'
                          : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                      )}
                    >
                      {d === 'easy' ? 'Легко' : d === 'medium' ? 'Средне' : 'Сложно'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Публикация */}
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <button
                type="button"
                role="switch"
                aria-checked={form.published}
                onClick={() => setForm((p) => ({ ...p, published: !p.published }))}
                className={cn(
                  'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent',
                  'transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2',
                  form.published ? 'bg-brand-500' : 'bg-gray-300'
                )}
              >
                <span className={cn(
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0',
                  'transition duration-200 ease-in-out',
                  form.published ? 'translate-x-5' : 'translate-x-0'
                )} />
              </button>
              <div>
                <p className="text-sm font-medium text-gray-700">
                  {form.published ? 'Опубликован' : 'Черновик'}
                </p>
                <p className="text-xs text-gray-400">
                  {form.published ? 'Виден всем посетителям сайта' : 'Виден только в админке'}
                </p>
              </div>
            </div>

            {/* Оригинальный рецепт */}
            <div className="flex items-center gap-3 rounded-lg border border-brand-100 bg-brand-50 px-4 py-3">
              <button
                type="button"
                role="switch"
                aria-checked={form.isOriginal}
                onClick={() => setForm((p) => ({ ...p, isOriginal: !p.isOriginal }))}
                className={cn(
                  'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent',
                  'transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2',
                  form.isOriginal ? 'bg-brand-500' : 'bg-gray-300'
                )}
              >
                <span className={cn(
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0',
                  'transition duration-200 ease-in-out',
                  form.isOriginal ? 'translate-x-5' : 'translate-x-0'
                )} />
              </button>
              <div>
                <p className="text-sm font-medium text-brand-800 flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="text-brand-500" aria-hidden>
                    <path d="M9 12l2 2 4-4" />
                    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
                  </svg>
                  Оригинальный рецепт
                </p>
                <p className="text-xs text-brand-600">
                  Рецепт максимально приближен к традиционному
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── СЕКЦИЯ: Ингредиенты ──────────────────────────── */}
      {activeSection === 'ingredients' && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">
              Ингредиенты
              <span className="ml-2 text-xs font-normal text-gray-400">
                ({form.ingredients.filter((i) => i.name.trim()).length} заполнено)
              </span>
            </h2>
            <button
              type="button"
              onClick={() => addIngredient()}
              className="flex items-center gap-1.5 rounded-lg border border-dashed border-brand-300 px-3 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Добавить ингредиент
            </button>
          </div>

          {errors.ingredients && (
            <p className="mb-4 text-xs text-red-500">{errors.ingredients}</p>
          )}

          {/* Заголовок колонок */}
          <div className="mb-2 grid grid-cols-[1fr_80px_80px_32px] gap-2 px-1">
            <span className="text-xs text-gray-400">Название</span>
            <span className="text-xs text-gray-400">Кол-во</span>
            <span className="text-xs text-gray-400">Ед. изм.</span>
            <span />
          </div>

          <div className="space-y-2">
            {form.ingredients.map((ing, idx) => (
              <div key={idx} className="group grid grid-cols-[1fr_80px_80px_32px] gap-2 items-center">
                <input
                  type="text"
                  value={ing.name}
                  onChange={(e) => updateIngredient(idx, 'name', e.target.value)}
                  placeholder={`Ингредиент ${idx + 1}`}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
                <input
                  type="text"
                  value={ing.amount}
                  onChange={(e) => updateIngredient(idx, 'amount', e.target.value)}
                  placeholder="200"
                  className="w-full rounded-lg border border-gray-200 px-2 py-2 text-sm text-center text-gray-900 placeholder-gray-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
                <input
                  type="text"
                  value={ing.unit}
                  onChange={(e) => updateIngredient(idx, 'unit', e.target.value)}
                  placeholder="г"
                  className="w-full rounded-lg border border-gray-200 px-2 py-2 text-sm text-center text-gray-900 placeholder-gray-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => addIngredient(idx)}
                    className="flex h-4 w-8 items-center justify-center rounded text-gray-300 hover:bg-brand-50 hover:text-brand-500 transition-colors"
                    title="Добавить после"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeIngredient(idx)}
                    disabled={form.ingredients.length <= 1}
                    className="flex h-4 w-8 items-center justify-center rounded text-gray-300 hover:bg-red-50 hover:text-red-400 transition-colors disabled:opacity-0"
                    title="Удалить"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Быстрые единицы */}
          <div className="mt-4 border-t border-gray-100 pt-4">
            <p className="mb-2 text-xs text-gray-400">Быстрые единицы измерения:</p>
            <div className="flex flex-wrap gap-1.5">
              {['г', 'кг', 'мл', 'л', 'шт', 'ст.л.', 'ч.л.', 'стакан', 'щепотка', 'по вкусу'].map((u) => (
                <button
                  key={u}
                  type="button"
                  className="rounded-full border border-gray-200 px-2.5 py-0.5 text-xs text-gray-600 hover:border-brand-300 hover:text-brand-600 transition-colors"
                  onClick={() => {
                    // Вставляем в последнюю незаполненную единицу
                    const lastEmpty = form.ingredients.findIndex((i) => !i.unit)
                    if (lastEmpty !== -1) updateIngredient(lastEmpty, 'unit', u)
                  }}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── СЕКЦИЯ: Шаги ─────────────────────────────────── */}
      {activeSection === 'steps' && (
        <div>
          {errors.steps && (
            <p className="mb-4 text-xs text-red-500">{errors.steps}</p>
          )}

          {/* Панель стикеров */}
          <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-700">Разделители этапов</p>
              <button
                type="button"
                onClick={() => setShowStickers((v) => !v)}
                className="text-xs text-brand-500 hover:underline"
              >
                {showStickers ? 'Свернуть' : 'Раскрыть'}
              </button>
            </div>
            {showStickers ? (
              <div className="flex flex-wrap gap-2">
                {DIVIDER_STICKERS.map((s) => (
                  <button
                    key={s.emoji}
                    type="button"
                    onClick={() => addDivider(s)}
                    className="flex flex-col items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 hover:border-brand-300 hover:bg-brand-50 transition-colors"
                  >
                    <span className="text-2xl">{s.emoji}</span>
                    <span className="text-[10px] text-gray-500 font-medium">{s.label}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {DIVIDER_STICKERS.map((s) => (
                  <button
                    key={s.emoji}
                    type="button"
                    onClick={() => addDivider(s)}
                    title={s.label}
                    className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-lg hover:border-brand-300 hover:bg-brand-50 transition-colors"
                  >
                    {s.emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Список шагов и разделителей */}
          <div className="space-y-3">
            {form.steps.map((item, idx) => {
              if (item.type === 'divider') {
                return (
                  <div key={item.id} className="flex items-center gap-2">
                    {/* Кнопки перемещения */}
                    <div className="flex flex-col gap-0.5">
                      <button type="button" onClick={() => moveItem(idx, 'up')} disabled={idx === 0}
                        className="flex h-5 w-5 items-center justify-center rounded text-gray-300 hover:bg-gray-100 hover:text-gray-500 disabled:opacity-0 transition-colors" title="Вверх">
                        <svg xmlns="http://www.w3.org/2000/svg" width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                      </button>
                      <button type="button" onClick={() => moveItem(idx, 'down')} disabled={idx === form.steps.length - 1}
                        className="flex h-5 w-5 items-center justify-center rounded text-gray-300 hover:bg-gray-100 hover:text-gray-500 disabled:opacity-0 transition-colors" title="Вниз">
                        <svg xmlns="http://www.w3.org/2000/svg" width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                      </button>
                    </div>
                    <span className="text-2xl">{item.emoji}</span>
                    <input
                      type="text"
                      value={item.label}
                      onChange={(e) => updateDividerLabel(item.id, e.target.value)}
                      className="flex-1 rounded-lg border border-dashed border-brand-300 bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-700 placeholder-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-200"
                    />
                    <button type="button" onClick={() => removeItem(item.id)}
                      className="flex-shrink-0 rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-400 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )
              }

              stepCounter++
              const num = stepCounter

              return (
                <div key={item.id} className="flex items-start gap-2">
                  {/* Кнопки перемещения */}
                  <div className="flex flex-col gap-0.5 mt-2.5">
                    <button type="button" onClick={() => moveItem(idx, 'up')} disabled={idx === 0}
                      className="flex h-5 w-5 items-center justify-center rounded text-gray-300 hover:bg-gray-100 hover:text-gray-500 disabled:opacity-0 transition-colors" title="Вверх">
                      <svg xmlns="http://www.w3.org/2000/svg" width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                    </button>
                    <button type="button" onClick={() => moveItem(idx, 'down')} disabled={idx === form.steps.length - 1}
                      className="flex h-5 w-5 items-center justify-center rounded text-gray-300 hover:bg-gray-100 hover:text-gray-500 disabled:opacity-0 transition-colors" title="Вниз">
                      <svg xmlns="http://www.w3.org/2000/svg" width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </button>
                  </div>
                  <div className="flex-shrink-0 mt-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-[11px] font-bold text-white">
                    {num}
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    {/* Кнопка жирного текста */}
                    <div className="flex items-center gap-1.5">
                      <button type="button" onClick={() => applyBold(item.id)}
                        title="Жирный текст (выдели слова и нажми)"
                        className="rounded border border-gray-200 px-2 py-0.5 text-xs font-bold text-gray-500 hover:border-brand-300 hover:text-brand-600 transition-colors">
                        Ж
                      </button>
                      <span className="text-[10px] text-gray-300">выдели текст и нажми Ж</span>
                    </div>
                    <textarea
                      id={`step-ta-${item.id}`}
                      rows={2}
                      value={item.text}
                      onChange={(e) => updateStep(item.id, e.target.value)}
                      placeholder={`Шаг ${num}: опишите действие...`}
                      className="resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                    />
                  </div>
                  <div className="flex flex-col gap-1 mt-2">
                    <button type="button" onClick={() => addStep(item.id)}
                      className="flex h-6 w-6 items-center justify-center rounded text-gray-300 hover:bg-brand-50 hover:text-brand-500 transition-colors" title="Добавить шаг после">
                      <svg xmlns="http://www.w3.org/2000/svg" width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </button>
                    <button type="button" onClick={() => removeItem(item.id)}
                      className="flex h-6 w-6 items-center justify-center rounded text-gray-300 hover:bg-red-50 hover:text-red-400 transition-colors" title="Удалить шаг">
                      <svg xmlns="http://www.w3.org/2000/svg" width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Добавить шаг */}
          <button
            type="button"
            onClick={() => addStep()}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 py-3 text-sm font-medium text-gray-500 hover:border-brand-300 hover:text-brand-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Добавить шаг
          </button>
        </div>
      )}

      {/* ── СЕКЦИЯ: Теги ─────────────────────────────────── */}
      {activeSection === 'tags' && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Теги</h2>
            {form.tagIds.length > 0 && (
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, tagIds: [] }))}
                className="text-xs text-gray-400 hover:text-red-400 transition-colors"
              >
                Сбросить все ({form.tagIds.length})
              </button>
            )}
          </div>

          {availableTags.length === 0 ? (
            <p className="text-sm text-gray-400">Теги ещё не созданы</p>
          ) : (
            <div className="space-y-6">
              {availableTags.map((group) => (
                <div key={group.slug}>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {CATEGORY_LABELS[group.slug] ?? group.name}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {group.tags.map((tag) => {
                      const isSelected = form.tagIds.includes(tag.id)
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleTag(tag.id)}
                          className={cn(
                            'rounded-full px-3 py-1.5 text-sm font-medium transition-all',
                            'border focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                            isSelected
                              ? 'border-brand-500 bg-brand-500 text-white shadow-sm'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-brand-300 hover:text-brand-600'
                          )}
                        >
                          {tag.name}
                          {tag._count.recipes > 0 && (
                            <span className={cn('ml-1.5 text-[10px]', isSelected ? 'text-brand-100' : 'text-gray-400')}>
                              {tag._count.recipes}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

              ))}
            </div>
          )}
        </div>
      )}

      {/* Нижняя панель действий */}
      <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
        <button
          type="button"
          onClick={() => router.push('/admin')}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← Назад к списку
        </button>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={saving || uploading}
            className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Сохранить черновик
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={saving || uploading}
            className="rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 transition-colors disabled:opacity-50"
          >
            {saving || uploading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {uploading ? 'Загружаем фото...' : 'Сохраняем...'}
              </span>
            ) : (
              recipeId ? 'Сохранить изменения' : 'Опубликовать рецепт'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
