import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { LineChart, TrendingUp, DollarSign, RefreshCw, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/org-format'

function money(v: any) {
  return `$${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function ForecastPage() {
  const [range, setRange] = useState('quarter')
  const { addToast } = useToast()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['forecast', range],
    queryFn: () => api.getForecast(range),
  })

  const recalcMutation = useMutation({
    mutationFn: () => api.recalculateForecast(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forecast'] })
      addToast({ title: 'Forecast recalculated', description: 'Opportunity amounts weighted by probability', variant: 'success' })
    },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const forecast = data?.data?.forecast || []
  const pipeline = data?.data?.pipeline || { won: { count: 0, amount: 0 }, lost: { count: 0, amount: 0 }, pipeline: { count: 0, amount: 0 } }
  const recent = data?.data?.recent || []
  const totals = data?.data?.totals || { expected: 0, weighted: 0 }
  const maxVal = Math.max(...forecast.map((f: any) => f.expected), 1)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><LineChart className="text-primary" /> Opportunity Forecasting</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Expected revenue by close period, weighted by probability (forecast).</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="quarter">Next 4 months</SelectItem>
              <SelectItem value="year">Next 12 months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => recalcMutation.mutate()} disabled={recalcMutation.isPending}>
            {recalcMutation.isPending ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <RefreshCw size={14} className="mr-1.5" />}
            Recalculate
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground flex items-center gap-1.5"><DollarSign size={14} /> Expected Revenue</p>
            <p className="text-2xl font-bold mt-1">{money(totals.expected)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground flex items-center gap-1.5"><TrendingUp size={14} /> Weighted Forecast</p>
            <p className="text-2xl font-bold mt-1">{money(totals.weighted)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Open Pipeline Opportunities</p>
            <p className="text-2xl font-bold mt-1">{pipeline.pipeline.count}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Forecast by Period</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="flex items-end gap-4 h-48">
              {forecast.map((f: any) => (
                <div key={f.period} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                  <div className="w-full flex items-end justify-center gap-1 h-36">
                    <div className="w-1/2 rounded-t bg-primary/80" title={`Expected ${money(f.expected)}`} style={{ height: `${Math.max((f.expected / maxVal) * 100, 2)}%` }} />
                    <div className="w-1/2 rounded-t bg-primary/30" title={`Weighted ${money(f.weighted)}`} style={{ height: `${Math.max((f.weighted / maxVal) * 100, 2)}%` }} />
                  </div>
                  <span className="text-xs font-medium">{f.period}</span>
                  <span className="text-[11px] text-muted-foreground">{money(f.expected)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Pipeline by Stage Category</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Closed Won', color: 'bg-emerald-500', value: pipeline.won },
              { label: 'Pipeline (In Progress)', color: 'bg-sky-500', value: pipeline.pipeline },
              { label: 'Closed Lost', color: 'bg-rose-500', value: pipeline.lost },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-3">
                <span className={`h-2.5 w-2.5 rounded-full ${row.color}`} />
                <span className="text-sm flex-1">{row.label}</span>
                <span className="text-sm text-muted-foreground">{row.value.count} opportunities</span>
                <span className="text-sm font-medium">{money(row.value.amount)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Recent Opportunities</CardTitle></CardHeader>
          <CardContent className="space-y-2 max-h-72 overflow-y-auto">
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No opportunities yet. Create opportunities with amounts and closing dates to forecast.</p>
            ) : (
              recent.slice(0, 15).map((p: any) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{p.potentialName}</p>
                    <p className="text-xs text-muted-foreground">{p.stage || '—'} · {p.closingDate ? formatDate(p.closingDate) : 'no close date'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">{money(p.forecastAmount)}</p>
                    <p className="text-[11px] text-muted-foreground">{p.probability}% · {money(p.amount)}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
