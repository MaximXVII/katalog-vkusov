'use client'

import { useState, useEffect, useCallback } from 'react'
import { BOOKMARK_STORAGE_KEY } from '@/lib/constants'

// Имя cookie для закладок
const BOOKMARK_COOKIE_NAME = 'moi-recepti-bookmarks'
// Закладки хранятся 365 дней
const BOOKMARK_COOKIE_TTL = 365

// ── Cookie helpers ───────────────────────────────────────────────────

function readBookmarkCookie(): string[] {
  if (typeof document === 'undefined') return []
  const match = document.cookie
    .split('; ')
    .find((c) => c.startsWith(BOOKMARK_COOKIE_NAME + '='))
  if (!match) return []
  try {
    const raw = decodeURIComponent(match.split('=').slice(1).join('='))
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === 'string')
      : []
  } catch {
    return []
  }
}

function writeBookmarkCookie(ids: string[]): void {
  if (typeof document === 'undefined') return
  const expires = new Date()
  expires.setDate(expires.getDate() + BOOKMARK_COOKIE_TTL)
  const secure = location.protocol === 'https:' ? '; Secure' : ''
  const value = encodeURIComponent(JSON.stringify(ids))
  document.cookie = (
    BOOKMARK_COOKIE_NAME + '=' + value +
    '; expires=' + expires.toUTCString() +
    '; path=/' +
    '; SameSite=Lax' +
    secure
  )
}

// ── Хук ─────────────────────────────────────────────────────────────

interface UseBookmarksOptions {
  /** Если true — закладки дополнительно сохраняются в cookie (согласие получено) */
  cookiesAllowed?: boolean
}

/**
 * Хук для управления закладками.
 * Всегда использует localStorage как основное хранилище.
 * Дополнительно синхронизирует с cookie если cookiesAllowed === true.
 *
 * Cookie-закладки позволяют сохранить избранное между разными браузерами/устройствами
 * (при условии что пользователь использует один сайт), а также переживают очистку localStorage.
 */
export function useBookmarks({ cookiesAllowed = false }: UseBookmarksOptions = {}) {
  const [bookmarks, setBookmarks] = useState<string[]>([])
  const [isReady, setIsReady] = useState(false)

  // Читаем начальное состояние на клиенте
  useEffect(() => {
    try {
      let ids: string[] = []

      // Читаем localStorage
      const stored = localStorage.getItem(BOOKMARK_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as unknown
        if (Array.isArray(parsed)) {
          ids = parsed.filter((id): id is string => typeof id === 'string')
        }
      }

      // Если разрешены cookies — мержим с cookie-закладками
      // (приоритет у localStorage, cookie добавляет недостающие)
      if (cookiesAllowed) {
        const cookieIds = readBookmarkCookie()
        const merged = Array.from(new Set([...ids, ...cookieIds]))
        if (merged.length !== ids.length) {
          ids = merged
          // Обновляем localStorage с данными из cookie
          localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(ids))
        }
      }

      setBookmarks(ids)
    } catch {
      setBookmarks([])
    }
    setIsReady(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cookiesAllowed])

  const persist = useCallback(
    (ids: string[]) => {
      try {
        localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(ids))
      } catch { /* ignore */ }
      if (cookiesAllowed) {
        writeBookmarkCookie(ids)
      }
    },
    [cookiesAllowed]
  )

  const toggleBookmark = useCallback(
    (recipeId: string) => {
      setBookmarks((prev) => {
        const next = prev.includes(recipeId)
          ? prev.filter((id) => id !== recipeId)
          : [...prev, recipeId]
        persist(next)
        return next
      })
    },
    [persist]
  )

  const isBookmarked = useCallback(
    (recipeId: string) => bookmarks.includes(recipeId),
    [bookmarks]
  )

  const clearAll = useCallback(() => {
    setBookmarks([])
    try { localStorage.removeItem(BOOKMARK_STORAGE_KEY) } catch { /* ignore */ }
    if (cookiesAllowed) {
      // Удаляем cookie — ставим прошедшую дату
      document.cookie = BOOKMARK_COOKIE_NAME + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
    }
  }, [cookiesAllowed])

  return {
    bookmarks,
    count: bookmarks.length,
    isReady,
    toggleBookmark,
    isBookmarked,
    clearAll,
  }
}
