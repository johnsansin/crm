'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Globe, Save, Loader2, Languages, ArrowLeft } from 'lucide-react'
import { t } from '@/lib/i18n'
import { LANGUAGES } from '@/lib/constants'
import { setOrgSettings, orgLanguage } from '@/lib/org-format'

const RTL_LANGUAGES = ['ar', 'ur', 'he', 'fa']

export function LanguageSettings({ onBack }: { onBack?: () => void }) {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const currentLang = orgLanguage().split('_')[0]
  const [selectedLang, setSelectedLang] = useState(currentLang)
  const [editKey, setEditKey] = useState('')
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)

  const isRtl = RTL_LANGUAGES.includes(selectedLang)

  const sampleKeys = [
    'Dashboard', 'Calendar', 'Marketing', 'Sales', 'Projects', 'Inventory', 'Support', 'Tools',
    'Campaigns', 'Leads', 'Accounts', 'Contacts', 'Opportunities', 'Quotes', 'Invoices',
    'Settings', 'Tickets', 'Products', 'Documents', 'Error', 'Loading...', 'Save', 'Cancel',
  ]

  const { data: translationsData } = useQuery({
    queryKey: ['i18n-translations', selectedLang],
    queryFn: () => fetch(`/api/i18n/${selectedLang}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }).then(r => r.json()).catch(() => ({ data: {} })),
  })

  const remoteTranslations = translationsData?.data || {}

  const saveMutation = useMutation({
    mutationFn: async () => {
      await api.updateOrgSettings({ language: selectedLang + '_' + (selectedLang === 'en' ? 'us' : selectedLang) })
      setOrgSettings({ language: selectedLang + '_' + (selectedLang === 'en' ? 'us' : selectedLang) })
      document.documentElement.dir = RTL_LANGUAGES.includes(selectedLang) ? 'rtl' : 'ltr'
      document.documentElement.lang = selectedLang
      if (editKey && editValue) {
        await fetch(`/api/i18n/${selectedLang}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
          body: JSON.stringify({ translations: { [editKey]: editValue } }),
        })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-settings'] })
      addToast({ title: t('Language updated'), variant: 'success' })
    },
    onError: (e: Error) => addToast({ title: t('Error'), description: e.message, variant: 'destructive' }),
  })

  return (
    <div className="space-y-4">
      {onBack && (
        <button onClick={onBack} className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-0.5" /> All Settings
        </button>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2"><Languages size={20} /> {t('Language Settings')}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Change the interface language and edit translations</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Globe size={15} /> Language</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGES.filter(l => ['en', 'zh', 'ar', 'ur', 'es', 'fr', 'de', 'ja', 'ko'].includes(l.value.split('_')[0])).map(lang => {
                const code = lang.value.split('_')[0]
                return (
                  <button
                    key={lang.value}
                    onClick={() => setSelectedLang(code)}
                    className={`p-3 rounded-xl border text-left text-sm transition-all ${selectedLang === code ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-muted-foreground/30'}`}
                  >
                    <div className="font-medium">{lang.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 uppercase">{code}</div>
                  </button>
                )
              })}
            </div>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full">
              {saveMutation.isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save size={14} className="mr-2" />}
              {saveMutation.isPending ? t('Saving...') : t('Save')}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">{t('RTL Preview')} — {selectedLang.toUpperCase()}</CardTitle></CardHeader>
          <CardContent>
            <div dir={isRtl ? 'rtl' : 'ltr'} className={`p-4 rounded-xl border bg-muted/30 ${isRtl ? 'text-right' : 'text-left'}`}>
              <p className="text-sm font-bold mb-2">{isRtl ? 'معاينة الاتجاه من اليمين إلى اليسار' : 'RTL Preview Content'}</p>
              <p className="text-xs text-muted-foreground">
                {isRtl
                  ? 'هذا مثال على كيف ستبدو الواجهة عند استخدام لغة تدعم الاتجاه من اليمين إلى اليسار.'
                  : 'This area demonstrates how the interface adapts for right-to-left languages when selected.'}
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              RTL languages (Arabic, Urdu, Hebrew, Persian) automatically flip the interface layout.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Languages size={15} /> {t('Translations')} — {selectedLang.toUpperCase()}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2">
            {sampleKeys.map(key => (
              <div key={key} className="flex items-center gap-2">
                <div className="w-40 text-xs font-mono text-muted-foreground truncate shrink-0" title={key}>{key}</div>
                <Input
                  value={remoteTranslations[key] || ''}
                  onChange={e => {
                    setEditKey(key)
                    setEditValue(e.target.value)
                  }}
                  placeholder={key}
                  className="h-8 text-xs"
                />
              </div>
            ))}
          </div>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} size="sm">
            {saveMutation.isPending ? <Loader2 className="animate-spin mr-1 h-3 w-3" /> : <Save size={12} className="mr-1" />}
            Save Translations
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
