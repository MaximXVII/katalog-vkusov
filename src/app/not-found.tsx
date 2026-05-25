import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
      <div className="text-6xl">🥘</div>
      <h2 className="text-2xl font-bold text-gray-900">Страница не найдена</h2>
      <p className="text-center text-gray-500">
        Возможно, она была удалена или адрес введён неверно.
      </p>
      <Link
        href="/"
        className="mt-4 rounded-xl bg-orange-500 px-8 py-3 font-semibold text-white transition-colors hover:bg-orange-600"
      >
        На главную
      </Link>
    </div>
  )
}
