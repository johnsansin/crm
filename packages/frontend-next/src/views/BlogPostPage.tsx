'use client'

import { SiteLayout } from '@/components/SiteLayout'
import { Link } from '@/lib/navigation'
import { Calendar, User, Tag, ArrowLeft, Clock } from 'lucide-react'
import type { BlogPost } from '@/data/blogPosts'
import { blogPosts } from '@/data/blogPosts'

export function BlogPostPage({ post }: { post: BlogPost }) {
  const related = blogPosts
    .filter(p => p.slug !== post.slug && p.category === post.category)
    .slice(0, 3)

  return (
    <SiteLayout>
      <article className="pt-32 pb-20 sm:pt-40 sm:pb-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
            <ArrowLeft size={14} /> Back to blog
          </Link>

          <div className="mt-6 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 font-medium">
              <Tag size={12} /> {post.category}
            </span>
            <span className="flex items-center gap-1"><Calendar size={12} /> {post.date}</span>
            <span className="flex items-center gap-1"><Clock size={12} /> {post.readTime}</span>
          </div>

          <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">{post.title}</h1>

          <div className="mt-4 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <span className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
              {post.author.split(' ').map(n => n[0]).join('')}
            </span>
            <span>
              <span className="font-medium text-slate-900 dark:text-white">{post.author}</span>
              <span className="text-slate-500 dark:text-slate-400"> · {post.authorRole}</span>
            </span>
          </div>

          <div className="mt-8 p-4 rounded-xl bg-sky-50 dark:bg-slate-800/60 border border-sky-100 dark:border-white/10 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {post.excerpt}
          </div>

          <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
            {post.sections.map(section => (
              <section key={section.heading}>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">{section.heading}</h2>
                {section.paragraphs.map((p, i) => (
                  <p key={i} className="mb-3">{p}</p>
                ))}
              </section>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-slate-200/60 dark:border-white/10">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Ready to grow with BizForce CRM?</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              Start free — no credit card required. Manage contacts, track sales, and automate workflows in one place.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/signup" className="inline-flex items-center px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors">
                Start Free Trial
              </Link>
              <Link to="/pricing" className="inline-flex items-center px-5 py-2.5 rounded-lg border border-slate-300 dark:border-white/20 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:border-blue-500 transition-colors">
                View Pricing
              </Link>
            </div>
          </div>

          {related.length > 0 && (
            <div className="mt-12">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">More in {post.category}</h3>
              <div className="space-y-3">
                {related.map(p => (
                  <Link
                    key={p.slug}
                    to={`/blog/${p.slug}`}
                    className="block p-4 rounded-xl border border-white/70 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm hover:shadow-md hover:border-sky-300 dark:hover:border-sky-600/50 transition-all"
                  >
                    <span className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-blue-600">{p.title}</span>
                    <span className="block mt-1 text-xs text-slate-500 dark:text-slate-400">{p.date} · {p.readTime}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>
    </SiteLayout>
  )
}
