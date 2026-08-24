'use client'

import dynamic from 'next/dynamic'

const LegacyRuntime = dynamic(() => import('./legacy-runtime').then(module => module.LegacyRuntime), {
  ssr: false,
  loading: () => <LoadingScreen />,
})

function LoadingScreen() {
  return <div className="flex h-screen min-h-[100dvh] items-center justify-center bg-background"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" /></div>
}

export function ClientShell() {
  return <LegacyRuntime />
}
