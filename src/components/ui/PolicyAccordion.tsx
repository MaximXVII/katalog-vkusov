'use client'

import { useState } from 'react'
import { SITE_NAME } from '@/lib/constants'

export function PolicyAccordion() {
  const [open, setOpen] = useState(false)

  return (
    <section className="border-t border-gray-200 pt-10">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-base font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        aria-expanded={open}
      >
        <span>Политика конфиденциальности и правовая информация</span>
        <svg
          xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
          className={`flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="mt-4 space-y-6 rounded-xl border border-gray-100 bg-gray-50 p-6 text-sm leading-relaxed text-gray-600">

          <div>
            <h3 className="mb-2 text-base font-semibold text-gray-800">1. Общие положения</h3>
            <p>
              Настоящий сайт («{SITE_NAME}») является личным кулинарным проектом.
              Сайт не является СМИ, торговой площадкой или профессиональным кулинарным изданием.
              Все материалы публикуются исключительно в информационно-развлекательных целях.
              Сайт создан с помощью инструментов искусственного интеллекта — включая генерацию контента
              и разработку кода.
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-base font-semibold text-gray-800">2. Сбор данных и файлы cookie</h3>
            <p>
              Сайт <strong>не собирает</strong> персональные данные пользователей, не использует сторонние
              аналитические системы и не устанавливает рекламные трекеры.
              Функция «Закладки» работает исключительно через{' '}
              <code className="rounded bg-gray-200 px-1">localStorage</code> вашего браузера —
              данные остаются на вашем устройстве и никуда не передаются.
              Технические cookie могут устанавливаться платформой хостинга в рамках их собственной политики.
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-base font-semibold text-gray-800">3. Рецепты и ответственность</h3>
            <p>
              Рецепты на сайте созданы с участием инструментов ИИ на основе общедоступных кулинарных
              традиций. Результат приготовления может отличаться в зависимости от качества ингредиентов,
              оборудования и навыков.
              Администрация сайта <strong>не несёт ответственности</strong> за возможный вред здоровью,
              имуществу или иные последствия, связанные с использованием материалов сайта.
              Перед использованием рецептов учитывайте индивидуальные особенности здоровья,
              аллергии и диетические ограничения.
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-base font-semibold text-gray-800">4. Контент и его использование</h3>
            <p className="mb-3">
              <strong>Рецепты и изображения</strong> на сайте можно свободно использовать в любых целях —
              личных, некоммерческих и коммерческих — без необходимости спрашивать разрешение или
              указывать источник.
            </p>
            <p>
              Исключение составляет <strong>логотип сайта</strong> — он является оригинальным авторским
              произведением и защищён авторским правом. Использование логотипа без разрешения запрещено.
              По вопросам напишите на{' '}
              <a href="mailto:m.leppyanenn@gmail.com" className="text-brand-600 hover:underline">m.leppyanenn@gmail.com</a>.
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-base font-semibold text-gray-800">5. Ограничение ответственности</h3>
            <p>
              Сайт предоставляется «как есть» без каких-либо гарантий доступности, точности или полноты
              информации. Администрация не несёт ответственности за временную недоступность сайта,
              технические сбои или потерю данных закладок, хранящихся в браузере пользователя.
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-base font-semibold text-gray-800">6. Применимое право</h3>
            <p>
              Настоящая политика регулируется законодательством Республики Сербия и, в применимой части,
              Общим регламентом по защите данных ЕС (GDPR). Любые споры разрешаются путём переговоров.
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-base font-semibold text-gray-800">7. Контакты</h3>
            <p>
              По всем вопросам, связанным с содержимым сайта или настоящей политикой, пишите на:{' '}
              <a href="mailto:m.leppyanenn@gmail.com" className="text-brand-600 hover:underline">m.leppyanenn@gmail.com</a>.
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-base font-semibold text-gray-800">8. Изменения политики</h3>
            <p>
              Администрация сайта оставляет за собой право вносить изменения в настоящую политику
              без предварительного уведомления. Актуальная версия всегда доступна на этой странице.
            </p>
          </div>

          <p className="border-t border-gray-200 pt-4 text-xs text-gray-400">
            Последнее обновление: май 2025
          </p>
        </div>
      )}
    </section>
  )
}
