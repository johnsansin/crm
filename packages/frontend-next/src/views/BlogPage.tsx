'use client'

import { useMemo, useState } from 'react'
import { SiteLayout } from '@/components/SiteLayout'
import { Link } from '@/lib/navigation'
import {
  Calendar,
  ArrowRight,
  Search,
  Clock,
  Sparkles,
  Mail,
  BookOpen,
} from 'lucide-react'
import { blogPosts } from '@/data/blogPosts'

const categoryMeta: Record<string, { icon: string; gradient: string; chip: string }> = {
  'CRM Basics': { icon: '💡', gradient: 'from-sky-500 to-blue-600', chip: 'bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300' },
  'Buying Guide': { icon: '🛒', gradient: 'from-violet-500 to-purple-600', chip: 'bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300' },
  Sales: { icon: '📈', gradient: 'from-emerald-500 to-teal-600', chip: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300' },
  Automation: { icon: '⚙️', gradient: 'from-amber-500 to-orange-600', chip: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300' },
  Integrations: { icon: '🔗', gradient: 'from-cyan-500 to-sky-600', chip: 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300' },
  Marketing: { icon: '📣', gradient: 'from-pink-500 to-rose-600', chip: 'bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300' },
  'AI & Technology': { icon: '🤖', gradient: 'from-indigo-500 to-blue-600', chip: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' },
  Enterprise: { icon: '🏢', gradient: 'from-slate-500 to-slate-700', chip: 'bg-slate-200 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300' },
  Support: { icon: '🎧', gradient: 'from-fuchsia-500 to-pink-600', chip: 'bg-fuchsia-100 dark:bg-fuchsia-900/50 text-fuchsia-700 dark:text-fuchsia-300' },
}

const categories = ['All', ...Array.from(new Set(blogPosts.map(p => p.category)))]

function ArticleCard({ slug, title, excerpt, category, date, readTime, featured }: {
  slug: string
  title: string
  excerpt: string
  category: string
  date: string
  readTime: string
  featured?: boolean
}) {
  const meta = categoryMeta[category] || categoryMeta['CRM Basics']
  return (
    <Link
      to={`/blog/${slug}`}
      className={`group relative flex flex-col rounded-2xl border border-white/70 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-lg shadow-sky-200/40 dark:shadow-indigo-950/40 overflow-hidden transition-all duration-300 ${
        featured
          ? 'lg:col-span-2 hover:shadow-2xl hover:shadow-sky-300/50 dark:hover:shadow-sky-900/40 hover:-translate-y-1'
          : 'hover:shadow-xl hover:shadow-sky-300/50 dark:hover:shadow-sky-900/40 hover:border-sky-300 dark:hover:border-sky-600/50 hover:-translate-y-1'
      }`}
    >
      <div className={`relative overflow-hidden ${featured ? 'h-40 sm:h-48' : 'h-32'}`}>
        <div className={`absolute inset-0 bg-gradient-to-br ${meta.gradient} opacity-90`} />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent" />
        <div className="absolute -top-1/2 left-1/4 w-1/2 h-[200%] rotate-12 bg-gradient-to-b from-white/15 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl sm:text-5xl drop-shadow-lg group-hover:scale-110 transition-transform duration-300">
          {meta.icon}
        </div>
        <div className="absolute bottom-3 left-3 text-xs font-semibold text-white/90">{category}</div>
      </div>
      <div className="flex flex-col flex-1 p-5 sm:p-6">
        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mb-3 flex-wrap">
          <span className="flex items-center gap-1"><Calendar size={12} /> {date}</span>
          <span className="flex items-center gap-1"><Clock size={12} /> {readTime}</span>
        </div>
        <h2 className={`${featured ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'} font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug`}>
          {title}
        </h2>
        <p className={`${featured ? 'line-clamp-3' : 'line-clamp-2'} text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-5`}>{excerpt}</p>
        <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 group-hover:gap-2.5 transition-all">
          Read article <ArrowRight size={14} />
        </span>
      </div>
    </Link>
  )
}

export function BlogPage() {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState('All')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return blogPosts.filter(p => {
      const matchCat = active === 'All' || p.category === active
      const matchQ = !q || p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q) || p.keywords.some(k => k.includes(q))
      return matchCat && matchQ
    })
  }, [query, active])

  const [hero, ...rest] = filtered

  return (
    <SiteLayout>
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-gradient-to-br from-sky-300/50 to-blue-400/40 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-24 w-[28rem] h-[28rem] rounded-full bg-gradient-to-tl from-indigo-400/40 to-violet-300/40 blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/70 dark:border-white/10 bg-white/70 dark:bg-white/10 backdrop-blur text-sm text-slate-600 dark:text-slate-300 shadow-sm mb-6">
              <Sparkles size={14} className="text-blue-500" />
              The BizForce Blog
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
              Insights for{' '}
              <span className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 dark:from-sky-400 dark:via-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                growing your business
              </span>
            </h1>
            <p className="mt-5 text-lg text-slate-600 dark:text-slate-300">
              Practical CRM guides, sales strategies, and workflow automation tips to help you close more deals and scale faster.
            </p>

            <div className="relative max-w-xl mx-auto mt-8">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                <Search size={18} />
              </div>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search articles..."
                className="w-full h-13 pl-12 pr-4 rounded-xl border border-white/70 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-lg shadow-sky-200/40 dark:shadow-indigo-950/40 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all"
              />
            </div>

            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActive(cat)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    active === cat
                      ? 'bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                      : 'border border-white/70 dark:border-white/10 bg-white/70 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/20 hover:shadow-md'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 && (
            <div className="text-center mt-16 py-16 rounded-2xl border border-dashed border-slate-300 dark:border-white/15 bg-white/40 dark:bg-white/5 backdrop-blur">
              <BookOpen size={40} className="mx-auto text-slate-400 mb-3" />
              <p className="text-lg font-medium text-slate-700 dark:text-slate-200">No articles found</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Try a different search term or category.</p>
            </div>
          )}

          {filtered.length > 0 && (
            <div className="mt-14">
              {hero && (
                <ArticleCard
                  slug={hero.slug}
                  title={hero.title}
                  excerpt={hero.excerpt}
                  category={hero.category}
                  date={hero.date}
                  readTime={hero.readTime}
                  featured
                />
              )}

              <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {rest.map(post => (
                  <ArticleCard
                    key={post.slug}
                    slug={post.slug}
                    title={post.title}
                    excerpt={post.excerpt}
                    category={post.category}
                    date={post.date}
                    readTime={post.readTime}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="py-20 sm:py-28 bg-white/40 dark:bg-white/5 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 p-8 sm:p-12 text-center overflow-hidden shadow-2xl shadow-blue-500/40">
            <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-transparent to-transparent" />
            <div className="absolute -top-1/2 left-1/4 w-1/2 h-[200%] rotate-12 bg-gradient-to-b from-white/15 to-transparent" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/15 backdrop-blur text-white mb-5">
                <Mail size={24} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">Stay ahead with CRM insights</h2>
              <p className="mt-3 max-w-xl mx-auto text-white/80">
                Get our best guides and growth tips delivered to your inbox. No spam, unsubscribe anytime.
              </p>
              <form
                onSubmit={e => { e.preventDefault(); window.location.href = '/contact' }}
                className="mt-6 max-w-md mx-auto flex flex-col sm:flex-row gap-3"
              >
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  className="flex-1 h-12 px-4 rounded-xl bg-white/95 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
                <button
                  type="submit"
                  className="h-12 px-6 rounded-xl bg-white text-blue-700 font-semibold shadow-lg hover:bg-blue-50 transition-colors"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  )
}
