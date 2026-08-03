import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '@/lib/auth'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ArrowLeft, Save, Loader2, Mail, Phone, MapPin, Shield, KeyRound, Camera, Smartphone, Unlink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { TIMEZONES, LANGUAGES, COUNTRIES } from '@/lib/constants'

const DATE_FORMATS = ['MM/dd/yyyy', 'dd-MM-yyyy', 'yyyy-MM-dd']
const HOUR_FORMATS = ['12h', '24h']
const WEEK_STARTS = ['Sunday', 'Monday']
const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD']

const sectionMeta = {
  personal: { label: 'Personal', icon: Shield, fields: [
    { label: 'First Name', field: 'firstName', type: 'text' },
    { label: 'Last Name', field: 'lastName', type: 'text' },
    { label: 'Title', field: 'title', type: 'text' },
    { label: 'Department', field: 'department', type: 'text' },
  ]},
  contact: { label: 'Contact', icon: Mail, fields: [
    { label: 'Email', field: 'email', type: 'email' },
    { label: 'Phone', field: 'phone', type: 'text' },
    { label: 'Mobile', field: 'mobile', type: 'text' },
  ]},
  address: { label: 'Address', icon: MapPin, fields: [
    { label: 'Street', field: 'addressStreet', type: 'text' },
    { label: 'City', field: 'addressCity', type: 'text' },
    { label: 'State', field: 'addressState', type: 'text' },
    { label: 'Country', field: 'addressCountry', type: 'select', options: COUNTRIES },
    { label: 'Postal Code', field: 'addressPostalCode', type: 'text' },
  ]},
  preferences: { label: 'Preferences', icon: KeyRound, fields: [
    { label: 'Timezone', field: 'timezone', type: 'select', options: TIMEZONES },
    { label: 'Language', field: 'language', type: 'select', options: LANGUAGES },
    { label: 'Date Format', field: 'dateFormat', type: 'select', options: DATE_FORMATS },
    { label: 'Hour Format', field: 'hourFormat', type: 'select', options: HOUR_FORMATS },
    { label: 'Start of Week', field: 'startOfWeek', type: 'select', options: WEEK_STARTS },
    { label: 'Default Module', field: 'defaultModule', type: 'text' },
    { label: 'Currency', field: 'currencyCode', type: 'select', options: CURRENCIES },
  ]},
  security: { label: 'Security', icon: Shield, fields: [
    { label: 'New Password', field: 'password', type: 'password' },
  ]},
}

