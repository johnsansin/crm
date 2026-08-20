import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { DataTable } from '@/components/ui/data-table'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Plus, Pencil, Trash2, Users, Shield, Banknote, Percent, Building2, Sun, Moon, UserCircle, Loader2, Save, Globe, MapPin, Settings2, Share2, ListChecks, ScrollText, Mail, Workflow, Database, Megaphone, FileText, Search, ArrowLeft, ChevronRight, Sparkles, PlugZap, Tag, LayoutDashboard, Trash2 as TrashIcon, Eye, Upload, Download, TrendingUp, Package, LifeBuoy, FolderKanban, Wrench, CheckCircle2, UserCheck, Power, Target, Languages, type LucideIcon } from 'lucide-react'
import { useTheme, type Accent } from '@/lib/theme'
import { TIMEZONES, DATE_FORMATS, COUNTRIES, SOCIAL_FIELDS } from '@/lib/constants'
import { OrgSettings } from '@/pages/settings/OrgSettings'
import { AccessSettings } from '@/pages/settings/AccessSettings'
import { PicklistSettings } from '@/pages/settings/PicklistSettings'
import { LeadSettings } from '@/pages/settings/LeadSettings'
import { PotentialSettings } from '@/pages/settings/PotentialSettings'
import { EmailSettings } from '@/pages/settings/EmailSettings'
import { AuditSettings } from '@/pages/settings/AuditSettings'
import { AutomationSettings } from '@/pages/settings/AutomationSettings'
import { CommunicationSettings } from '@/pages/settings/CommunicationSettings'
import { DataSettings } from '@/pages/settings/DataSettings'
import { TermsSettings } from '@/pages/settings/TermsSettings'
import { IntegrationSettings } from '@/pages/settings/IntegrationSettings'
import { TagsSettings } from '@/pages/settings/TagsSettings'
import { MenuSettings } from '@/pages/settings/MenuSettings'
import { LanguageSettings } from '@/pages/settings/LanguageSettings'
import { RecycleBinPage } from '@/pages/RecycleBinPage'

const TINTS: Record<string, string> = {
  users: 'from-sky-500 to-blue-600',
  roles: 'from-indigo-500 to-violet-600',
  groups: 'from-fuchsia-500 to-pink-600',
  sharing: 'from-violet-500 to-purple-600',
  company: 'from-blue-500 to-indigo-600',
  org: 'from-cyan-500 to-sky-600',
  currencies: 'from-emerald-500 to-teal-600',
  tax: 'from-lime-500 to-green-600',
  terms: 'from-amber-500 to-orange-600',
  picklists: 'from-rose-500 to-pink-600',
  email: 'from-orange-500 to-amber-600',
  audit: 'from-slate-500 to-slate-700',
  automation: 'from-purple-500 to-violet-700',
  leads: 'from-blue-500 to-cyan-600',
  potentials: 'from-emerald-500 to-teal-700',
  data: 'from-teal-500 to-emerald-700',
  announcements: 'from-pink-500 to-rose-600',
  integrations: 'from-cyan-500 to-teal-600',
  tags: 'from-amber-400 to-orange-600',
  menu: 'from-violet-500 to-indigo-700',
  trash: 'from-red-500 to-rose-700',
  language: 'from-cyan-500 to-blue-600',
}

const CATEGORIES = [
  {
    label: 'Users & Access',
    blurb: 'People, roles, groups and record visibility',
    keys: ['users', 'roles', 'groups', 'sharing'],
  },
  {
    label: 'Organization',
    blurb: 'Company branding, regional, financial and document defaults',
    keys: ['company', 'org', 'currencies', 'tax', 'terms', 'leads', 'potentials'],
  },
  {
    label: 'Data & Automation',
    blurb: 'Fields, email, audit, workflows and data tools',
    keys: ['picklists', 'email', 'automation', 'audit', 'data', 'tags'],
  },
  {
    label: 'Communication',
    blurb: 'Keep your team informed',
    keys: ['announcements'],
  },
  {
    label: 'Integrations',
    blurb: 'REST API, portal, Google sync, layouts, menu and dependencies',
    keys: ['integrations', 'menu'],
  },
  {
    label: 'System',
    blurb: 'Recover deleted records',
    keys: ['trash', 'language'],
  },
]

const settingSections = [
  { key: 'users', label: 'Users', icon: Users, desc: 'Manage CRM users and their access' },
  { key: 'roles', label: 'Roles', icon: Shield, desc: 'Define role hierarchy and module permissions' },
  { key: 'groups', label: 'Groups', icon: UserCircle, desc: 'Organize users into groups' },
  { key: 'sharing', label: 'Sharing Access', icon: Share2, desc: 'Record visibility rules and permission profiles' },
  { key: 'company', label: 'Company', icon: Building2, desc: 'Organization details and branding' },
  { key: 'org', label: 'Organization', icon: Settings2, desc: 'Password policy, login security, lead config, regional, inventory' },
  { key: 'leads', label: 'Leads', icon: Target, desc: 'Lead conversion mapping and defaults' },
  { key: 'potentials', label: 'Potentials', icon: Target, desc: 'Sales stage probability mapping' },
  { key: 'currencies', label: 'Currencies', icon: Banknote, desc: 'Manage currencies and exchange rates' },
  { key: 'tax', label: 'Tax', icon: Percent, desc: 'Configure tax rates' },
  { key: 'terms', label: 'Document Terms', icon: FileText, desc: 'Default terms for quotes, orders, and invoices' },
  { key: 'picklists', label: 'Picklists & Fields', icon: ListChecks, desc: 'Picklist editor, custom fields, module manager' },
  { key: 'email', label: 'Email / SMTP', icon: Mail, desc: 'Outgoing mail server, test and send emails' },
  { key: 'automation', label: 'Workflows & Tasks', icon: Workflow, desc: 'Workflows, scheduled tasks, and webforms' },
  { key: 'audit', label: 'Audit Trail', icon: ScrollText, desc: 'Audit trail and per-org login history' },
  { key: 'data', label: 'Data Management', icon: Database, desc: 'Backup, export, and CSV import' },
  { key: 'announcements', label: 'Announcements', icon: Megaphone, desc: 'Announcements, notifications, and holidays' },
  { key: 'integrations', label: 'Integrations', icon: PlugZap, desc: 'REST API keys, customer portal, Google sync, picklist dependencies, layout editor, payment reminders' },
  { key: 'tags', label: 'Tags', icon: Tag, desc: 'Manage organisation-wide tags for records' },
  { key: 'menu', label: 'Menu Editor', icon: LayoutDashboard, desc: 'Reorder modules, group under parents, and hide modules in the sidebar' },
  { key: 'trash', label: 'Recycle Bin', icon: TrashIcon, desc: 'Restore or permanently delete soft-deleted records' },
  { key: 'language', label: 'Language & i18n', icon: Languages, desc: 'Manage interface languages and translations' },
]

