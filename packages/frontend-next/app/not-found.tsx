import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '404 — Page Not Found',
  description: 'The page you are looking for could not be found.',
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="text-center">
        <p className="text-7xl font-bold text-blue-600 dark:text-blue-400">404</p>
        <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">Page Not Found</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          The page you are looking for does not exist or has been moved.
        </p>
        <a
          href="/"
          className="mt-6 inline-flex items-center px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
        >
          Back to Home
        </a>
      </div>
    </div>
  )
}