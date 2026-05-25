'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

// ── Типы ──────────────────────────────────────────────────────
interface Category {
  id: string
  slug: string
  name: string
  icon: string | null
  displayOrder: number
  _count: { tags: number }
}

interface Tag {
  id: string
  slug: string
  name: string
  category: string
  imageUrl: string
  _count: { recipes: number }
}

// ── Хук: загрузка данных ──────────────────────────────────────
function useAdminData() {
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [catRes, tagRes] = await Promise.all([
        fetch('/api/admin/categories'),
        fetch('/api/admin/tags'),
      ])
      if (!catRes.ok || !tagRes.ok) throw new Error()
      const [cats, tgs] = await Promise.all([catRes.json(), tagRes.json()])
      setCategories(cats as Category[])
      setTags(tgs as Tag[])
    } catch {
      setError('Не удалось загрузить данные')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return { categories, setCategories, tags, setTags, loading, error, reload: load }
}

// ── Загрузка картинки тега ────────────────────────────────────
function TagImageUpload({ tag, onUpdate }: {
  tag: Tag
  onUpdate: (id: string, imageUrl: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const upRes = await fetch('/api/admin/upload', { method: 'POST', body: formData })
      if (!upRes.ok) { alert('Ошибка загрузки файла'); return }
      const { url } = await upRes.json() as { url: string }

      const saveRes = await fetch(`/api/admin/tags/${tag.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: url }),
      })
      if (!saveRes.ok) { alert('Ошибка сохранения'); return }
      onUpdate(tag.id, url)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async () => {
    if (!confirm('Удалить картинку тега?')) return
    const res = await fetch(`/api/admin/tags/${tag.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl: '' }),
    })
    if (res.ok) onUpdate(tag.id, '')
  }

  return (
    <div className="flex items-center gap-1.5">
      {/* Превью */}
      {tag.imageUrl ? (
        <div className="group/img relative h-7 w-7 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
          <Image src={tag.imageUrl} alt={tag.name} fill className="object-cover" sizes="28px" />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute inset-0 hidden items-center justify-center rounded-md bg-black/50 text-white group-hover/img:flex"
            title="Удалить картинку"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width={10} height={10} viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      ) : (
        <div className="h-7 w-7 flex-shrink-0 rounded-md border border-dashed border-gray-300 bg-gray-50" />
      )}

      {/* Кнопка загрузки */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="rounded-md p-1 text-gray-400 hover:bg-white hover:text-brand-500 hover:shadow-sm transition-all disabled:opacity-50"
        title={tag.imageUrl ? 'Заменить картинку' : 'Добавить картинку'}
      >
        {uploading ? (
          <svg xmlns="http://www.w3.org/2000/svg" width={13} height={13} viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
            className="animate-spin">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width={13} height={13} viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        )}
      </button>
    </div>
  )
}

