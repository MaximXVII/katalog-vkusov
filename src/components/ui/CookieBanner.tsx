'use client'

import { useCookieConsent } from '@/hooks/useCookieConsent'

/**
 * Баннер cookie-согласия.
 * Появляется один раз при первом визите.
 * Исчезает после нажатия «OK, понятно» или «Не использовать».
 */
export function CookieBanner() {
  const { showBanner, accept, decline } = useCookieConsent()

  if (!showBanner) return null

  return (
    <div
      role="dialog"
      aria-label="Уведомление об использовании cookie"
      className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-sm"
    >
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-xl ring-1 ring-amber-100">
        {/* Иконка + заголовок */}
        <div className="mb-3 flex items-start gap-3">
          <span className="mt-0.5 flex-shrink-0 text-2xl" aria-hidden>🍪</span>
          <div>
            <p className="text-sm font-bold text-amber-900">
              Мы используем cookie для закладок
            </p>
            <p className="mt-1 text-xs leading-relaxed text-amber-800">
              Cookie помогают сохранить твои любимые рецепты на долгое время — даже если ты
              очистишь кэш браузера. Без них закладки хранятся только в памяти браузера.
            </p>
          </div>
        </div>

        {/* Кнопки */}
        <div className="flex gap-2">
          <button
            onClick={accept}
            className="flex-1 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 active:scale-95"
          >
            OK, понятно
          </button>
          <button
            onClick={decline}
            className="flex-1 rounded-xl border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-800 transition hover:bg-amber-100 active:scale-95"
          >
            Не использовать
          </button>
        </div>
      </div>
    </div>
  )
}
