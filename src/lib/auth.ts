import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

// ── Защита от брутфорса (in-memory rate limiter) ─────────────────────────
//
// Работает в рамках одного серверного процесса.
// В serverless/cold-start сбрасывается — это нормально для Single-admin сайта.
// Для production с несколькими инстансами заменить на Redis/Upstash.

interface AttemptRecord {
  count: number
  blockedUntil: number | null
  firstAttempt: number
}

// Ключ: IP-адрес или 'unknown'
const loginAttempts = new Map<string, AttemptRecord>()

// Параметры блокировки
const MAX_ATTEMPTS = 5           // попыток до блокировки
const WINDOW_MS = 15 * 60 * 1000 // окно 15 минут
const BLOCK_MS  = 30 * 60 * 1000 // блокировка 30 минут

function checkRateLimit(ip: string): { allowed: boolean; minutesLeft?: number } {
  const now = Date.now()
  const record = loginAttempts.get(ip)

  if (!record) {
    loginAttempts.set(ip, { count: 0, blockedUntil: null, firstAttempt: now })
    return { allowed: true }
  }

  // Снимаем блокировку если время вышло
  if (record.blockedUntil && now > record.blockedUntil) {
    loginAttempts.delete(ip)
    loginAttempts.set(ip, { count: 0, blockedUntil: null, firstAttempt: now })
    return { allowed: true }
  }

  // IP заблокирован
  if (record.blockedUntil) {
    const minutesLeft = Math.ceil((record.blockedUntil - now) / 60_000)
    return { allowed: false, minutesLeft }
  }

  // Сбрасываем счётчик если окно истекло
  if (now - record.firstAttempt > WINDOW_MS) {
    loginAttempts.set(ip, { count: 0, blockedUntil: null, firstAttempt: now })
    return { allowed: true }
  }

  return { allowed: true }
}

function recordFailedAttempt(ip: string): void {
  const now = Date.now()
  const record = loginAttempts.get(ip) ?? { count: 0, blockedUntil: null, firstAttempt: now }
  record.count += 1
  if (record.count >= MAX_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_MS
    console.warn(
      `[auth] IP ${ip} заблокирован после ${record.count} неудачных попыток входа. ` +
      `Блокировка до: ${new Date(record.blockedUntil).toISOString()}`
    )
  }
  loginAttempts.set(ip, record)
}

function clearAttempts(ip: string): void {
  loginAttempts.delete(ip)
}

// Раз в час чистим старые записи чтобы не засорять память
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [ip, record] of loginAttempts.entries()) {
      const expired = record.blockedUntil
        ? now > record.blockedUntil
        : now - record.firstAttempt > WINDOW_MS * 2
      if (expired) loginAttempts.delete(ip)
    }
  }, 60 * 60 * 1000)
}

// ── NextAuth config ───────────────────────────────────────────────────────

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60,  // 8 часов (было 7 дней — сокращено для безопасности)
    updateAge: 60 * 60,   // Обновляем токен раз в час
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  // Дополнительные параметры безопасности
  useSecureCookies: process.env.NODE_ENV === 'production',

  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',  type: 'email'    },
        password: { label: 'Пароль', type: 'password' },
        // IP передаём из формы логина для rate limiting
        _ip:      { label: '',       type: 'text'     },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const adminEmail = process.env.ADMIN_EMAIL
        const adminHash  = process.env.ADMIN_PASSWORD_HASH

        if (!adminEmail || !adminHash) {
          console.error('[auth] ADMIN_EMAIL или ADMIN_PASSWORD_HASH не заданы')
          return null
        }

        // Rate limiting по IP
        const ip = credentials._ip ?? 'unknown'
        const rl = checkRateLimit(ip)
        if (!rl.allowed) {
          console.warn(`[auth] Заблокирован вход с IP: ${ip}, осталось мин: ${rl.minutesLeft}`)
          throw new Error(`TOO_MANY_ATTEMPTS:${rl.minutesLeft}`)
        }

        // Защита от timing attack: всегда проверяем пароль через bcrypt
        // (даже если email неверный) чтобы скрыть существование аккаунта
        const [emailOk, passwordOk] = await Promise.all([
          Promise.resolve(
            credentials.email.toLowerCase() === adminEmail.toLowerCase()
          ),
          bcrypt.compare(credentials.password, adminHash),
        ])

        if (!emailOk || !passwordOk) {
          recordFailedAttempt(ip)
          // Намеренная задержка 500ms — замедляем брутфорс
          await new Promise((r) => setTimeout(r, 500))
          return null
        }

        // Успешный вход — сбрасываем счётчик
        clearAttempts(ip)
        console.info(`[auth] Успешный вход администратора с IP: ${ip}`)

        return {
          id: 'admin',
          email: adminEmail,
          name: 'Администратор',
          role: 'admin',
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role
        // Время выдачи токена для дополнительной валидации
        token.issuedAt = Math.floor(Date.now() / 1000)
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        // Передаём роль в сессию
        ;(session.user as { role?: string }).role = token.role as string
      }
      return session
    },
  },
}