// ── Строка тега ───────────────────────────────────────────────
function TagRow({ tag, categories, onSave, onDelete, onImageUpdate }: {
  tag: Tag
  categories: Category[]
  onSave: (id: string, name: string, category: string) => Promise<void>
  onDelete: (id: string, name: string, recipeCount: number) => void
  onImageUpdate: (id: string, imageUrl: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(tag.name)
  const [category, setCategory] = useState(tag.category)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  const handleSave = async () => {
    if (!name.trim() || (name === tag.name && category === tag.category)) {
      setName(tag.name); setCategory(tag.category); setEditing(false); return
    }
    setSaving(true)
    try { await onSave(tag.id, name.trim(), category); setEditing(false) }
    finally { setSaving(false) }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') { setName(tag.name); setCategory(tag.category); setEditing(false) }
  }

  if (editing) return (
    <div className="flex items-center gap-2 rounded-lg border border-brand-300 bg-brand-50 px-3 py-2">
      <input ref={inputRef} type="text" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={handleKey}
        className="flex-1 min-w-0 bg-transparent text-sm font-medium text-gray-900 focus:outline-none" />
      <select value={category} onChange={(e) => setCategory(e.target.value)}
        className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-400">
        {categories.map((c) => <option key={c.slug} value={c.slug}>{c.icon} {c.name}</option>)}
      </select>
      <button onClick={handleSave} disabled={saving || !name.trim()}
        className="flex-shrink-0 rounded-md bg-brand-500 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-50 transition-colors">
        {saving ? '...' : 'OK'}
      </button>
      <button onClick={() => { setName(tag.name); setCategory(tag.category); setEditing(false) }}
        className="flex-shrink-0 rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 transition-colors">
        Отмена
      </button>
    </div>
  )

  return (
    <div className="group flex items-center gap-2 rounded-lg border border-transparent px-3 py-2 hover:border-gray-200 hover:bg-gray-50 transition-all">
      {/* Превью + загрузка картинки */}
      <TagImageUpload tag={tag} onUpdate={onImageUpdate} />

      <span className="flex-1 min-w-0 text-sm font-medium text-gray-800 truncate">{tag.name}</span>
      <span className="flex-shrink-0 text-[10px] font-mono text-gray-400 hidden sm:block">/{tag.slug}</span>
      {tag._count.recipes > 0 && (
        <span className="flex-shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
          {tag._count.recipes} рец.
        </span>
      )}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setEditing(true)} title="Редактировать"
          className="rounded-md p-1 text-gray-400 hover:bg-white hover:text-brand-500 hover:shadow-sm transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          </svg>
        </button>
        <button onClick={() => onDelete(tag.id, tag.name, tag._count.recipes)} title="Удалить"
          className="rounded-md p-1 text-gray-400 hover:bg-white hover:text-red-500 hover:shadow-sm transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// ── Кнопка добавить тег ───────────────────────────────────────
function AddTagButton({ defaultCategory, categories, onCreate }: {
  defaultCategory: string
  categories: Category[]
  onCreate: (name: string, category: string) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [category, setCategory] = useState(defaultCategory)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setCategory(defaultCategory) }, [defaultCategory])
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 50) }, [open])

  const handleCreate = async () => {
    if (!name.trim()) return
    setSaving(true)
    try { await onCreate(name.trim(), category); setName(''); setOpen(false) }
    finally { setSaving(false) }
  }

  if (!open) return (
    <button onClick={() => setOpen(true)}
      className="flex w-full items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-400 hover:border-brand-300 hover:text-brand-500 transition-colors">
      <svg xmlns="http://www.w3.org/2000/svg" width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
      Добавить тег
    </button>
  )

  return (
    <div className="flex items-center gap-2 rounded-lg border border-brand-300 bg-brand-50 px-3 py-2">
      <input ref={inputRef} type="text" value={name} onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setName(''); setOpen(false) } }}
        placeholder="Название нового тега..."
        className="flex-1 min-w-0 bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
      />
      <select value={category} onChange={(e) => setCategory(e.target.value)}
        className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-400">
        {categories.map((c) => <option key={c.slug} value={c.slug}>{c.icon} {c.name}</option>)}
      </select>
      <button onClick={handleCreate} disabled={saving || !name.trim()}
        className="flex-shrink-0 rounded-md bg-brand-500 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-50 transition-colors">
        {saving ? '...' : 'Создать'}
      </button>
      <button onClick={() => { setName(''); setOpen(false) }}
        className="flex-shrink-0 rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 transition-colors">
        Отмена
      </button>
    </div>
  )
}

// ── Управление категориями ────────────────────────────────────
const POPULAR_ICONS = ['🥕','🌍','⭐','🍽️','💰','🌶️','🥗','🍖','🥐','🫕','🧁','🍜','🥘','🫙','🍱']

