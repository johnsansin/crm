import { notFound } from 'next/navigation'
import { SocialMediaPage } from '@/views/SocialMediaPage'
import { socialForceSections } from '@/components/socialforce/sections'

export function generateStaticParams() { return socialForceSections.map(({ slug }) => ({ section: slug })) }
export default async function Page({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params
  const selected = socialForceSections.find(item => item.slug === section)
  if (!selected) notFound()
  return <SocialMediaPage initialView={selected.label} />
}
