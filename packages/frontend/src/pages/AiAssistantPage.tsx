import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sparkles, Send, Loader2, Plus, Trash2, Brain, Lightbulb, BarChart3, History, Save, Mail, Target, AlertTriangle, TrendingUp, Users, MessageSquare, Copy, Check, RotateCcw, ShieldCheck, WandSparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
  meta?: any
}

function ScoreBadge({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' }) {
  const color = score <= 30 ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' :
    score <= 70 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' :
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
  return <span className={cn('inline-flex items-center rounded-full font-bold tabular-nums', color, size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2.5 py-0.5 text-sm')}>{score}</span>
}

function SuggestionsList({ suggestions }: { suggestions: any[] }) {
  if (!suggestions?.length) return null
  const prioIcon: Record<string, string> = { critical: 'text-red-500', high: 'text-orange-500', medium: 'text-blue-500', low: 'text-gray-400' }
  return (
    <div className="space-y-2">
      {suggestions.map((s: any, i: number) => (
        <div key={i} className="flex items-start gap-3 rounded-lg border p-3 bg-card">
          <AlertTriangle size={16} className={cn('mt-0.5 shrink-0', prioIcon[s.priority] || 'text-gray-400')} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{s.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
          </div>
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase">{s.priority}</span>
        </div>
      ))}
    </div>
  )
}

export function AiAssistantPage() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [activeTab, setActiveTab] = useState('chat')
  const [showPromptForm, setShowPromptForm] = useState(false)
  const [promptForm, setPromptForm] = useState({ name: '', prompt: '', module: '' })
  const [selectedModule, setSelectedModule] = useState('')
  const [selectedFieldName, setSelectedFieldName] = useState('')
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [assistantContext, setAssistantContext] = useState('all')
  const [responseStyle, setResponseStyle] = useState('actionable')

  // Global search (Ctrl+K)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearch(v => !v)
      }
      if (e.key === 'Escape') setShowSearch(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const { data: promptsData } = useQuery({
    queryKey: ['ai-prompts'],
    queryFn: () => fetch('/api/ai/prompts', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }).then(r => r.json()).catch(() => ({ data: [] })),
    enabled: activeTab === 'prompts',
  })

  const { data: logsData } = useQuery({
    queryKey: ['ai-logs'],
    queryFn: () => fetch('/api/ai/logs', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }).then(r => r.json()).catch(() => ({ data: [] })),
    enabled: activeTab === 'logs',
  })

  const { data: leadScores, isLoading: scoresLoading } = useQuery({
    queryKey: ['ai-lead-scores'],
    queryFn: () => fetch('/api/ai/lead-score/batch', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` }, body: '{}' }).then(r => r.json()).catch(() => ({ data: [] })),
    enabled: activeTab === 'leads',
  })

  const { data: insights, isLoading: insightsLoading } = useQuery({
    queryKey: ['ai-insights'],
    queryFn: () => fetch('/api/ai/insights', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }).then(r => r.json()).catch(() => ({ data: {} })),
    enabled: activeTab === 'insights',
  })

  const { data: oppPredictions, isLoading: predictionsLoading } = useQuery({
    queryKey: ['ai-opp-predictions'],
    queryFn: async () => {
      const opps = await fetch('/api/potentials?limit=50', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }).then(r => r.json()).catch(() => ({ data: [] }))
      const results = await Promise.all((opps.data || []).filter((o: any) => !['Closed Won', 'Closed Lost'].includes(o.stage)).slice(0, 10).map(async (o: any) => {
        const res = await fetch('/api/ai/opportunity-prediction', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify({ potentialId: o.id }) }).then(r => r.json()).catch(() => null)
        return res?.data ? { ...o, prediction: res.data } : null
      }))
      return results.filter(Boolean)
    },
    enabled: activeTab === 'predictions',
  })

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify({ message }) })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    onSuccess: (data) => {
      setMessages(m => [...m, { role: 'assistant', content: data.data.response, meta: data.data }])
    },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const suggestMutation = useMutation({
    mutationFn: async (params: { module: string; fieldName: string }) => {
      const res = await fetch('/api/ai/suggest', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify(params) })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    onSuccess: (data) => {
      const d = data.data
      setMessages(m => [...m, { role: 'assistant', content: `Suggestions for ${d.fieldName} in ${d.module}:\n${d.suggestions.map((s: string) => `  - ${s}`).join('\n')}\n\n${d.reasoning}`, meta: d }])
    },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const savePromptMutation = useMutation({
    mutationFn: (data: any) => fetch('/api/ai/prompts', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['ai-prompts'] }); setShowPromptForm(false); setPromptForm({ name: '', prompt: '', module: '' }); addToast({ title: 'Prompt saved', variant: 'success' }) },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const handleSend = () => {
    if (!input.trim()) return
    setMessages(m => [...m, { role: 'user', content: input }])
    const context = assistantContext === 'all' ? 'the CRM' : `the ${assistantContext} module`
    chatMutation.mutate(`Context: ${context}. Response style: ${responseStyle}. User request: ${input}`)
    setInput('')
  }

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIdx(idx)
      setTimeout(() => setCopiedIdx(null), 2000)
    })
  }

  const prompts = promptsData?.data || []
  const logs = logsData?.data || []
  const leadScoreList = (leadScores?.data || []).sort((a: any, b: any) => (b.score || 0) - (a.score || 0))
  const insightData = insights?.data || {}
  const modules = ['leads', 'contacts', 'potentials', 'tickets', 'accounts', 'campaigns']
  const fieldNames = ['email', 'title', 'leadSource', 'leadStatus', 'industry', 'priority', 'status', 'category']

  const filteredScores = searchQuery
    ? leadScoreList.filter((s: any) => `${s.firstName} ${s.lastName} ${s.company}`.toLowerCase().includes(searchQuery.toLowerCase()))
    : leadScoreList

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 px-6 py-8 md:px-8 md:py-10 text-white shadow-xl shadow-purple-500/20">
        <div className="absolute inset-0 bg-gradient-to-b from-white/15 via-transparent to-transparent" />
        <div className="absolute -top-20 -right-16 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><Sparkles size={20} /></div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AI Assistant</h1>
            <p className="text-sm text-purple-100/80">Generate content, score leads, predict outcomes, and get AI insights</p>
          </div>
        </div>
      </div>

      <Card className="border-violet-200/70 bg-gradient-to-r from-violet-50/70 to-indigo-50/60 dark:border-violet-900 dark:from-violet-950/25 dark:to-indigo-950/20">
        <CardContent className="p-4">
          <div className="grid gap-4 md:grid-cols-[1fr_auto_auto] md:items-center">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold"><WandSparkles size={16} className="text-violet-600" /> Assistant workspace</p>
              <p className="mt-1 text-xs text-muted-foreground">Choose a data context and response style so answers are focused and easier to act on.</p>
            </div>
            <label className="text-xs font-medium text-muted-foreground">Data context
              <select value={assistantContext} onChange={e => setAssistantContext(e.target.value)} className="mt-1 block h-9 min-w-40 rounded-lg border bg-background px-3 text-sm text-foreground">
                <option value="all">All permitted CRM data</option><option value="leads">Leads</option><option value="potentials">Opportunities</option><option value="tickets">Support tickets</option><option value="accounts">Accounts</option><option value="projects">Projects</option>
              </select>
            </label>
            <label className="text-xs font-medium text-muted-foreground">Answer style
              <select value={responseStyle} onChange={e => setResponseStyle(e.target.value)} className="mt-1 block h-9 min-w-36 rounded-lg border bg-background px-3 text-sm text-foreground">
                <option value="actionable">Action plan</option><option value="concise">Concise</option><option value="analytical">Analytical</option><option value="executive">Executive summary</option>
              </select>
            </label>
          </div>
        </CardContent>
      </Card>

      <TabsRoot value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="chat"><Sparkles size={14} className="mr-1" /> Ask AI</TabsTrigger>
          <TabsTrigger value="leads"><Target size={14} className="mr-1" /> Lead Scores</TabsTrigger>
          <TabsTrigger value="predictions"><TrendingUp size={14} className="mr-1" /> Predictions</TabsTrigger>
          <TabsTrigger value="insights"><BarChart3 size={14} className="mr-1" /> Insights</TabsTrigger>
          <TabsTrigger value="suggest"><Lightbulb size={14} className="mr-1" /> Suggestions</TabsTrigger>
          <TabsTrigger value="prompts"><Save size={14} className="mr-1" /> Saved</TabsTrigger>
          <TabsTrigger value="logs"><History size={14} className="mr-1" /> Logs</TabsTrigger>
        </TabsList>

        {/* Chat Tab */}
        <TabsContent value="chat">
          <Card className="h-[560px] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b px-4 py-2.5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck size={13} className="text-emerald-600" /> Tenant-isolated: uses only your organization’s CRM data</div>
              {messages.length > 0 && <Button variant="ghost" size="sm" onClick={() => setMessages([])} className="h-7 text-xs"><RotateCcw size={12} className="mr-1" /> New conversation</Button>}
            </div>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <Brain size={48} className="mb-3 opacity-30" />
                  <p className="text-sm font-medium">Ask me anything about your CRM data</p>
                  <p className="text-xs mt-1">I can help with lead insights, pipeline analysis, ticket status, and more</p>
                  <div className="mt-4 flex flex-wrap gap-2 justify-center">
                    {['Prioritize my work for today', 'Show at-risk opportunities and next actions', 'Which leads should I contact first?', 'Summarize overdue tickets', 'Find pipeline risks this month'].map(q => (
                      <button key={q} onClick={() => { setInput(q); setMessages(m => [...m, { role: 'user', content: q }]); chatMutation.mutate(q) }} className="rounded-full border bg-muted/50 px-3 py-1 text-xs text-muted-foreground hover:bg-muted transition-colors">{q}</button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={cn('max-w-[70%] rounded-xl px-4 py-2.5 text-sm', msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {msg.meta?.model && <span className="text-xs text-muted-foreground opacity-60">{msg.meta.model}</span>}
                      {msg.role === 'assistant' && (
                        <button onClick={() => copyToClipboard(msg.content, i)} className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                          {copiedIdx === i ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {chatMutation.isPending && (
                <div className="flex justify-start"><div className="bg-muted rounded-xl px-4 py-2.5 flex items-center gap-2 text-sm"><Loader2 className="animate-spin h-3 w-3" /> Thinking...</div></div>
              )}
            </CardContent>
            <div className="border-t p-3">
              <div className="flex gap-2">
                <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()} placeholder={`Ask about ${assistantContext === 'all' ? 'your permitted CRM data' : assistantContext}...`} className="flex-1" disabled={chatMutation.isPending} />
                <Button onClick={handleSend} disabled={!input.trim() || chatMutation.isPending}><Send size={14} /></Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Lead Scores Tab */}
        <TabsContent value="leads">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2"><Target size={15} /> AI Lead Scoring</CardTitle>
                <div className="flex gap-2">
                  <Input placeholder="Search leads..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="h-8 w-48 text-xs" />
                  <Button size="sm" variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['ai-lead-scores'] })} disabled={scoresLoading}>
                    {scoresLoading ? <Loader2 className="animate-spin mr-1 h-3 w-3" /> : <Sparkles size={13} className="mr-1" />} Rescore All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {scoresLoading ? (
                <div className="p-8 text-center text-sm text-muted-foreground"><Loader2 className="animate-spin inline mr-2 h-4 w-4" /> Scoring leads...</div>
              ) : filteredScores.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">No leads to score</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-muted/40">
                        <th className="text-left px-4 py-2">Lead</th>
                        <th className="text-left px-4 py-2">Company</th>
                        <th className="text-center px-4 py-2">Score</th>
                        <th className="text-left px-4 py-2">Rating</th>
                        <th className="text-left px-4 py-2">Top Factors</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredScores.map((s: any) => (
                        <tr key={s.leadId} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="px-4 py-2.5 font-medium">{s.firstName} {s.lastName}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{s.company || '—'}</td>
                          <td className="px-4 py-2.5 text-center"><ScoreBadge score={s.score} /></td>
                          <td className="px-4 py-2.5"><span className={cn('text-xs font-medium', s.color === 'green' ? 'text-emerald-600' : s.color === 'yellow' ? 'text-yellow-600' : 'text-red-600')}>{s.label}</span></td>
                          <td className="px-4 py-2.5 text-muted-foreground max-w-xs truncate">{(s.factors || []).slice(0, 2).map((f: any) => f.name).join(', ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions">
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><TrendingUp size={15} /> Opportunity Predictions</CardTitle></CardHeader>
            <CardContent>
              {predictionsLoading ? (
                <div className="p-8 text-center text-sm text-muted-foreground"><Loader2 className="animate-spin inline mr-2 h-4 w-4" /> Predicting outcomes...</div>
              ) : (oppPredictions || []).length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">No open opportunities to predict</div>
              ) : (
                <div className="space-y-3">
                  {(oppPredictions || []).map((o: any) => (
                    <div key={o.id} className="rounded-lg border p-4 bg-card">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-sm">{o.potentialName}</p>
                          <p className="text-xs text-muted-foreground">{o.stage} {o.amount ? `· $${Number(o.amount).toLocaleString()}` : ''}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold tabular-nums">{o.prediction?.probability || 0}%</p>
                          <p className={cn('text-xs font-medium', (o.prediction?.confidence === 'High' ? 'text-emerald-600' : o.prediction?.confidence === 'Medium' ? 'text-yellow-600' : 'text-red-600'))}>{o.prediction?.confidence || 'Low'} confidence</p>
                        </div>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div className={cn('h-full rounded-full transition-all', o.prediction?.probability >= 70 ? 'bg-emerald-500' : o.prediction?.probability >= 40 ? 'bg-yellow-500' : 'bg-red-500')} style={{ width: `${o.prediction?.probability || 0}%` }} />
                      </div>
                      {o.prediction?.recommendation && <p className="text-xs text-muted-foreground mt-2">{o.prediction.recommendation}</p>}
                      {o.prediction?.factors && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {o.prediction.factors.map((f: any, i: number) => (
                            <span key={i} className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', f.score > 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400')}>{f.name}: {f.score > 0 ? '+' : ''}{f.score}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights">
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><BarChart3 size={15} /> AI Insights</CardTitle></CardHeader>
            <CardContent>
              {insightsLoading ? (
                <div className="p-8 text-center text-sm text-muted-foreground"><Loader2 className="animate-spin inline mr-2 h-4 w-4" /> Loading insights...</div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                      <p className="text-2xl font-bold">{insightData.summary?.totalOpenOpps || 0}</p>
                      <p className="text-[10px] font-medium uppercase text-muted-foreground">Open Opps</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                      <p className="text-2xl font-bold text-red-600">{insightData.summary?.staleLeadCount || 0}</p>
                      <p className="text-[10px] font-medium uppercase text-muted-foreground">Stale Leads</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                      <p className="text-2xl font-bold">{insightData.summary?.openTicketCount || 0}</p>
                      <p className="text-[10px] font-medium uppercase text-muted-foreground">Open Tickets</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                      <p className="text-2xl font-bold text-orange-600">{insightData.summary?.overdueActions || 0}</p>
                      <p className="text-[10px] font-medium uppercase text-muted-foreground">Overdue Actions</p>
                    </div>
                  </div>

                  {insightData.topOpportunities?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Top Opportunities</h4>
                      <div className="space-y-1.5">
                        {insightData.topOpportunities.map((o: any) => (
                          <a key={o.id} href={`/potentials/${o.id}`} className="flex items-center justify-between rounded-lg border p-2.5 hover:bg-muted/30 transition-colors">
                            <span className="text-sm font-medium truncate">{o.name}</span>
                            <span className="text-xs text-muted-foreground">{o.stage} · ${Number(o.amount || 0).toLocaleString()}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {insightData.staleLeads?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">At-Risk Leads (stale)</h4>
                      <div className="space-y-1.5">
                        {insightData.staleLeads.map((l: any) => (
                          <a key={l.id} href={`/leads/${l.id}`} className="flex items-center justify-between rounded-lg border p-2.5 hover:bg-muted/30 transition-colors">
                            <span className="text-sm font-medium truncate">{l.name}</span>
                            <span className="text-xs text-red-600">{l.daysStale} days stale</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {insightData.upcomingActions?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Upcoming Actions</h4>
                      <div className="space-y-1.5">
                        {insightData.upcomingActions.map((a: any, i: number) => (
                          <div key={i} className="flex items-center justify-between rounded-lg border p-2.5">
                            <span className="text-sm font-medium truncate">{a.subject}</span>
                            <span className="text-xs text-muted-foreground">{a.dueAt ? new Date(a.dueAt).toLocaleDateString() : '—'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Suggestions Tab */}
        <TabsContent value="suggest">
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Lightbulb size={15} /> AI Field Suggestions</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Get AI-powered suggestions for CRM field values based on module context.</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Module</label>
                  <select value={selectedModule} onChange={e => setSelectedModule(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                    <option value="">Select module</option>
                    {modules.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Field Name</label>
                  <select value={selectedFieldName} onChange={e => setSelectedFieldName(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                    <option value="">Select field</option>
                    {fieldNames.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>
              <Button onClick={() => { if (selectedModule && selectedFieldName) { setMessages(m => [...m, { role: 'user', content: `Suggest values for ${selectedFieldName} in ${selectedModule}` }]); setActiveTab('chat'); suggestMutation.mutate({ module: selectedModule, fieldName: selectedFieldName }) } }} disabled={!selectedModule || !selectedFieldName || suggestMutation.isPending}>
                {suggestMutation.isPending ? <Loader2 className="animate-spin mr-1 h-3 w-3" /> : <Lightbulb size={14} className="mr-1" />}
                Get Suggestions
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Saved Prompts Tab */}
        <TabsContent value="prompts">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm flex items-center gap-2"><Save size={15} /> Saved Prompts</CardTitle>
                <Button size="sm" onClick={() => setShowPromptForm(true)}><Plus size={14} className="mr-1" /> Save Prompt</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {prompts.length === 0 ? (
                <p className="text-sm text-muted-foreground p-6 text-center">No saved prompts yet</p>
              ) : (
                <div className="divide-y">
                  {prompts.map((p: any) => (
                    <button key={p.id} onClick={() => { setInput(p.prompt); setActiveTab('chat') }} className="w-full text-left p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{p.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-md">{p.prompt}</p>
                        </div>
                        {p.module && <span className="text-xs bg-muted px-2 py-0.5 rounded">{p.module}</span>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs">
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><History size={15} /> AI Usage Logs</CardTitle></CardHeader>
            <CardContent className="p-0">
              {logs.length === 0 ? (
                <p className="text-sm text-muted-foreground p-6 text-center">No AI usage logs yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-muted/40">
                        <th className="text-left px-4 py-2">Time</th>
                        <th className="text-left px-4 py-2">Module</th>
                        <th className="text-left px-4 py-2">Model</th>
                        <th className="text-right px-4 py-2">Tokens</th>
                        <th className="text-right px-4 py-2">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log: any) => (
                        <tr key={log.id} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="px-4 py-2">{new Date(log.createdAt).toLocaleString()}</td>
                          <td className="px-4 py-2">{log.moduleName || '—'}</td>
                          <td className="px-4 py-2 font-mono">{log.model || '—'}</td>
                          <td className="text-right px-4 py-2">{log.tokens || 0}</td>
                          <td className="text-right px-4 py-2">{log.duration || 0}ms</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </TabsRoot>

      {/* Save Prompt Dialog */}
      <Dialog open={showPromptForm} onOpenChange={setShowPromptForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Save Prompt</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); savePromptMutation.mutate(promptForm) }} className="space-y-3">
            <Input placeholder="Prompt name" value={promptForm.name} onChange={e => setPromptForm(f => ({ ...f, name: e.target.value }))} required />
            <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Prompt text" value={promptForm.prompt} onChange={e => setPromptForm(f => ({ ...f, prompt: e.target.value }))} required />
            <Input placeholder="Module (optional)" value={promptForm.module} onChange={e => setPromptForm(f => ({ ...f, module: e.target.value }))} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowPromptForm(false)}>Cancel</Button>
              <Button type="submit" disabled={savePromptMutation.isPending}>
                {savePromptMutation.isPending ? <Loader2 className="animate-spin mr-1 h-3 w-3" /> : <Save size={12} className="mr-1" />}
                Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Global Search Dialog */}
      <Dialog open={showSearch} onOpenChange={setShowSearch}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Global Search</DialogTitle></DialogHeader>
          <Input placeholder="Search across all modules..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} autoFocus />
          <p className="text-xs text-muted-foreground">Tip: Use Ctrl+K to open search anywhere in the app</p>
        </DialogContent>
      </Dialog>
    </div>
  )
}
