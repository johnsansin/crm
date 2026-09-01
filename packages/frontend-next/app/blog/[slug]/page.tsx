import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BlogPostPage } from '@/views/BlogPostPage'
import { ArticleJsonLd, BreadcrumbJsonLd } from '@/components/JsonLd'
import { getBlogPostBySlug } from '@/data/blogPosts'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = getBlogPostBySlug(slug)
  if (!post) return {}
  const url = `https://bizforce-crm.online/blog/${post.slug}`
  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: `${post.title} | BizForce CRM`,
      description: post.description,
      url,
      type: 'article',
      publishedTime: post.isoDate,
      authors: [post.author],
      siteName: 'BizForce CRM',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: ['/og-image.png'],
    },
    robots: { index: true, follow: true },
  }
}

export const dynamicParams = false

export async function generateStaticParams() {
  const { getAllBlogPostSlugs } = await import('@/data/blogPosts')
  return getAllBlogPostSlugs().map(slug => ({ slug }))
}

export default async function Page({ params }: Props) {
  const { slug } = await params
  const post = getBlogPostBySlug(slug)
  if (!post) notFound()
  const url = `https://bizforce-crm.online/blog/${post.slug}`
  return (
    <>
      <ArticleJsonLd
        title={post.title}
        excerpt={post.description}
        date={post.isoDate}
        author={post.author}
        authorRole={post.authorRole}
        url={url}
        image="/og-image.png"
      />
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://bizforce-crm.online' },
        { name: 'Blog', url: 'https://bizforce-crm.online/blog' },
        { name: post.title, url },
      ]} />
      <BlogPostPage post={post} />
    </>
  )
}
