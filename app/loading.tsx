"use client";

import { usePathname } from 'next/navigation'

export default function RootLoading() {
  const pathname = usePathname()
  if (pathname?.startsWith('/auth')) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/50 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-xl bg-white dark:bg-gray-900 p-8 shadow-2xl border border-gray-200 dark:border-gray-800">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Loading page…</div>
      </div>
    </div>
  )
}


