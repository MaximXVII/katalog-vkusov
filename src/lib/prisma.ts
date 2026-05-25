import { PrismaClient } from '@prisma/client'

// Singleton: один экземпляр PrismaClient на всё приложение.
// В dev-режиме Next.js перезагружает модули при hot-reload —
// без singleton каждый раз создавался бы новый коннект к БД.

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
