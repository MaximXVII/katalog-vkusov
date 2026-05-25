import { NextRequest, NextResponse } from 'next/server'
import { uploadImage, MAX_FILE_SIZE_MB } from '@/lib/storage'

// Максимальный размер тела запроса для Next.js
export const config = {
  api: { bodyParser: false },
}

/**
 * POST /api/admin/upload
 * Принимает: multipart/form-data с полем "file"
 * Возвращает: { url: string, path: string }
 *
 * Защита маршрута будет добавлена в Чате 4 (NextAuth middleware)
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file')

    // Проверяем что файл передан
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'Файл не передан. Используй поле "file" в form-data.' },
        { status: 400 }
      )
    }

    // Читаем папку назначения (recipes или steps)
    const folder = formData.get('folder')
    const targetFolder = folder === 'steps' ? 'steps' : 'recipes'

    // Загружаем
    const result = await uploadImage(file, targetFolder)

    return NextResponse.json(result, { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Неизвестная ошибка'

    // Понятные сообщения об ошибках
    if (message.includes('слишком большой')) {
      return NextResponse.json(
        { error: `Файл слишком большой. Максимум ${MAX_FILE_SIZE_MB} МБ.` },
        { status: 413 }
      )
    }

    if (message.includes('формат')) {
      return NextResponse.json({ error: message }, { status: 415 })
    }

    console.error('[upload] Ошибка:', message)
    return NextResponse.json({ error: 'Ошибка загрузки файла' }, { status: 500 })
  }
}
