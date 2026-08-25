'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/auth'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { LANGUAGES, TIMEZONES, DATE_FORMATS } from '@/lib/constants'
import { t } from '@/lib/i18n'
import { setOrgSettings } from '@/lib/org-format'
import { Settings, Globe, Clock, CalendarDays, Sparkles, Loader2 } from 'lucide-react'

export function QuickStartModal() {
  const { user } = useAuthStore()
  const { addToast } = useToast()
  const [language, setLanguage] = useState(user?.language || 'en_us')
  const [timezone, setTimezone] = useState(user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC')
  const [dateFormat, setDateFormat] = useState(user?.dateFormat || 'mm-dd-yyyy')
  const [saving, setSaving] = useState(false)

  if (user?.hasCompletedQuickStart) return null

  const handleGetStarted = async () => {
    setSaving(true)
    try {
      await api.completeQuickStart({ language, timezone, dateFormat })
      useAuthStore.setState({
        user: { ...user, hasCompletedQuickStart: true, language, timezone, dateFormat }
      })
      setOrgSettings({ language, timezone, dateFormat })
      addToast({ title: t('Welcome!'), description: t('Your preferences have been saved.'), variant: 'success' })
    } catch {
      addToast({ title: t('Error'), description: t('Failed to save preferences'), variant: 'destructive' })
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl shadow-2xl border w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 px-8 pt-8 pb-10 text-center overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-4 left-4 w-20 h-20 rounded-full bg-white/10 blur-xl" />
            <div className="absolute bottom-2 right-6 w-28 h-28 rounded-full bg-white/10 blur-xl" />
          </div>
          <div className="relative">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 shadow-lg">
              <Settings size={28} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">{t('Almost there!')}</h2>
            <p className="mt-1.5 text-sm text-indigo-100">{t('All fields below are required')}</p>
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-6 space-y-5 relative z-[210]">
          {/* Language */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Globe size={15} className="text-indigo-500" /> {t('Language')}
            </label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="h-10 text-sm"><SelectValue placeholder={t('Select language')} /></SelectTrigger>
              <SelectContent className="max-h-64 z-[220]">
                {LANGUAGES.map(l => (
                  <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Timezone */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Clock size={15} className="text-indigo-500" /> {t('Timezone')}
            </label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger className="h-10 text-sm"><SelectValue placeholder={t('Select timezone')} /></SelectTrigger>
              <SelectContent className="max-h-64 z-[220]">
                {TIMEZONES.map(tz => (
                  <SelectItem key={tz} value={tz}>{tz.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Format */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <CalendarDays size={15} className="text-indigo-500" /> {t('Date Format')}
            </label>
            <Select value={dateFormat} onValueChange={setDateFormat}>
              <SelectTrigger className="h-10 text-sm"><SelectValue placeholder={t('Select date format')} /></SelectTrigger>
              <SelectContent className="z-[220]">
                {DATE_FORMATS.map(f => (
                  <SelectItem key={f} value={f}><span className="font-mono text-xs">{f}</span></SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 pb-7 pt-2">
          <Button
            onClick={handleGetStarted}
            disabled={saving}
            className="w-full h-11 text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/25"
          >
            {saving ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Sparkles size={16} className="mr-2" />}
            {t('Get Started')}
          </Button>
        </div>
      </div>
    </div>
  )
}
