'use client'

import { createContext, useContext } from 'react'
import { CookieBanner } from '@/components/ui/CookieBanner'
import { useCookieConsent } from '@/hooks/useCookieConsent'

interface CookieContextValue {
  cookiesAllowed: boolean
}

const CookieContext = createContext<CookieContextValue>({ cookiesAllowed: false })

export function useCookieContext() {
  return useContext(CookieContext)
}

/**
 * Провайдер: показывает баннер согласия и передаёт через Context
 * флаг cookiesAllowed всем дочерним компонентам.
 */
export function CookieProvider({ children }: { children: React.ReactNode }) {
  const { cookiesAllowed } = useCookieConsent()

  return (
    <CookieContext.Provider value={{ cookiesAllowed }}>
      {children}
      <CookieBanner />
    </CookieContext.Provider>
  )
}
