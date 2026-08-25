'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth'
import { BrandLoader } from '@/components/BrandLoader'

type Role = 'authenticated' | 'admin' | 'superadmin' | 'support' | 'crm'

export function AuthGuard({ children, role = 'authenticated' }: { children: React.ReactNode; role?: Role }) {
  const router = useRouter()
  const { token, user, loading } = useAuthStore()
  let destination: string | null = null
  if (!loading && !token) destination = '/login'
  else if (!loading && role === 'admin' && !user?.isAdmin && !user?.isSuperAdmin) destination = '/dashboard'
  else if (!loading && role === 'superadmin' && !user?.isSuperAdmin) destination = '/dashboard'
  else if (!loading && role === 'support' && (!user?.isAgent || user?.isSuperAdmin)) destination = user?.isSuperAdmin ? '/superadmin' : '/dashboard'
  else if (!loading && role === 'crm' && user?.isAgent && !user?.isSuperAdmin) destination = '/support-agent'
  useEffect(() => { if (destination) router.replace(destination) }, [destination, router])
  if (loading || destination) return <div className="flex h-screen items-center justify-center bg-background"><BrandLoader /></div>
  return <>{children}</>
}
