import { supabaseAdmin } from '@/lib/supabase'

// ── Константы ─────────────────────────────────────────────────
export const STORAGE_BUCKET = 'recipe-images'
export const MAX_FILE_SIZE_MB = 5
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

// ── Типы ──────────────────────────────────────────────────────
export interface UploadResult {
  url: string
  path: string
}

export interface UploadError {
  error: string
}

// ── Утилиты ───────────────────────────────────────────────────

/** Генерирует уникальное имя файла с временной меткой */
export function generateFileName(originalName: string): string {
  const ext = originalName.split('.').pop()?.toLowerCase() ?? 'jpg'
  const timestamp = Date.now()
  const random = Math.random().toString(36).slice(2, 8)
  return `${timestamp}-${random}.${ext}`
}

/** Проверяет файл перед загрузкой */
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return `Неподдерживаемый формат. Разрешены: JPEG, PNG, WebP, AVIF`
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `Файл слишком большой. Максимум ${MAX_FILE_SIZE_MB} МБ`
  }
  return null
}

/**
 * Загружает изображение в Supabase Storage.
 * Использует supabaseAdmin (service_role) — только для серверных роутов!
 *
 * @param file - File объект из FormData
 * @param folder - подпапка внутри bucket (например 'recipes' или 'steps')
 * @returns { url, path } или бросает ошибку
 */
export async function uploadImage(
  file: File,
  folder: 'recipes' | 'steps' = 'recipes'
): Promise<UploadResult> {
  // Валидация
  const validationError = validateImageFile(file)
  if (validationError) {
    throw new Error(validationError)
  }

  // Генерируем имя файла
  const fileName = generateFileName(file.name)
  const filePath = `${folder}/${fileName}`

  // Конвертируем File в ArrayBuffer для загрузки
  const arrayBuffer = await file.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  // Загружаем в Supabase Storage
  const { error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, buffer, {
      contentType: file.type,
      cacheControl: '31536000', // 1 год кэширования — картинки не меняются
      upsert: false,
    })

  if (error) {
    throw new Error(`Ошибка загрузки: ${error.message}`)
  }

  // Получаем публичный URL
  const { data } = supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(filePath)

  return {
    url: data.publicUrl,
    path: filePath,
  }
}

/**
 * Удаляет изображение из Supabase Storage по публичному URL.
 * Используется при удалении рецепта или замене картинки.
 */
export async function deleteImage(publicUrl: string): Promise<void> {
  // Извлекаем путь из URL
  // URL вида: https://xxx.supabase.co/storage/v1/object/public/recipe-images/recipes/filename.jpg
  const marker = `/object/public/${STORAGE_BUCKET}/`
  const markerIndex = publicUrl.indexOf(marker)

  if (markerIndex === -1) {
    // Не наш URL — пропускаем без ошибки
    return
  }

  const filePath = publicUrl.slice(markerIndex + marker.length)

  const { error } = await supabaseAdmin.storage.from(STORAGE_BUCKET).remove([filePath])

  if (error) {
    // Логируем но не бросаем — удаление не критично если файл уже не существует
    console.warn(`Не удалось удалить файл ${filePath}:`, error.message)
  }
}

/**
 * Получает публичный URL для пути внутри bucket.
 * Удобно когда нужен URL без полной загрузки.
 */
export function getPublicUrl(filePath: string): string {
  const { data } = supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(filePath)
  return data.publicUrl
}
