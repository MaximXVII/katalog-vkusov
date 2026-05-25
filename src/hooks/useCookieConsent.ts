'use client'

import { useState, useEffect, useCallback } from 'react'

export type CookieConsent = 'accepted' | 'declined' | null

const CONSENT_COOKIE_NAME = 'moi-recepti-cookie-consent'
// Согласие действует 365 дней
const CONSENT_TTL_DAYS = 365

function readConsentCookie(): CookieConsent {
  if (typeof document === 'undefined') return null
  const match = document.cookie
    .split('; ')
    .find((c) => c.startsWith(CONSENT_COOKIE_NAME + '='))
  const value = match?.split('=')[1]
  if (value === 'accepted') return 'accepted'
  if (value === 'declined') return 'declined'
  return null
}

function writeConsentCookie(value: 'accepted' | 'declined'): void {
  if (typeof document === 'undefined') return
  const expires = new Date()
  expires.setDate(expires.getDate() + CONSENT_TTL_DAYS)
  // SameSite=Lax — достаточно для обычного сайта, Secure — только в production
  const secure = location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = (
    CONSENT_COOKIE_NAME + '=' + value +
    '; expires=' + expires.toUTCString() +
    '; path=/' +
    '; SameSite=Lax' +
    secure
  )
}

/**
 * Хук для управления согласием на использование cookie-закладок.
 *
 * - consent === null     → баннер ещё не показывался (показываем его)
 * - consent === 'accepted' → можно использовать cookies для закладок
 * - consent === 'declined' → только localStorage, без cookies
 */
export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsent>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    setConsent(readConsentCookie())
    setIsReady(true)
  }, [])

  const accept = useCallback(() => {
    writeConsentCookie('accepted')
    setConsent('accepted')
  }, [])

  const decline = useCallback(() => {
    writeConsentCookie('declined')
    setConsent('declined')
  }, [])

  return {
    consent,
    isReady,
    accept,
    decline,
    showBanner: isReady && consent === null,
    cookiesAllowed: consent === 'accepted',
  }
}
