import type { Metadata } from 'next'
import Script from 'next/script'
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
      <head>
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-MZQGK36D');`,
          }}
        />
      </head>
      <body className="min-h-screen bg-white antialiased">
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-MZQGK36D"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
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
