import type { Metadata } from 'next'
import { AdminHeader } from '@/components/admin/AdminHeader'

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s | Admin — Мои Рецепты' },
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  )
}