export function ProfilePage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [activeTab, setActiveTab] = useState('personal')
  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', mobile: '', title: '', department: '',
    addressStreet: '', addressCity: '', addressState: '', addressCountry: '', addressPostalCode: '',
    timezone: '', language: '', dateFormat: '', hourFormat: '', startOfWeek: '', defaultModule: '', currencyCode: '',
    password: '', avatar: ''
  })

  const [pwd, setPwd] = useState({ current: '', next: '' })
  const [pwdBusy, setPwdBusy] = useState(false)
  const [twoFa, setTwoFa] = useState({ loading: false, enabled: false, secret: '', otpauthUri: '', setupOpen: false, code: '', disableCode: '' })

  useEffect(() => {
    if (user) {
      setForm((prev: any) => ({ ...prev, ...user }))
      setTwoFa(t => ({ ...t, enabled: !!user.twoFactorEnabled }))
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const { password: _, ...body } = form
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to update profile')
      }
      const updated = await res.json()
      useAuthStore.setState({ user: updated })
      addToast({ title: 'Profile updated', variant: 'success' })
    } catch (err: any) {
      addToast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwdBusy(true)
    try {
      await api.changePassword(pwd.current, pwd.next)
      setPwd({ current: '', next: '' })
      addToast({ title: 'Password changed', variant: 'success' })
    } catch (err: any) {
      addToast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setPwdBusy(false)
    }
  }

  const open2faSetup = async () => {
    setTwoFa(t => ({ ...t, loading: true }))
    try {
      const res = await api.get2faSetup()
      setTwoFa(t => ({ ...t, enabled: !!res.enabled, secret: res.secret || '', otpauthUri: res.otpauthUri || '', setupOpen: true }))
    } catch (err: any) {
      addToast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setTwoFa(t => ({ ...t, loading: false }))
    }
  }

  const confirmEnable2fa = async () => {
    try {
      await api.enable2fa(twoFa.code)
      setTwoFa(t => ({ ...t, enabled: true, setupOpen: false, code: '' }))
      useAuthStore.setState({ user: { ...user, twoFactorEnabled: true } })
      addToast({ title: '2FA enabled', variant: 'success' })
    } catch (err: any) {
      addToast({ title: 'Error', description: err.message, variant: 'destructive' })
    }
  }

  const confirmDisable2fa = async () => {
    try {
      await api.disable2fa({ password: twoFa.disableCode })
      setTwoFa(t => ({ ...t, enabled: false, disableCode: '' }))
      useAuthStore.setState({ user: { ...user, twoFactorEnabled: false } })
      addToast({ title: '2FA disabled', variant: 'success' })
    } catch (err: any) {
      addToast({ title: 'Error', description: err.message, variant: 'destructive' })
    }
  }

  const handleChange = (field: string, value: string) => setForm((f: any) => ({ ...f, [field]: value }))

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    try {
      const res = await api.uploadFile(file)
      setForm((f: any) => ({ ...f, avatar: res.path }))
      addToast({ title: 'Avatar uploaded', variant: 'success' })
    } catch (err: any) {
      addToast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setUploadingAvatar(false)
    }
  }

  const initials = user
    ? ((user.firstName?.[0] || '') + (user.lastName?.[0] || '')).toUpperCase() || user.email?.[0]?.toUpperCase() || '?'
    : '?'

  return (
    <div className="space-y-6 w-full max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
      </div>

      <div className="p-5 rounded-xl border bg-card flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="relative group shrink-0">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold overflow-hidden ring-2 ring-border">
            {form.avatar ? (
              <img src={form.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploadingAvatar}
            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity"
          >
            {uploadingAvatar ? <Loader2 size={16} className="animate-spin text-white" /> : <Camera size={16} className="text-white" />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold">{user?.firstName} {user?.lastName}</h2>
          <p className="text-sm text-muted-foreground">{user?.title || 'No title'} &middot; {user?.department || 'No department'}</p>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Mail size={12} />{user?.email}</span>
            {user?.role?.name && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Shield size={12} />{user.role.name}</span>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="p-0">
            <TabsRoot value={activeTab} onValueChange={setActiveTab}>
              <div className="px-6 pt-4 border-b overflow-x-auto">
                <TabsList className="border-b-0">
                  {Object.entries(sectionMeta).map(([key, sec]) => (
                    <TabsTrigger key={key} value={key} className="gap-2">
                      <sec.icon size={15} /> {sec.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              {Object.entries(sectionMeta).map(([key, sec]) => (
                <TabsContent key={key} value={key} className="px-6 pb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                    {sec.fields.map((f: any) => (
                      <div key={f.field}>
                        <label className="text-sm font-medium block mb-1.5">{f.label}</label>
                        {f.type === 'select' ? (
                          <Select
                            value={form[f.field as keyof typeof form] || '_none_'}
                            onValueChange={v => handleChange(f.field, v === '_none_' ? '' : v)}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder={`Select ${f.label.toLowerCase()}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {(f.options as string[]).map((o: string) => (
                                <SelectItem key={o} value={o}>{o}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            type={f.type}
                            value={form[f.field as keyof typeof form] ?? ''}
                            onChange={e => handleChange(f.field, e.target.value)}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </TabsRoot>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2 mt-4">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}
            Save Changes
          </Button>
        </div>
      </form>

      <div className="space-y-4">
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <KeyRound size={18} className="text-primary" />
              <h3 className="text-base font-semibold">Change Password</h3>
            </div>
            <form onSubmit={handleChangePassword} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1.5">Current Password</label>
                <Input type="password" value={pwd.current} onChange={e => setPwd(p => ({ ...p, current: e.target.value }))} className="rounded-lg" required />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">New Password</label>
                <Input type="password" value={pwd.next} onChange={e => setPwd(p => ({ ...p, next: e.target.value }))} className="rounded-lg" required />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <Button type="submit" disabled={pwdBusy}>
                  {pwdBusy ? <Loader2 size={16} className="mr-2 animate-spin" /> : <KeyRound size={16} className="mr-2" />}
                  Update Password
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Smartphone size={18} className="text-primary" />
                <h3 className="text-base font-semibold">Two-Factor Authentication</h3>
              </div>
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${twoFa.enabled ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                {twoFa.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>

            {twoFa.setupOpen && (
              <div className="space-y-3 p-4 rounded-lg border bg-muted/40">
                <p className="text-sm">Scan this URI with your authenticator app (or enter the secret manually):</p>
                <code className="block text-xs break-all bg-background border rounded p-2">{twoFa.otpauthUri}</code>
                <p className="text-xs text-muted-foreground">Secret: <code className="font-mono">{twoFa.secret}</code></p>
                <div className="flex flex-wrap items-end gap-2">
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-sm font-medium block mb-1.5">Verification Code</label>
                    <Input value={twoFa.code} onChange={e => setTwoFa(t => ({ ...t, code: e.target.value }))} placeholder="6-digit code" className="rounded-lg" />
                  </div>
                  <Button onClick={confirmEnable2fa}>Enable 2FA</Button>
                </div>
              </div>
            )}

            {twoFa.enabled ? (
              <div className="flex flex-wrap items-end gap-2">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium block mb-1.5">Password to disable</label>
                  <Input type="password" value={twoFa.disableCode} onChange={e => setTwoFa(t => ({ ...t, disableCode: e.target.value }))} placeholder="Enter your password" className="rounded-lg" />
                </div>
                <Button variant="destructive" onClick={confirmDisable2fa}>
                  <Unlink size={16} className="mr-2" /> Disable 2FA
                </Button>
              </div>
            ) : (
              <Button variant="outline" onClick={open2faSetup} disabled={twoFa.loading}>
                {twoFa.loading ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Smartphone size={16} className="mr-2" />}
                Set up 2FA
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