const sectionMap = Object.fromEntries(settingSections.map(s => [s.key, s]))

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const { theme, toggleTheme, accent, setAccent } = useTheme()
  const visibleSections = settingSections
  const filtered = visibleSections.filter(s =>
    s.label.toLowerCase().includes(search.toLowerCase()) ||
    s.desc.toLowerCase().includes(search.toLowerCase())
  )

  if (activeSection) {
    const sec = sectionMap[activeSection]
    return (
      <div className="space-y-5">
        <button
          onClick={() => setActiveSection(null)}
          className="group inline-flex items-center gap-3 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-card to-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
        >
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm"><ArrowLeft size={15} className="transition-transform group-hover:-translate-x-0.5" /></span>
          <span><span className="block leading-none">All Settings</span><span className="mt-1 block text-[10px] font-normal text-muted-foreground">Back to control center</span></span>
        </button>
        <div className="p-5 md:p-6 rounded-2xl border bg-card relative overflow-hidden">
          <div className={`absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br ${TINTS[activeSection] || 'from-primary to-indigo-600'} opacity-20 blur-2xl pointer-events-none`} />
          <div className="relative flex items-start gap-4">
            <div className={`shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${TINTS[activeSection] || 'from-primary to-indigo-600'} text-white flex items-center justify-center shadow-lg shadow-indigo-500/20`}>
              <sec.icon size={22} />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">{sec.label}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">{sec.desc}</p>
            </div>
          </div>
        </div>
        {activeSection === 'users' && <UsersSettings />}
        {activeSection === 'roles' && <RolesSettings />}
        {activeSection === 'groups' && <GroupsSettings />}
        {activeSection === 'currencies' && <CurrenciesSettings />}
        {activeSection === 'tax' && <TaxSettings />}
        {activeSection === 'company' && <CompanySettings />}
        {activeSection === 'org' && <OrgSettings />}
        {activeSection === 'leads' && <LeadSettings />}
        {activeSection === 'potentials' && <PotentialSettings />}
        {activeSection === 'sharing' && <AccessSettings />}
        {activeSection === 'picklists' && <PicklistSettings />}
        {activeSection === 'email' && <EmailSettings />}
        {activeSection === 'audit' && <AuditSettings />}
        {activeSection === 'automation' && <AutomationSettings />}
        {activeSection === 'announcements' && <CommunicationSettings />}
        {activeSection === 'data' && <DataSettings />}
        {activeSection === 'terms' && <TermsSettings />}
        {activeSection === 'integrations' && <IntegrationSettings />}
        {activeSection === 'tags' && <TagsSettings />}
        {activeSection === 'menu' && <MenuSettings />}
        {activeSection === 'trash' && <RecycleBinPage />}
        {activeSection === 'language' && <LanguageSettings onBack={() => setActiveSection(null)} />}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-700 px-6 py-8 md:px-8 md:py-10 text-white shadow-xl shadow-blue-500/20">
        <div className="absolute inset-0 bg-gradient-to-b from-white/15 via-transparent to-transparent" />
        <div className="absolute -top-20 -right-16 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 left-1/3 w-80 h-80 rounded-full bg-indigo-400/20 blur-3xl pointer-events-none" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-100/90 bg-white/10 border border-white/15 rounded-full px-3 py-1 mb-3">
              <Sparkles size={13} /> Control Center
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-sm text-blue-100 mt-1 max-w-xl">
              Configure your workspace — users, permissions, fields, automation, and more.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleTheme}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white backdrop-blur"
          >
            {theme === 'dark' ? <Sun size={16} className="mr-2" /> : <Moon size={16} className="mr-2" />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-3 shadow-sm">
        <div className="relative min-w-[240px] max-w-md flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search settings..." className="pl-9 rounded-xl h-11" />
        </div>
        <div className="flex items-center gap-2" aria-label="Accent theme">
          <span className="mr-1 text-xs font-medium text-muted-foreground">Accent</span>
          {([
            ['blue', 'bg-blue-600'], ['violet', 'bg-violet-600'], ['emerald', 'bg-emerald-600'], ['rose', 'bg-rose-600'], ['orange', 'bg-orange-500'],
          ] as [Accent, string][]).map(([value, color]) => (
            <button key={value} type="button" title={`${value} theme`} aria-label={`${value} theme`} aria-pressed={accent === value} onClick={() => setAccent(value)} className={`h-7 w-7 rounded-full ${color} ring-offset-2 ring-offset-card transition-transform hover:scale-110 ${accent === value ? 'ring-2 ring-foreground' : ''}`} />
          ))}
        </div>
      </div>

      {/* Categories */}
      {CATEGORIES.map(cat => {
        const items = cat.keys
          .map(k => sectionMap[k])
          .filter(s => s && filtered.some(f => f.key === s.key))
        if (items.length === 0) return null
        return (
          <section key={cat.label} className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold tracking-wide text-foreground/90">{cat.label}</h2>
              <p className="text-xs text-muted-foreground">{cat.blurb}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map(s => (
                <button
                  key={s.key}
                  onClick={() => setActiveSection(s.key)}
                  className="group text-left p-4 rounded-2xl border bg-card hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5 hover:border-primary/40 transition-all duration-200"
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br ${TINTS[s.key]} text-white flex items-center justify-center shadow-md shadow-black/5 group-hover:scale-105 transition-transform`}>
                      <s.icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold flex items-center justify-between gap-2">
                        {s.label}
                        <ChevronRight size={15} className="text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )
      })}

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Search size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No settings match "{search}"</p>
        </div>
      )}
    </div>
  )
}

const MODULES = [
  { key: 'accounts', label: 'Accounts', parent: 'Marketing' },
  { key: 'contacts', label: 'Contacts', parent: 'Marketing' },
  { key: 'leads', label: 'Leads', parent: 'Marketing' },
  { key: 'campaigns', label: 'Campaigns', parent: 'Marketing' },
  { key: 'potentials', label: 'Potentials', parent: 'Sales' },
  { key: 'quotes', label: 'Quotes', parent: 'Sales' },
  { key: 'salesorders', label: 'Sales Orders', parent: 'Sales' },
  { key: 'invoices', label: 'Invoices', parent: 'Sales' },
  { key: 'smsnotifier', label: 'SMS Notifier', parent: 'Sales' },
  { key: 'products', label: 'Products', parent: 'Inventory' },
  { key: 'services', label: 'Services', parent: 'Inventory' },
  { key: 'vendors', label: 'Vendors', parent: 'Inventory' },
  { key: 'pricebooks', label: 'Price Books', parent: 'Inventory' },
  { key: 'purchaseorders', label: 'Purchase Orders', parent: 'Inventory' },
  { key: 'tickets', label: 'Tickets', parent: 'Support' },
  { key: 'faq', label: 'FAQ', parent: 'Support' },
  { key: 'servicecontracts', label: 'Service Contracts', parent: 'Support' },
  { key: 'assets', label: 'Assets', parent: 'Support' },
  { key: 'projects', label: 'Projects', parent: 'Projects' },
  { key: 'projecttasks', label: 'Project Tasks', parent: 'Projects' },
  { key: 'projectmilestones', label: 'Project Milestones', parent: 'Projects' },
  { key: 'documents', label: 'Documents', parent: 'Tools' },
  { key: 'emails', label: 'Emails', parent: 'Tools' },
  { key: 'emailtemplates', label: 'Email Templates', parent: 'Tools' },
]

const PERMISSION_GROUPS = ['Marketing', 'Sales', 'Inventory', 'Support', 'Projects', 'Tools']

const PERMISSION_ACTIONS = [
  { key: 'view', label: 'View', icon: Eye },
  { key: 'create', label: 'Create', icon: Plus },
  { key: 'edit', label: 'Edit', icon: Pencil },
  { key: 'delete', label: 'Delete', icon: Trash2 },
  { key: 'import', label: 'Import', icon: Upload },
  { key: 'export', label: 'Export', icon: Download },
] as const

const GROUP_META: Record<string, { icon: LucideIcon; badge: string }> = {
  Marketing: { icon: Megaphone, badge: 'bg-pink-500/10 text-pink-600' },
  Sales: { icon: TrendingUp, badge: 'bg-emerald-500/10 text-emerald-600' },
  Inventory: { icon: Package, badge: 'bg-amber-500/10 text-amber-600' },
  Support: { icon: LifeBuoy, badge: 'bg-sky-500/10 text-sky-600' },
  Projects: { icon: FolderKanban, badge: 'bg-violet-500/10 text-violet-600' },
  Tools: { icon: Wrench, badge: 'bg-rose-500/10 text-rose-600' },
}

function PermissionsMatrix({ roleId }: { roleId: string }) {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [perms, setPerms] = useState<Record<string, any>>({})

  const { data, isLoading } = useQuery({
    queryKey: ['role-permissions', roleId],
    queryFn: () => api.getRolePermissions(roleId),
  })

  useEffect(() => {
    if (data?.data) {
      const map: Record<string, any> = {}
      data.data.forEach((p: any) => { map[p.moduleName] = p })
      setPerms(map)
    }
  }, [data])

  const saveMutation = useMutation({
    mutationFn: (permissions: any[]) => api.updateRolePermissions(roleId, permissions),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['role-permissions'] }); addToast({ title: 'Permissions saved', variant: 'success' }) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const emptyPerms = () => ({ view: false, create: false, edit: false, delete: false, import: false, export: false })
  const ACTIONS = PERMISSION_ACTIONS.map(a => a.key)

  const toggle = (moduleName: string, action: string) => {
    const current = perms[moduleName] || emptyPerms()
    setPerms(p => ({ ...p, [moduleName]: { ...current, [action]: !current[action] } }))
  }

  const toggleColumn = (action: string) => {
    const allOn = MODULES.every(m => (perms[m.key] || emptyPerms())[action])
    setPerms(p => {
      const next: Record<string, any> = { ...p }
      for (const m of MODULES) {
        const cur = next[m.key] || emptyPerms()
        next[m.key] = { ...cur, [action]: !allOn }
      }
      return next
    })
  }

  const moduleAllOn = (moduleName: string) => {
    const p = perms[moduleName] || emptyPerms()
    return ACTIONS.every(a => p[a])
  }

  const setAll = (on: boolean) => {
    setPerms(p => {
      const next: Record<string, any> = { ...p }
      for (const m of MODULES) {
        next[m.key] = { view: on, create: on, edit: on, delete: on, import: on, export: on }
      }
      return next
    })
  }

  const groupAllOn = (group: string) => MODULES.filter(m => m.parent === group).every(m => moduleAllOn(m.key))

  const toggleGroup = (group: string) => {
    const on = !groupAllOn(group)
    setPerms(p => {
      const next: Record<string, any> = { ...p }
      for (const m of MODULES.filter(m => m.parent === group)) {
        next[m.key] = { view: on, create: on, edit: on, delete: on, import: on, export: on }
      }
      return next
    })
  }

  const handleSave = () => {
    const list = Object.entries(perms).map(([moduleName, p]) => ({ moduleName, ...p }))
    saveMutation.mutate(list)
  }

  const enabledCount = MODULES.reduce((sum, m) => {
    const p = perms[m.key] || emptyPerms()
    return sum + ACTIONS.filter(a => p[a]).length
  }, 0)

  if (isLoading) return (
    <div className="flex justify-center py-16"><Loader2 className="animate-spin text-muted-foreground" /></div>
  )

  const switchCls = (on: boolean, size: 'sm' | 'md') => (
    `relative inline-flex items-center rounded-full transition-colors cursor-pointer ${on ? 'bg-emerald-500' : 'bg-input hover:bg-muted-foreground/30'} ${size === 'sm' ? 'h-4 w-7' : 'h-5 w-9'}`
  )
  const knobCls = (on: boolean, size: 'sm' | 'md') => (
    `inline-block transform rounded-full bg-white shadow-sm transition-transform ${size === 'sm' ? 'h-2.5 w-2.5' + (on ? ' translate-x-[15px]' : ' translate-x-0.5') : 'h-3.5 w-3.5' + (on ? ' translate-x-[18px]' : ' translate-x-1')}`
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-bold flex items-center gap-2"><Shield size={15} className="text-primary" /> Module Permissions</div>
          <p className="text-xs text-muted-foreground mt-0.5">Toggle a group, module column, or individual action. Changes apply when you save.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${enabledCount === MODULES.length * ACTIONS.length ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
            <CheckCircle2 size={13} /> {enabledCount}/{MODULES.length * ACTIONS.length} enabled
          </span>
          <Button variant="outline" size="sm" onClick={() => setAll(true)}>Enable all</Button>
          <Button variant="outline" size="sm" onClick={() => setAll(false)}>Disable all</Button>
          <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <Loader2 className="animate-spin mr-1.5 h-4 w-4" /> : <Save size={14} className="mr-1.5" />}
            {saveMutation.isPending ? 'Saving...' : 'Save Permissions'}
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[760px]">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setAll(!MODULES.every(m => moduleAllOn(m.key)))}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/90 hover:text-primary transition-colors"
                    title={MODULES.every(m => moduleAllOn(m.key)) ? 'Disable all actions for all modules' : 'Enable all actions for all modules'}
                  >
                    <span className={switchCls(MODULES.every(m => moduleAllOn(m.key)), 'sm')}>
                      <span className={knobCls(MODULES.every(m => moduleAllOn(m.key)), 'sm')} />
                    </span>
                    Module
                  </button>
                </th>
                {PERMISSION_ACTIONS.map(({ key, label, icon: ActIcon }) => {
                  const allOn = MODULES.every(m => (perms[m.key] || emptyPerms())[key])
                  const someOn = MODULES.some(m => (perms[m.key] || emptyPerms())[key])
                  return (
                    <th key={key} className="text-center px-3 py-3">
                      <button
                        type="button"
                        onClick={() => toggleColumn(key)}
                        className="inline-flex flex-col items-center gap-1.5 hover:text-primary transition-colors group"
                        title={allOn ? `Disable ${label} for all modules` : `Enable ${label} for all modules`}
                      >
                        <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${allOn ? 'text-emerald-600' : someOn ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}>
                          <ActIcon size={14} /> {label}
                        </span>
                        <span className={switchCls(allOn, 'sm')}>
                          <span className={knobCls(allOn, 'sm')} />
                        </span>
                      </button>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_GROUPS.flatMap(group => {
                const groupMods = MODULES.filter(m => m.parent === group)
                const meta = GROUP_META[group]
                const GIcon = meta?.icon
                const headerRow = (
                  <tr key={`group-${group}`} className="border-b">
                    <td colSpan={7} className="px-3 py-0">
                      <div className="bg-muted/30 -mx-3 px-3 py-2">
                        <button
                          type="button"
                          onClick={() => toggleGroup(group)}
                          className="inline-flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-foreground/80 hover:text-primary transition-colors group"
                          title={groupAllOn(group) ? `Disable all actions for ${group}` : `Enable all actions for ${group}`}
                        >
                          {GIcon && <span className={`p-1.5 rounded-lg ${meta.badge}`}><GIcon size={14} /></span>}
                          <span className={groupAllOn(group) ? 'text-emerald-600' : 'group-hover:text-primary'}>{group}</span>
                          <span className={switchCls(groupAllOn(group), 'sm')}>
                            <span className={knobCls(groupAllOn(group), 'sm')} />
                          </span>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-background border text-muted-foreground">{groupMods.length}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
                const modRows = groupMods.map((m, i) => {
                  const p = perms[m.key] || emptyPerms()
                  return (
                    <tr key={m.key} className={`border-b last:border-0 hover:bg-muted/40 transition-colors ${i % 2 === 1 ? 'bg-muted/20' : ''}`}>
                      <td className="px-4 py-2.5 font-medium text-foreground/90">{m.label}</td>
                      {ACTIONS.map(action => (
                        <td key={action} className="text-center px-3 py-2.5">
                          <button
                            type="button"
                            onClick={() => toggle(m.key, action)}
                            className={switchCls(!!p[action], 'md')}
                            title={p[action] ? `Disable ${action}` : `Enable ${action}`}
                          >
                            <span className={knobCls(!!p[action], 'md')} />
                          </button>
                        </td>
                      ))}
                    </tr>
                  )
                })
                return [headerRow, ...modRows]
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function UsersSettings() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const emptyUserForm = { userName: '', email: '', firstName: '', lastName: '', password: '', isAdmin: false, roleId: '', groupId: '', pbxExtension: '', dashboardEnabled: true }
  const [form, setForm] = useState(emptyUserForm)

  const { data: usersData } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => fetch('/api/users?includeInactive=1', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }).then(r => r.json()).catch(() => ({ data: [] })),
  })

  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: () => api.listAll('roles').catch(() => ({ data: [] })),
  })
  const { data: groupsData } = useQuery({ queryKey: ['usergroups'], queryFn: () => api.listGroups().catch(() => ({ data: [] })) })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { groupId, ...userData } = data
      const user = await fetch('/api/users', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify(userData),
      }).then(r => { if (!r.ok) throw new Error('Failed'); return r.json() })
      if (groupId && user.id) await api.addGroupMember(groupId, user.id)
      return user
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['all-users'] }); queryClient.invalidateQueries({ queryKey: ['usergroups'] }); addToast({ title: 'User created', variant: 'success' }); setShowForm(false); setForm(emptyUserForm) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const { groupId, ...userData } = data
      const user = await fetch(`/api/users/${editId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify(userData),
      }).then(r => { if (!r.ok) throw new Error('Failed'); return r.json() })
      if (groupId && editId) await api.addGroupMember(groupId, editId).catch(() => null)
      return user
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['all-users'] }); addToast({ title: 'User updated', variant: 'success' }); setEditId(null); setShowForm(false) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/users/${deleteId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['all-users'] }); addToast({ title: 'User deactivated', description: 'The user can no longer sign in', variant: 'success' }); setDeleteId(null) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const toggleActiveMutation = useMutation({
    mutationFn: (u: any) =>
      fetch(`/api/users/${u.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ isActive: u.isActive === false }),
      }).then(r => { if (!r.ok) throw new Error('Failed'); return r.json() }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['all-users'] }); addToast({ title: 'User status updated', variant: 'success' }) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const roles = rolesData?.data || []
  const groups = groupsData?.data || []

  const filteredUsers = (usersData?.data || [])
    .map((u: any) => ({ ...u, name: `${u.firstName} ${u.lastName}` }))
    .filter((u: any) =>
      statusFilter === 'all' ? true
      : statusFilter === 'active' ? u.isActive !== false
      : u.isActive === false
    )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-bold">Users</h2>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="flex h-9 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Users</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <Button onClick={() => { setShowForm(true); setEditId(null); setForm(emptyUserForm) }}>
            <Plus size={16} className="mr-2" /> New User
          </Button>
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={[
              { key: 'name', label: 'Name', sortable: true, render: (_: any, u: any) => (
                <div className="flex items-center gap-2.5">
                  {u.avatar ? (
                    <img src={u.avatar} alt="" className="h-8 w-8 rounded-full object-cover shrink-0" />
                  ) : (
                    <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                      {((u.firstName?.[0] || '') + (u.lastName?.[0] || '')).toUpperCase() || '?'}
                    </span>
                  )}
                  <span className="font-medium">{u.firstName} {u.lastName}</span>
                </div>
              ) },
              { key: 'email', label: 'Email', sortable: true },
              { key: 'roleName', label: 'Role', sortable: true, render: (v: any) => v ? <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 text-xs font-medium">{v}</span> : '—' },
              { key: 'groups', label: 'Group', sortable: true, render: (v: any) => v && v.length ? <span className="inline-flex items-center rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 px-2 py-0.5 text-xs font-medium">{v.join(', ')}</span> : '—' },
              { key: 'pbxExtension', label: 'PBX Ext.', sortable: true, render: (v: any) => v ? <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 text-xs font-mono">{v}</span> : <span className="text-muted-foreground text-xs">—</span> },
              { key: 'online', label: 'Online', sortable: true, render: (v: any) => v ? <span className="inline-flex items-center gap-1.5 text-xs"><span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />Online</span> : <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600 inline-block" />Offline</span> },
              { key: 'isAdmin', label: 'Admin', sortable: true, render: (v: any) => v ? <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 px-2 py-0.5 text-xs font-medium">Yes</span> : <span className="text-muted-foreground text-xs">No</span> },
              { key: 'status', label: 'Status', sortable: true, render: (_: any, u: any) => u.isActive === false ? <span className="inline-flex items-center rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-xs">Inactive</span> : <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 px-2 py-0.5 text-xs">Active</span> },
              { key: 'dashboardEnabled', label: 'Dashboard', sortable: true, render: (v: any) => v === false ? <span className="inline-flex items-center rounded-full bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 px-2 py-0.5 text-xs">Off</span> : <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 px-2 py-0.5 text-xs">On</span> },
            ]}
            data={filteredUsers}
            loading={!usersData}
            emptyMessage="No users found"
            pageSize={10}
            actions={(u: any) => (
              <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditId(u.id); setForm({ userName: u.userName, email: u.email, firstName: u.firstName, lastName: u.lastName, password: '', isAdmin: u.isAdmin, roleId: u.roleId || '', groupId: groups.find((g:any) => g.members?.some((m:any) => m.userId === u.id || m.user?.id === u.id))?.id || '', pbxExtension: u.pbxExtension || '', dashboardEnabled: u.dashboardEnabled !== false }); setShowForm(true) }} title="Edit">
                  <Pencil size={14} />
                </Button>
                {u.isActive === false ? (
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleActiveMutation.mutate(u)} title="Activate">
                    <UserCheck size={14} className="text-emerald-600" />
                  </Button>
                ) : (
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteId(u.id)} title="Deactivate">
                    <Power size={14} className="text-destructive" />
                  </Button>
                )}
              </div>
            )}
          />
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={(o) => { if (!o) setEditId(null); setShowForm(o) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit User' : 'New User'}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault()
            const payload = editId ? { ...form, isAdmin: form.isAdmin } : form
            if (editId) updateMutation.mutate(payload)
            else createMutation.mutate(payload)
          }} className="space-y-3">
            <div>
              <label className="text-sm font-medium">Username *</label>
              <Input value={form.userName} onChange={e => setForm(f => ({ ...f, userName: e.target.value }))} required />
            </div>
            <div>
              <label className="text-sm font-medium">Email *</label>
              <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">First Name *</label>
                <Input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} required />
              </div>
              <div>
                <label className="text-sm font-medium">Last Name *</label>
                <Input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} required />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">{editId ? 'New Password (leave blank to keep)' : 'Password *'}</label>
              <PasswordInput value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required={!editId} />
            </div>
            <div>
              <label className="text-sm font-medium">Role</label>
              <select value={form.roleId} onChange={e => setForm(f => ({ ...f, roleId: e.target.value }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                <option value="">No role</option>
                {roles.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Organization Group</label>
              <select value={form.groupId} onChange={e => setForm(f => ({ ...f, groupId: e.target.value }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">No group</option>
                {groups.map((g:any) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              <p className="mt-1 text-xs text-muted-foreground">Groups can be used for team assignment and access organization.</p>
            </div>
            <div>
              <label className="text-sm font-medium">PBX Extension</label>
              <Input placeholder="e.g. 2001 (used for click-to-call and call routing)" value={form.pbxExtension} onChange={e => setForm(f => ({ ...f, pbxExtension: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isAdmin" checked={form.isAdmin} onChange={e => setForm(f => ({ ...f, isAdmin: e.target.checked }))} />
              <label htmlFor="isAdmin" className="text-sm">Admin</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="dashboardEnabled" checked={form.dashboardEnabled} onChange={e => setForm(f => ({ ...f, dashboardEnabled: e.target.checked }))} />
              <label htmlFor="dashboardEnabled" className="text-sm">Dashboard Enabled</label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit">{editId ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate()}
        title="Deactivate User"
        description="This user will lose access to the CRM and will no longer be able to sign in. Their data is preserved and they can be reactivated later."
        confirmLabel="Deactivate"
      />
    </div>
  )
}

function RolesSettings() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', description: '', parentId: '' })

  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: () => api.listAll('roles').catch(() => ({ data: [] })),
  })

  const { data: treeData } = useQuery({
    queryKey: ['role-tree'],
    queryFn: () => api.getRoleTree().catch(() => ({ data: [] })),
  })

  const roles = rolesData?.data || []

  const createMutation = useMutation({
    mutationFn: (d: any) => api.create('roles', d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['roles'] }); queryClient.invalidateQueries({ queryKey: ['role-tree'] }); addToast({ title: 'Role created', variant: 'success' }); setShowForm(false); setForm({ name: '', description: '', parentId: '' }) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const updateMutation = useMutation({
    mutationFn: (d: any) => api.update('roles', editId!, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['roles'] }); queryClient.invalidateQueries({ queryKey: ['role-tree'] }); addToast({ title: 'Role updated', variant: 'success' }); setEditId(null); setShowForm(false) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete('roles', deleteId!),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['roles'] }); queryClient.invalidateQueries({ queryKey: ['role-tree'] }); addToast({ title: 'Role deleted', variant: 'success' }); setDeleteId(null); setSelectedRoleId(null) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  function renderTree(children: any[], depth = 0) {
    return children.map((node: any) => (
      <div key={node.id}>
        <div
          className={`flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-muted/30 ${selectedRoleId === node.id ? 'bg-primary/10' : ''}`}
          style={{ paddingLeft: `${12 + depth * 24}px` }}
          onClick={() => setSelectedRoleId(node.id)}
        >
          <Shield size={14} className="text-muted-foreground shrink-0" />
          <span className="text-sm font-medium">{node.name}</span>
          {node.description && <span className="text-xs text-muted-foreground">— {node.description}</span>}
        </div>
        {node.children && renderTree(node.children, depth + 1)}
      </div>
    ))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Roles</h2>
        <Button onClick={() => { setShowForm(true); setEditId(null); setForm({ name: '', description: '', parentId: '' }) }}>
          <Plus size={16} className="mr-2" /> New Role
        </Button>
      </div>
      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Role Hierarchy</CardTitle></CardHeader>
          <CardContent className="p-0">
            {treeData?.data?.length ? renderTree(treeData.data) : (
              <p className="text-sm text-muted-foreground p-4">No roles defined</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Permissions {selectedRoleId ? <span className="text-muted-foreground font-normal">— {roles.find((r: any) => r.id === selectedRoleId)?.name}</span> : ''}</CardTitle></CardHeader>
          <CardContent>
            {selectedRoleId ? <PermissionsMatrix roleId={selectedRoleId} /> : (
              <p className="text-sm text-muted-foreground">Select a role to edit permissions</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">All Roles</CardTitle></CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={[
              { key: 'name', label: 'Name', render: (v: any) => <span className="font-medium">{v}</span> },
              { key: 'parentId', label: 'Parent', render: (_: any, r: any) => roles.find((p: any) => p.id === r.parentId)?.name || '—' },
              { key: 'description', label: 'Description', render: (v: any) => <span className="text-muted-foreground">{v || '—'}</span> },
            ]}
            data={roles}
            loading={!rolesData}
            emptyMessage="No roles defined"
            pageSize={10}
            actions={(r: any) => (
              <div className="flex items-center justify-end gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditId(r.id); setForm({ name: r.name, description: r.description || '', parentId: r.parentId || '' }); setShowForm(true) }} title="Edit">
                  <Pencil size={14} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteId(r.id)} title="Delete">
                  <Trash2 size={14} className="text-destructive" />
                </Button>
              </div>
            )}
          />
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={(o) => { if (!o) setEditId(null); setShowForm(o) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit Role' : 'New Role'}</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); const d = { ...form, parentId: form.parentId || undefined }; if (editId) updateMutation.mutate(d); else createMutation.mutate(d) }} className="space-y-3">
            <Input placeholder="Role Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            <Input placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <div>
              <label className="text-sm font-medium">Parent Role</label>
              <select value={form.parentId} onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                <option value="">None (top-level)</option>
                {roles.filter(r => r.id !== editId).map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit">{editId ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Role"
        description="Are you sure you want to delete this role?"
        confirmLabel="Delete"
      />
    </div>
  )
}

function GroupsSettings() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showMembers, setShowMembers] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', description: '' })
  const [addMemberUserId, setAddMemberUserId] = useState('')

  const { data: groupsData } = useQuery({
    queryKey: ['usergroups'],
    queryFn: () => api.listGroups().catch(() => ({ data: [] })),
  })

  const { data: usersData } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => fetch('/api/users', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }).then(r => r.json()).catch(() => ({ data: [] })),
  })

  const createMutation = useMutation({
    mutationFn: (d: any) => api.createGroup(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['usergroups'] }); addToast({ title: 'Group created', variant: 'success' }); setShowForm(false); setForm({ name: '', description: '' }) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const updateMutation = useMutation({
    mutationFn: (d: any) => api.updateGroup(editId!, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['usergroups'] }); addToast({ title: 'Group updated', variant: 'success' }); setEditId(null); setShowForm(false) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteGroup(deleteId!),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['usergroups'] }); addToast({ title: 'Group deleted', variant: 'success' }); setDeleteId(null) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const addMemberMutation = useMutation({
    mutationFn: () => api.addGroupMember(showMembers!, addMemberUserId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['usergroups'] }); setAddMemberUserId(''); addToast({ title: 'Member added', variant: 'success' }) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => api.removeGroupMember(showMembers!, userId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['usergroups'] }); addToast({ title: 'Member removed', variant: 'success' }) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const groups = groupsData?.data || []
  const users = usersData?.data || []
  const selectedGroup = groups.find((g: any) => g.id === showMembers)

  const availableUsers = users.filter((u: any) => !selectedGroup?.members?.some((m: any) => m.userId === u.id))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">User Groups</h2>
        <Button onClick={() => { setShowForm(true); setEditId(null); setForm({ name: '', description: '' }) }}>
          <Plus size={16} className="mr-2" /> New Group
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">All Groups</CardTitle></CardHeader>
          <CardContent className="p-0">
            <DataTable
              columns={[
                { key: 'name', label: 'Name', render: (v: any) => <span className="font-medium">{v}</span> },
                { key: 'description', label: 'Description', render: (v: any) => <span className="text-muted-foreground">{v || '—'}</span> },
                { key: 'members', label: 'Members', render: (v: any) => (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-semibold">
                    <Users size={11} /> {v?.length || 0}
                  </span>
                )},
              ]}
              data={groups}
              loading={!groupsData}
              emptyMessage="No groups defined"
              pageSize={10}
              actions={(g: any) => (
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowMembers(g.id)} title="Manage members">
                    <Users size={14} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditId(g.id); setForm({ name: g.name, description: g.description || '' }); setShowForm(true) }} title="Edit">
                    <Pencil size={14} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteId(g.id)} title="Delete">
                    <Trash2 size={14} className="text-destructive" />
                  </Button>
                </div>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">{selectedGroup ? `Members: ${selectedGroup.name}` : 'Group Members'}</CardTitle></CardHeader>
          <CardContent>
            {!selectedGroup ? (
              <p className="text-sm text-muted-foreground">Click the members icon on a group</p>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <select value={addMemberUserId} onChange={e => setAddMemberUserId(e.target.value)} className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">Select user...</option>
                    {availableUsers.map((u: any) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</option>)}
                  </select>
                  <Button size="sm" onClick={() => addMemberMutation.mutate()} disabled={!addMemberUserId}>Add</Button>
                </div>
                <div className="space-y-1">
                  {selectedGroup.members?.map((m: any) => {
                    const user = users.find((u: any) => u.id === m.userId)
                    return (
                      <div key={m.userId} className="flex items-center justify-between px-3 py-2 rounded bg-muted/30">
                        <span className="text-sm">{user?.firstName} {user?.lastName} <span className="text-muted-foreground">({user?.email})</span></span>
                        <Button variant="ghost" size="icon" onClick={() => removeMemberMutation.mutate(m.userId)}>
                          <Trash2 size={12} className="text-destructive" />
                        </Button>
                      </div>
                    )
                  })}
                  {(!selectedGroup.members || selectedGroup.members.length === 0) && (
                    <p className="text-sm text-muted-foreground">No members yet</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showForm} onOpenChange={(o) => { if (!o) setEditId(null); setShowForm(o) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit Group' : 'New Group'}</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); if (editId) updateMutation.mutate(form); else createMutation.mutate(form) }} className="space-y-3">
            <Input placeholder="Group Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            <Input placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit">{editId ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Group"
        description="Are you sure you want to delete this group?"
        confirmLabel="Delete"
      />
    </div>
  )
}

function CurrenciesSettings() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', code: '', symbol: '', rate: '1', isDefault: false })

  const { data } = useQuery({
    queryKey: ['currencies'],
    queryFn: () => api.listAll('currencies').catch(() => ({ data: [] })),
  })

  const createMutation = useMutation({
    mutationFn: (d: any) => api.create('currencies', d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['currencies'] }); addToast({ title: 'Currency created', variant: 'success' }); setShowForm(false) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const updateMutation = useMutation({
    mutationFn: (d: any) => api.update('currencies', editId!, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['currencies'] }); addToast({ title: 'Currency updated', variant: 'success' }); setEditId(null); setShowForm(false) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete('currencies', deleteId!),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['currencies'] }); addToast({ title: 'Currency deleted', variant: 'success' }); setDeleteId(null) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Currencies</h2>
        <Button onClick={() => { setShowForm(true); setEditId(null); setForm({ name: '', code: '', symbol: '', rate: '1', isDefault: false }) }}>
          <Plus size={16} className="mr-2" /> New Currency
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={[
              { key: 'name', label: 'Name', render: (v: any) => <span className="font-medium">{v}</span> },
              { key: 'code', label: 'Code', render: (v: any) => <span className="inline-flex rounded-md border bg-muted/50 px-2 py-0.5 text-xs font-mono">{v}</span> },
              { key: 'symbol', label: 'Symbol', render: (v: any) => <span className="text-base">{v}</span> },
              { key: 'rate', label: 'Rate', className: 'text-right', render: (v: any) => <span className="tabular-nums">{Number(v).toFixed(4)}</span> },
              { key: 'isDefault', label: 'Default', render: (v: any) => v ? <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 px-2 py-0.5 text-xs font-medium">Default</span> : '—' },
            ]}
            data={data?.data || []}
            loading={!data}
            emptyMessage="No currencies configured"
            pageSize={10}
            actions={(c: any) => (
              <div className="flex items-center justify-end gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditId(c.id); setForm({ name: c.name, code: c.code, symbol: c.symbol, rate: String(c.rate), isDefault: c.isDefault }); setShowForm(true) }} title="Edit">
                  <Pencil size={14} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteId(c.id)} title="Delete">
                  <Trash2 size={14} className="text-destructive" />
                </Button>
              </div>
            )}
          />
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={(o) => { if (!o) setEditId(null); setShowForm(o) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit Currency' : 'New Currency'}</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); const d = { ...form, rate: parseFloat(form.rate) }; if (editId) updateMutation.mutate(d); else createMutation.mutate(d) }} className="space-y-3">
            <Input placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            <Input placeholder="Code (e.g. USD)" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} required />
            <Input placeholder="Symbol (e.g. $)" value={form.symbol} onChange={e => setForm(f => ({ ...f, symbol: e.target.value }))} required />
            <Input type="number" step="0.0001" placeholder="Rate" value={form.rate} onChange={e => setForm(f => ({ ...f, rate: e.target.value }))} required />
            <div className="flex items-center gap-2">
              <input type="checkbox" id="curIsDefault" checked={form.isDefault} onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))} />
              <label htmlFor="curIsDefault" className="text-sm">Set as default currency</label>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit">{editId ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Currency"
        description="Are you sure you want to delete this currency?"
        confirmLabel="Delete"
      />
    </div>
  )
}

function TaxSettings() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({ taxName: '', taxRate: '' })

  const { data } = useQuery({
    queryKey: ['taxinfo'],
    queryFn: () => api.listAll('taxinfo').catch(() => ({ data: [] })),
  })

  const createMutation = useMutation({
    mutationFn: (d: any) => api.create('taxinfo', d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['taxinfo'] }); addToast({ title: 'Tax created', variant: 'success' }); setShowForm(false); setForm({ taxName: '', taxRate: '' }) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const updateMutation = useMutation({
    mutationFn: (d: any) => api.update('taxinfo', editId!, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['taxinfo'] }); addToast({ title: 'Tax updated', variant: 'success' }); setEditId(null); setShowForm(false) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete('taxinfo', deleteId!),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['taxinfo'] }); addToast({ title: 'Tax deleted', variant: 'success' }); setDeleteId(null) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Tax Rates</h2>
        <Button onClick={() => { setShowForm(true); setEditId(null); setForm({ taxName: '', taxRate: '' }) }}>
          <Plus size={16} className="mr-2" /> New Tax
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={[
              { key: 'taxName', label: 'Tax Name', render: (v: any) => <span className="font-medium">{v}</span> },
              { key: 'taxRate', label: 'Rate (%)', render: (v: any) => (
                <span className="inline-flex items-center gap-1">
                  <span className="font-semibold tabular-nums">{Number(v).toFixed(2)}%</span>
                </span>
              )},
            ]}
            data={data?.data || []}
            loading={!data}
            emptyMessage="No tax rates configured"
            pageSize={10}
            actions={(t: any) => (
              <div className="flex items-center justify-end gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditId(t.id); setForm({ taxName: t.taxName, taxRate: String(t.taxRate) }); setShowForm(true) }} title="Edit">
                  <Pencil size={14} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteId(t.id)} title="Delete">
                  <Trash2 size={14} className="text-destructive" />
                </Button>
              </div>
            )}
          />
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={(o) => { if (!o) setEditId(null); setShowForm(o) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit Tax' : 'New Tax'}</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); const d = { taxName: form.taxName, taxRate: parseFloat(form.taxRate) }; if (editId) updateMutation.mutate(d); else createMutation.mutate(d) }} className="space-y-3">
            <Input placeholder="Tax Name (e.g. VAT)" value={form.taxName} onChange={e => setForm(f => ({ ...f, taxName: e.target.value }))} required />
            <Input type="number" step="0.01" placeholder="Tax Rate %" value={form.taxRate} onChange={e => setForm(f => ({ ...f, taxRate: e.target.value }))} required />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit">{editId ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Tax"
        description="Are you sure you want to delete this tax rate?"
        confirmLabel="Delete"
      />
    </div>
  )
}

function CompanySettings() {
  const { addToast } = useToast()
  const [form, setForm] = useState<any>({})
  const [loaded, setLoaded] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState('general')

  const { data, refetch } = useQuery({
    queryKey: ['company'],
    queryFn: () => {
      const token = localStorage.getItem('token')
      return fetch('/api/company', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
    },
  })

  const { data: currencies } = useQuery({
    queryKey: ['currencies'],
    queryFn: () => api.list('currencies', { limit: '200' }),
  })

  if (data && !loaded) {
    setForm(data)
    setLoaded(true)
  }

  const saveCompany = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      })
      if (!res.ok) throw new Error('Failed')
      addToast({ title: 'Company settings updated', variant: 'success' })
      refetch()
    } catch (err: any) {
      addToast({ title: 'Error', description: err.message, variant: 'destructive' })
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await api.uploadLogo(file)
      setForm((prev: any) => ({ ...prev, logo: res.path }))
      addToast({ title: 'Logo uploaded', variant: 'success' })
    } catch (err: any) {
      addToast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }

  const currencyList = (currencies?.data || []).map((c: any) => ({
    value: c.code,
    label: `${c.symbol} ${c.code} — ${c.name}`
  }))

  const sel = (field: string) => ({
    value: form[field] || '_none_',
    onValueChange: (v: string) => setForm((prev: any) => ({ ...prev, [field]: v === '_none_' ? '' : v }))
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Company Settings</h2>
        <Button onClick={saveCompany}>
          <Save size={16} className="mr-2" /> Save
        </Button>
      </div>

      <div className="p-5 rounded-xl border bg-card flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="relative group shrink-0">
          <div className="w-20 h-20 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden bg-muted/20">
            {form.logo ? (
              <img src={form.logo} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <Building2 size={28} className="text-muted-foreground/40" />
            )}
          </div>
          <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-xl cursor-pointer transition-opacity">
            <span className="text-white text-xs font-medium">{uploading ? 'Uploading...' : 'Change'}</span>
            <Input type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploading} className="hidden" />
          </label>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg">{form.name || 'Your Company'}</h3>
          <p className="text-sm text-muted-foreground">{form.email || 'No email set'}{form.phone ? ` · ${form.phone}` : ''}</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <TabsRoot value={activeTab} onValueChange={setActiveTab}>
            <div className="px-6 pt-4 border-b overflow-x-auto">
              <TabsList className="border-b-0">
                <TabsTrigger value="general" className="gap-2"><Building2 size={15} /> General</TabsTrigger>
                <TabsTrigger value="address" className="gap-2"><MapPin size={15} /> Address</TabsTrigger>
                <TabsTrigger value="regional" className="gap-2"><Globe size={15} /> Regional</TabsTrigger>
                <TabsTrigger value="social" className="gap-2"><Globe size={15} /> Social</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="general" className="px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <div><label className="text-sm font-medium block mb-1.5">Company Name</label><Input value={form.name ?? ''} onChange={e => setForm((p: any) => ({ ...p, name: e.target.value }))} /></div>
                <div><label className="text-sm font-medium block mb-1.5">Email</label><Input type="email" value={form.email ?? ''} onChange={e => setForm((p: any) => ({ ...p, email: e.target.value }))} /></div>
                <div><label className="text-sm font-medium block mb-1.5">Phone</label><Input type="tel" value={form.phone ?? ''} onChange={e => setForm((p: any) => ({ ...p, phone: e.target.value }))} /></div>
                <div><label className="text-sm font-medium block mb-1.5">Website</label><Input type="url" placeholder="https://" value={form.website ?? ''} onChange={e => setForm((p: any) => ({ ...p, website: e.target.value }))} /></div>
                <div><label className="text-sm font-medium block mb-1.5">Tax ID</label><Input value={form.taxId ?? ''} onChange={e => setForm((p: any) => ({ ...p, taxId: e.target.value }))} /></div>
              </div>
            </TabsContent>

            <TabsContent value="address" className="px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <div className="md:col-span-2"><label className="text-sm font-medium block mb-1.5">Street</label><Input value={form.addressStreet ?? ''} onChange={e => setForm((p: any) => ({ ...p, addressStreet: e.target.value }))} /></div>
                <div><label className="text-sm font-medium block mb-1.5">City</label><Input value={form.addressCity ?? ''} onChange={e => setForm((p: any) => ({ ...p, addressCity: e.target.value }))} /></div>
                <div><label className="text-sm font-medium block mb-1.5">State / Province</label><Input value={form.addressState ?? ''} onChange={e => setForm((p: any) => ({ ...p, addressState: e.target.value }))} /></div>
                <div><label className="text-sm font-medium block mb-1.5">Country</label>
                  <Select {...sel('addressCountry')}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select country" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none_">--None--</SelectItem>
                      {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><label className="text-sm font-medium block mb-1.5">Postal Code</label><Input value={form.addressPostalCode ?? ''} onChange={e => setForm((p: any) => ({ ...p, addressPostalCode: e.target.value }))} /></div>
              </div>
            </TabsContent>

            <TabsContent value="regional" className="px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <div><label className="text-sm font-medium block mb-1.5">Default Currency</label>
                  <Select {...sel('defaultCurrency')}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select currency" /></SelectTrigger>
                    <SelectContent>
                      {currencyList.length === 0 && <SelectItem value="_none_">--None--</SelectItem>}
                      {currencyList.map((c: any) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><label className="text-sm font-medium block mb-1.5">Timezone</label>
                  <Select {...sel('timezone')}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select timezone" /></SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><label className="text-sm font-medium block mb-1.5">Date Format</label>
                  <Select {...sel('dateFormat')}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select format" /></SelectTrigger>
                    <SelectContent>
                      {DATE_FORMATS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="social" className="px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                {SOCIAL_FIELDS.map(s => (
                  <div key={s.field}>
                    <label className="text-sm font-medium block mb-1.5">{s.label}</label>
                    <Input placeholder={s.placeholder} value={form[s.field] ?? ''} onChange={e => setForm((p: any) => ({ ...p, [s.field]: e.target.value }))} />
                  </div>
                ))}
              </div>
            </TabsContent>
          </TabsRoot>
        </CardContent>
      </Card>
    </div>
  )
}
