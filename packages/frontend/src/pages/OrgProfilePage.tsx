import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useToast } from '@/lib/toast'
import { Building2, Loader2, CheckCircle } from 'lucide-react'

export function OrgProfilePage() {
  const navigate = useNavigate()
  const { user, loadUser } = useAuthStore()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    addressStreet: '',
    addressCity: '',
    addressState: '',
    addressCountry: '',
    addressPostalCode: '',
    taxId: '',
  })

  useEffect(() => {
    api.getCompany().then(company => {
      if (company) {
        setForm({
          name: company.name || '',
          email: company.email || '',
          phone: company.phone || '',
          website: company.website || '',
          addressStreet: company.addressStreet || '',
          addressCity: company.addressCity || '',
          addressState: company.addressState || '',
          addressCountry: company.addressCountry || '',
          addressPostalCode: company.addressPostalCode || '',
          taxId: company.taxId || '',
        })
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name) return
    setSaving(true)
    try {
      await api.updateCompany(form)
      await loadUser()
      addToast({ title: 'Saved', description: 'Organization profile updated', variant: 'success' })
      setCompleted(true)
      setTimeout(() => navigate('/dashboard'), 1500)
    } catch (err: any) {
      addToast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">All set!</h2>
          <p className="text-muted-foreground">Your organization profile is complete. Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">B</span>
            </div>
            <span className="font-bold text-xl">BizForce</span>
          </div>
          <p className="text-sm text-muted-foreground">Welcome, {user?.firstName}! Let's set up your organization.</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 size={20} className="text-primary" />
              </div>
              <div>
                <CardTitle>Organization Profile</CardTitle>
                <CardDescription>Complete your company details to get started</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Organization Name *</label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className="rounded-lg" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="rounded-lg" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone</label>
                  <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="rounded-lg" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Website</label>
                <Input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://example.com" className="rounded-lg" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Street Address</label>
                <Input value={form.addressStreet} onChange={e => setForm(f => ({ ...f, addressStreet: e.target.value }))} className="rounded-lg" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">City</label>
                  <Input value={form.addressCity} onChange={e => setForm(f => ({ ...f, addressCity: e.target.value }))} className="rounded-lg" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">State</label>
                  <Input value={form.addressState} onChange={e => setForm(f => ({ ...f, addressState: e.target.value }))} className="rounded-lg" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Country</label>
                  <Input value={form.addressCountry} onChange={e => setForm(f => ({ ...f, addressCountry: e.target.value }))} className="rounded-lg" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Postal Code</label>
                  <Input value={form.addressPostalCode} onChange={e => setForm(f => ({ ...f, addressPostalCode: e.target.value }))} className="rounded-lg" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tax ID / VAT Number</label>
                <Input value={form.taxId} onChange={e => setForm(f => ({ ...f, taxId: e.target.value }))} className="rounded-lg" />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => navigate('/dashboard')}>
                  Skip for now
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
                  Save & Continue
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