function CategoriesManager({ categories, setCategories }: {
  categories: Category[]
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>
}) {
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newIcon, setNewIcon] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editIcon, setEditIcon] = useState('')
  const newInputRef = useRef<HTMLInputElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (creating) setTimeout(() => newInputRef.current?.focus(), 50) }, [creating])
  useEffect(() => { if (editingId) setTimeout(() => editInputRef.current?.focus(), 50) }, [editingId])

  const handleCreate = async () => {
    if (!newName.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), icon: newIcon.trim() || null }),
      })
      if (!res.ok) { const j = await res.json(); alert(j.error); return }
      const cat = await res.json() as Category
      setCategories((prev) => [...prev, cat])
      setNewName(''); setNewIcon(''); setCreating(false)
    } finally { setSaving(false) }
  }

  const handleSaveEdit = async (cat: Category) => {
    if (!editName.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), icon: editIcon.trim() || null }),
      })
      if (!res.ok) { const j = await res.json(); alert(j.error); return }
      const updated = await res.json() as Category
      setCategories((prev) => prev.map((c) => c.id === cat.id ? updated : c))
      setEditingId(null)
    } finally { setSaving(false) }
  }

  const handleDelete = async (cat: Category) => {
    if (cat._count.tags > 0) {
      alert(`Нельзя удалить: в категории ${cat._count.tags} тегов.\nСначала удали или перенеси теги.`)
      return
    }
    if (!confirm(`Удалить категорию «${cat.name}»?`)) return
    const res = await fetch(`/api/admin/categories/${cat.id}`, { method: 'DELETE' })
    if (!res.ok) { const j = await res.json(); alert(j.error); return }
    setCategories((prev) => prev.filter((c) => c.id !== cat.id))
  }

  return (
    <div className="mb-6 rounded-xl border border-gray-200 bg-white overflow-hidden">
      <button onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3">
          <span className="text-base font-bold text-gray-900">Категории</span>
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500">
            {categories.length}
          </span>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
          className={cn('text-gray-400 transition-transform duration-200', open ? 'rotate-180' : '')}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-gray-100 px-5 pb-5 pt-4">
          <div className="space-y-2 mb-4">
            {categories.map((cat) => (
              <div key={cat.id}>
                {editingId === cat.id ? (
                  <div className="flex items-center gap-2 rounded-lg border border-brand-300 bg-brand-50 px-3 py-2">
                    <input ref={editInputRef} type="text" value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(cat); if (e.key === 'Escape') setEditingId(null) }}
                      className="flex-1 min-w-0 bg-transparent text-sm font-medium text-gray-900 focus:outline-none"
                    />
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-400">Иконка:</span>
                      <input type="text" value={editIcon} onChange={(e) => setEditIcon(e.target.value)}
                        className="w-12 rounded border border-gray-200 bg-white px-1 py-0.5 text-center text-sm focus:outline-none focus:ring-1 focus:ring-brand-400"
                        placeholder="🥕" />
                    </div>
                    <button onClick={() => handleSaveEdit(cat)} disabled={saving || !editName.trim()}
                      className="rounded-md bg-brand-500 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-50">
                      {saving ? '...' : 'OK'}
                    </button>
                    <button onClick={() => setEditingId(null)}
                      className="rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100">Отмена</button>
                  </div>
                ) : (
                  <div className="group flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 hover:border-gray-200 hover:bg-gray-50 transition-all">
                    <span className="text-xl w-7 text-center flex-shrink-0">{cat.icon ?? '📁'}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-gray-800">{cat.name}</span>
                      <span className="ml-2 text-[10px] font-mono text-gray-400">/{cat.slug}</span>
                    </div>
                    <span className="flex-shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                      {cat._count.tags} тегов
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingId(cat.id); setEditName(cat.name); setEditIcon(cat.icon ?? '') }}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-white hover:text-brand-500 hover:shadow-sm transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        </svg>
                      </button>
                      <button onClick={() => handleDelete(cat)}
                        className={cn('rounded-md p-1.5 transition-all',
                          cat._count.tags > 0 ? 'cursor-not-allowed text-gray-200' : 'text-gray-400 hover:bg-white hover:text-red-500 hover:shadow-sm')}>
                        <svg xmlns="http://www.w3.org/2000/svg" width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {creating ? (
            <div className="rounded-xl border border-dashed border-brand-300 bg-brand-50 p-4">
              <p className="mb-3 text-xs font-semibold text-brand-700">Новая категория</p>
              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <input ref={newInputRef} type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setCreating(false); setNewName(''); setNewIcon('') } }}
                    placeholder="Название, например «По способу готовки»"
                    className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  />
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-xs text-gray-500">Иконка:</span>
                    <input type="text" value={newIcon} onChange={(e) => setNewIcon(e.target.value)}
                      className="w-14 rounded-lg border border-gray-200 bg-white px-2 py-2 text-center text-lg focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                      placeholder="🍽️" />
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-[10px] text-gray-400">Быстрый выбор иконки:</p>
                  <div className="flex flex-wrap gap-1">
                    {POPULAR_ICONS.map((icon) => (
                      <button key={icon} type="button" onClick={() => setNewIcon(icon)}
                        className={cn('rounded-lg border px-2 py-1 text-lg transition-colors',
                          newIcon === icon ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:border-gray-300 bg-white')}>
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => { setCreating(false); setNewName(''); setNewIcon('') }}
                    className="rounded-lg px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 transition-colors">Отмена</button>
                  <button onClick={handleCreate} disabled={saving || !newName.trim()}
                    className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50 transition-colors">
                    {saving ? 'Создаём...' : 'Создать категорию'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button onClick={() => setCreating(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 py-3 text-sm font-medium text-gray-500 hover:border-brand-300 hover:text-brand-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Новая категория
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Главная страница ──────────────────────────────────────────
export default function AdminTagsPage() {
  const { categories, setCategories, tags, setTags, loading, error, reload } = useAdminData()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const handleCreateTag = async (name: string, category: string) => {
    const res = await fetch('/api/admin/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, category }),
    })
    if (!res.ok) { const j = await res.json(); alert(j.error ?? 'Ошибка'); throw new Error() }
    const newTag = await res.json() as Tag
    setTags((prev) => [...prev, newTag].sort((a, b) => a.name.localeCompare(b.name, 'ru')))
    setCategories((prev) => prev.map((c) =>
      c.slug === category ? { ...c, _count: { tags: c._count.tags + 1 } } : c
    ))
  }

  const handleSaveTag = async (id: string, name: string, category: string) => {
    const res = await fetch(`/api/admin/tags/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, category }),
    })
    if (!res.ok) { const j = await res.json(); alert(j.error ?? 'Ошибка'); throw new Error() }
    const updated = await res.json() as Tag
    const old = tags.find((t) => t.id === id)
    setTags((prev) => prev.map((t) => t.id === id ? updated : t))
    if (old && old.category !== category) {
      setCategories((prev) => prev.map((c) => {
        if (c.slug === old.category) return { ...c, _count: { tags: c._count.tags - 1 } }
        if (c.slug === category) return { ...c, _count: { tags: c._count.tags + 1 } }
        return c
      }))
    }
  }

  const handleDeleteTag = async (id: string, name: string, recipeCount: number) => {
    const msg = recipeCount > 0
      ? `Удалить тег «${name}»?\n\nОн привязан к ${recipeCount} рецептам.`
      : `Удалить тег «${name}»?`
    if (!confirm(msg)) return
    const tag = tags.find((t) => t.id === id)
    const res = await fetch(`/api/admin/tags/${id}`, { method: 'DELETE' })
    if (!res.ok) { alert('Ошибка при удалении'); return }
    setTags((prev) => prev.filter((t) => t.id !== id))
    if (tag) setCategories((prev) => prev.map((c) =>
      c.slug === tag.category ? { ...c, _count: { tags: Math.max(0, c._count.tags - 1) } } : c
    ))
  }

  const handleImageUpdate = (id: string, imageUrl: string) => {
    setTags((prev) => prev.map((t) => t.id === id ? { ...t, imageUrl } : t))
  }

  const filtered = tags.filter((t) => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase())
    const matchCat = activeCategory === 'all' || t.category === activeCategory
    return matchSearch && matchCat
  })

  const grouped = categories.reduce<Record<string, Tag[]>>((acc, cat) => {
    acc[cat.slug] = filtered.filter((t) => t.category === cat.slug)
    return acc
  }, {})

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Теги</h1>
          <p className="mt-1 text-sm text-gray-500">
            Всего тегов: {tags.length} · Категорий: {categories.length}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="h-14 rounded-xl bg-gray-100 animate-pulse" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 animate-pulse">
              <div className="mb-3 h-4 w-32 rounded bg-gray-100" />
              <div className="space-y-2">
                {[1, 2, 3].map((j) => <div key={j} className="h-9 rounded-lg bg-gray-100" />)}
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
          {error} <button onClick={reload} className="ml-2 underline">Повторить</button>
        </div>
      ) : (
        <>
          <CategoriesManager categories={categories} setCategories={setCategories} />

          {/* Поиск + фильтры */}
          <div className="mb-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-xs">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" xmlns="http://www.w3.org/2000/svg" width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
              </svg>
              <input type="text" placeholder="Поиск тега..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div className="flex gap-1 flex-wrap">
              <button onClick={() => setActiveCategory('all')}
                className={cn('rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                  activeCategory === 'all' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50')}>
                Все
              </button>
              {categories.map((cat) => (
                <button key={cat.slug} onClick={() => setActiveCategory(cat.slug)}
                  className={cn('rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                    activeCategory === cat.slug
                      ? 'border-brand-400 bg-brand-50 text-brand-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50')}>
                  {cat.icon && <span className="mr-1">{cat.icon}</span>}
                  {cat.name}
                  <span className={cn('ml-1.5 text-[10px]', activeCategory === cat.slug ? 'text-brand-500' : 'text-gray-400')}>
                    {tags.filter((t) => t.category === cat.slug).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Теги по категориям */}
          <div className="space-y-4">
            {categories
              .filter((cat) => activeCategory === 'all' || activeCategory === cat.slug)
              .map((cat) => {
                const catTags = grouped[cat.slug] ?? []
                if (search && catTags.length === 0) return null
                return (
                  <div key={cat.slug} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                    <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-5 py-3">
                      {cat.icon && <span className="text-xl">{cat.icon}</span>}
                      <h2 className="text-sm font-bold text-gray-800">{cat.name}</h2>
                      <span className="rounded-full bg-white border border-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-500">
                        {catTags.length}
                      </span>
                    </div>
                    <div className="p-3 space-y-1">
                      {catTags.length === 0 && !search && (
                        <p className="px-3 py-2 text-xs text-gray-400 italic">Тегов в этой категории пока нет</p>
                      )}
                      {catTags.map((tag) => (
                        <TagRow key={tag.id} tag={tag} categories={categories}
                          onSave={handleSaveTag} onDelete={handleDeleteTag} onImageUpdate={handleImageUpdate} />
                      ))}
                      {!search && (
                        <div className="pt-1">
                          <AddTagButton defaultCategory={cat.slug} categories={categories} onCreate={handleCreateTag} />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

            {categories.length === 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
                <p className="text-gray-400 text-sm">Категорий пока нет</p>
                <p className="mt-1 text-xs text-gray-400">Раскрой блок «Категории» выше и создай первую</p>
              </div>
            )}
            {search && filtered.length === 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
                <p className="text-sm text-gray-400">Тегов по запросу «{search}» не найдено</p>
                <button onClick={() => setSearch('')} className="mt-2 text-xs text-brand-500 hover:underline">Очистить</button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
