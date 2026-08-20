import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { authMiddleware, requireAdmin } from '../middleware/auth'
import { requireTenant } from '../lib/module-permissions'

export const i18nRouter = Router()

i18nRouter.get('/locales', authMiddleware, requireTenant, async (req, res) => {
  try {
    const rows = await prisma.translation.findMany({
      where: { companyId: req.user!.companyId },
      select: { locale: true },
      distinct: ['locale'],
    })
    const locales = rows.map(r => r.locale)
    if (!locales.includes('en')) locales.unshift('en')
    res.json({ data: locales })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

i18nRouter.get('/:locale', authMiddleware, requireTenant, async (req, res) => {
  try {
    const { locale } = req.params
    const namespace = (req.query.namespace as string) || 'common'
    const rows = await prisma.translation.findMany({
      where: { companyId: req.user!.companyId, locale, namespace },
    })
    const translations: Record<string, string> = {}
    for (const row of rows) {
      translations[row.key] = row.value
    }
    res.json({ data: translations })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

i18nRouter.put('/:locale', authMiddleware, requireTenant, requireAdmin, async (req, res) => {
  try {
    const { locale } = req.params
    const { translations, namespace = 'common' } = req.body
    if (!translations || typeof translations !== 'object') {
      res.status(400).json({ error: 'translations object required' })
      return
    }
    const companyId = req.user!.companyId!
    const ops: Promise<any>[] = []
    for (const [key, value] of Object.entries(translations)) {
      ops.push(
        prisma.translation.findFirst({ where: { companyId, locale, key, namespace } }).then(existing =>
          existing
            ? prisma.translation.update({ where: { id: existing.id }, data: { value: String(value) } })
            : prisma.translation.create({ data: { locale, key, value: String(value), namespace, companyId } })
        )
      )
    }
    await Promise.all(ops)
    res.json({ ok: true, count: ops.length })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

i18nRouter.post('/translate', authMiddleware, async (req, res) => {
  const { text, targetLocale } = req.body
  if (!text) {
    res.status(400).json({ error: 'text required' })
    return
  }
  const mockTranslations: Record<string, string> = {
    zh: `[中文翻译] ${text}`,
    ar: `[ترجمة عربية] ${text}`,
    ur: `[اردو ترجمہ] ${text}`,
    es: `[Traducción español] ${text}`,
    fr: `[Traduction française] ${text}`,
    de: `[Deutsche Übersetzung] ${text}`,
    ja: `[日本語翻訳] ${text}`,
    ko: `[한국어 번역] ${text}`,
    hi: `[हिंदी अनुवाद] ${text}`,
  }
  res.json({
    data: {
      original: text,
      locale: targetLocale || 'zh',
      translated: mockTranslations[targetLocale || 'zh'] || `[${targetLocale}] ${text}`,
      model: 'bizforce-translate-mock',
      tokens: text.length,
    },
  })
})
