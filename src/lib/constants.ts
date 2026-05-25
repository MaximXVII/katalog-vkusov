export const SITE_NAME = 'Каталог Вкусов'
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
export const TELEGRAM_URL = process.env.NEXT_PUBLIC_TELEGRAM_URL ?? 'https://t.me/+s7bnJzXlDw04NmUy'

// Пагинация
export const RECIPES_PER_PAGE = 24
export const SIMILAR_RECIPES_COUNT = 10
export const HOME_ROW_RECIPES_COUNT = 12

// localStorage
export const BOOKMARK_STORAGE_KEY = 'moi-recepti-bookmarks'

// ISR — перегенерация страниц каждые N секунд
export const REVALIDATE_SECONDS = 60

// Новинки — рецепты добавленные за последние N дней
export const NEW_RECIPES_DAYS = 7
