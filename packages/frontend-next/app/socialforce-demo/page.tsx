import type { Metadata } from 'next'
import { SocialForceStudio } from '@/components/socialforce/SocialForceStudio'
export const metadata: Metadata = { title: 'SocialForce AI — Interactive Demo', robots: { index: false, follow: false } }
export default function Page() { return <SocialForceStudio demo /> }
