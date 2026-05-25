import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { SessionProvider } from '@/components/layout/SessionProvider'
import { CookieProvider } from '@/components/layout/CookieProvider'
import { Navbar } from '@/components/layout/Navbar'
import './globals.css'

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Каталог Вкусов',
    template: '%s | Каталог Вкусов',
  },
  description:
    'Коллекция лучших рецептов со всего мира. Найди блюдо по ингредиенту, стране кухни или сложности приготовления.',
  keywords: ['рецепты', 'кулинария', 'блюда', 'готовка', 'ингредиенты'],
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    siteName: 'Каталог Вкусов',
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" className={inter.variable}>
      <body className="min-h-screen bg-white antialiased">
        <SessionProvider>
          {/* CookieProvider: показывает баннер согласия и передаёт cookiesAllowed через Context */}
          <CookieProvider>
            <Navbar />
            <main>{children}</main>
          </CookieProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
