'use client'
import { useTheme } from '@/lib/theme'
import { SocialForceStudio } from '@/components/socialforce/SocialForceStudio'
import type { SocialForceView } from '@/components/socialforce/sections'

export function SocialMediaPage({ initialView = 'Dashboard' }: { initialView?: SocialForceView }) {
  const { theme } = useTheme()
  return <SocialForceStudio initialView={initialView} crmTheme={theme} />
}
