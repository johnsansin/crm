import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Lock, User, Mail, Phone, Building2, FileText, Ticket, Loader2, LogOut, Plus, Send, Eye } from 'lucide-react'

const PORTAL_API = '/api/portal'

interface PortalUser {
  id: string
  name: string
  email: string
  company?: string
}

export function PortalPage() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [token, setToken] = useState<string | null>(localStorage.getItem('portal_token'))
  const [portalUser, setPortalUser] = useState<PortalUser | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)
  const [activeTab, setActiveTab] = useState('tickets')
  const [showTicketForm, setShowTicketForm] = useState(false)
  const [ticketForm, setTicketForm] = useState({ title: '', description: '', priority: 'Normal', category: '' })
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', company: '' })

  const portalHeaders = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : {}

  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${PORTAL_API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Login failed') }
      return res.json()
    },
    onSuccess: (data) => {
      localStorage.setItem('portal_token', data.data.token)
      setToken(data.data.token)
      setPortalUser(data.data.user)
      setProfileForm({ name: data.data.user.name, phone: '', company: data.data.user.company || '' })
      addToast({ title: 'Welcome', variant: 'success' })
    },
    onError: (e: Error) => addToast({ title: 'Login failed', description: e.message, variant: 'destructive' }),
  })

  useEffect(() => {
    if (token && !portalUser) {
      fetch(`${PORTAL_API}/profile`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(d => { setPortalUser(d.data); setProfileForm({ name: d.data.name, phone: d.data.phone || '', company: d.data.company || '' }) })
        .catch(() => { localStorage.removeItem('portal_token'); setToken(null) })
    }
  }, [token])

  const logout = () => {
    localStorage.removeItem('portal_token')
    setToken(null)
    setPortalUser(null)
  }

  const { data: ticketsData } = useQuery({
    queryKey: ['portal-tickets'],
    queryFn: () => fetch(`${PORTAL_API}/tickets`, { headers: portalHeaders }).then(r => r.json()),
    enabled: !!token,
  })

  const { data: invoicesData } = useQuery({
    queryKey: ['portal-invoices'],
    queryFn: () => fetch(`${PORTAL_API}/invoices`, { headers: portalHeaders }).then(r => r.json()),
    enabled: !!token,
  })

  const { data: documentsData } = useQuery({
    queryKey: ['portal-documents'],
    queryFn: () => fetch(`${PORTAL_API}/documents`, { headers: portalHeaders }).then(r => r.json()),
    enabled: !!token,
  })

  const { data: ticketDetail } = useQuery({
    queryKey: ['portal-ticket', selectedTicketId],
    queryFn: () => fetch(`${PORTAL_API}/tickets/${selectedTicketId}`, { headers: portalHeaders }).then(r => r.json()),
    enabled: !!selectedTicketId,
  })

  const { data: invoiceDetail } = useQuery({
    queryKey: ['portal-invoice', selectedInvoiceId],
    queryFn: () => fetch(`${PORTAL_API}/invoices/${selectedInvoiceId}`, { headers: portalHeaders }).then(r => r.json()),
    enabled: !!selectedInvoiceId,
  })

  const createTicketMutation = useMutation({
    mutationFn: (data: any) => fetch(`${PORTAL_API}/tickets`, { method: 'POST', headers: portalHeaders, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['portal-tickets'] }); setShowTicketForm(false); setTicketForm({ title: '', description: '', priority: 'Normal', category: '' }); addToast({ title: 'Ticket created', variant: 'success' }) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const addCommentMutation = useMutation({
    mutationFn: (comment: string) => fetch(`${PORTAL_API}/tickets/${selectedTicketId}/comments`, { method: 'POST', headers: portalHeaders, body: JSON.stringify({ comment }) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['portal-ticket', selectedTicketId] }); setCommentText(''); addToast({ title: 'Comment added', variant: 'success' }) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => fetch(`${PORTAL_API}/profile`, { method: 'PUT', headers: portalHeaders, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => { addToast({ title: 'Profile updated', variant: 'success' }) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-700 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center mb-3">
              <Lock size={22} className="text-white" />
            </div>
            <CardTitle className="text-xl">Customer Portal</CardTitle>
            <p className="text-sm text-muted-foreground">Sign in to access your account</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={e => { e.preventDefault(); loginMutation.mutate() }} className="space-y-3">
              <div>
                <label className="text-sm font-medium">Email</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="portal@example.com" className="pl-9" required />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" className="pl-9" required />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Lock size={14} className="mr-2" />}
                {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  const tickets = ticketsData?.data || []
  const invoices = invoicesData?.data || []
  const documents = documentsData?.data || []
  const ticket = ticketDetail?.data
  const invoice = invoiceDetail?.data

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">P</div>
          <div>
            <h1 className="text-sm font-bold">Customer Portal</h1>
            <p className="text-xs text-muted-foreground">{portalUser?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setActiveTab('profile')}><User size={14} className="mr-1" /> Profile</Button>
          <Button variant="ghost" size="sm" onClick={logout}><LogOut size={14} className="mr-1" /> Sign Out</Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        <TabsRoot value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="tickets"><Ticket size={14} className="mr-1" /> My Tickets</TabsTrigger>
            <TabsTrigger value="invoices"><FileText size={14} className="mr-1" /> My Invoices</TabsTrigger>
            <TabsTrigger value="documents"><FileText size={14} className="mr-1" /> Documents</TabsTrigger>
            <TabsTrigger value="profile"><User size={14} className="mr-1" /> Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="tickets">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold">My Tickets</h2>
                <Button size="sm" onClick={() => setShowTicketForm(true)}><Plus size={14} className="mr-1" /> New Ticket</Button>
              </div>
              {selectedTicketId && ticket ? (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{ticket.title}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">Status: {ticket.status} | Priority: {ticket.priority}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setSelectedTicketId(null)}>Back to list</Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {ticket.description && <p className="text-sm">{ticket.description}</p>}
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">Comments</h4>
                      {(ticket.ticketComments || []).map((c: any) => (
                        <div key={c.id} className="p-2 rounded bg-muted/50 text-xs">
                          <p>{c.comment}</p>
                          <span className="text-muted-foreground">{new Date(c.createdAt).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Add a comment..." className="h-9" />
                      <Button size="sm" onClick={() => addCommentMutation.mutate(commentText)} disabled={!commentText || addCommentMutation.isPending}>
                        <Send size={12} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    {tickets.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-6 text-center">No tickets yet</p>
                    ) : (
                      <div className="divide-y">
                        {tickets.map((ticket: any) => (
                          <button key={ticket.id} onClick={() => setSelectedTicketId(ticket.id)} className="w-full text-left p-4 hover:bg-muted/30 transition-colors flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">{ticket.title}</p>
                              <p className="text-xs text-muted-foreground">{ticket.status} | {ticket.priority}</p>
                            </div>
                            <Eye size={14} className="text-muted-foreground" />
                          </button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="invoices">
            <div className="space-y-4">
              <h2 className="text-lg font-bold">My Invoices</h2>
              {selectedInvoiceId && invoice ? (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{invoice.subject}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">Status: {invoice.invoiceStatus} | Total: ${Number(invoice.grandTotal || 0).toFixed(2)}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setSelectedInvoiceId(null)}>Back to list</Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {(invoice.lineItems || []).length > 0 && (
                      <table className="w-full text-xs">
                        <thead><tr className="border-b"><th className="text-left py-2">Item</th><th className="text-right py-2">Qty</th><th className="text-right py-2">Price</th><th className="text-right py-2">Total</th></tr></thead>
                        <tbody>
                          {invoice.lineItems.map((li: any) => (
                            <tr key={li.id} className="border-b"><td className="py-2">{li.itemName}</td><td className="text-right">{li.qty}</td><td className="text-right">${Number(li.unitPrice || 0).toFixed(2)}</td><td className="text-right">${Number(li.lineTotal || 0).toFixed(2)}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    {invoices.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-6 text-center">No invoices yet</p>
                    ) : (
                      <div className="divide-y">
                        {invoices.map((inv: any) => (
                          <button key={inv.id} onClick={() => setSelectedInvoiceId(inv.id)} className="w-full text-left p-4 hover:bg-muted/30 transition-colors flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">{inv.subject}</p>
                              <p className="text-xs text-muted-foreground">{inv.invoiceStatus} | ${Number(inv.grandTotal || 0).toFixed(2)}</p>
                            </div>
                            <Eye size={14} className="text-muted-foreground" />
                          </button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader><CardTitle className="text-sm">Shared Documents</CardTitle></CardHeader>
              <CardContent className="p-0">
                {documents.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-6 text-center">No documents shared</p>
                ) : (
                  <div className="divide-y">
                    {documents.map((doc: any) => (
                      <div key={doc.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText size={16} className="text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{doc.title}</p>
                            <p className="text-xs text-muted-foreground">{doc.fileType || 'Document'} | {doc.fileVersion || 'v1'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <Card className="max-w-lg">
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><User size={15} /> My Profile</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={e => { e.preventDefault(); updateProfileMutation.mutate(profileForm) }} className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <Input value={profileForm.name} onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Phone</label>
                    <Input value={profileForm.phone} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Company</label>
                    <Input value={profileForm.company} onChange={e => setProfileForm(p => ({ ...p, company: e.target.value }))} />
                  </div>
                  <Button type="submit" size="sm" disabled={updateProfileMutation.isPending}>
                    {updateProfileMutation.isPending ? <Loader2 className="animate-spin mr-1 h-3 w-3" /> : null}
                    Save Profile
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </TabsRoot>
      </div>

      <Dialog open={showTicketForm} onOpenChange={setShowTicketForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Ticket</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); createTicketMutation.mutate(ticketForm) }} className="space-y-3">
            <Input placeholder="Title" value={ticketForm.title} onChange={e => setTicketForm(f => ({ ...f, title: e.target.value }))} required />
            <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Description" value={ticketForm.description} onChange={e => setTicketForm(f => ({ ...f, description: e.target.value }))} />
            <div className="grid grid-cols-2 gap-2">
              <select value={ticketForm.priority} onChange={e => setTicketForm(f => ({ ...f, priority: e.target.value }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="Low">Low</option>
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
              <Input placeholder="Category" value={ticketForm.category} onChange={e => setTicketForm(f => ({ ...f, category: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowTicketForm(false)}>Cancel</Button>
              <Button type="submit" disabled={createTicketMutation.isPending}>
                {createTicketMutation.isPending ? <Loader2 className="animate-spin mr-1 h-3 w-3" /> : null}
                Create Ticket
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
