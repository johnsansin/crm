'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Target, Loader2, Save, Undo2 } from 'lucide-react'

export const SALES_STAGES = ['Prospecting', 'Qualification', 'Needs Analysis', 'Value Proposition', 'Id. Decision Makers', 'Perception Analysis', 'Proposal/Price Quote', 'Negotiation/Review', 'Closed Won', 'Closed Lost']

const DEFAULT_STAGE_PROBABILITIES: Record<string, number> = {
  'Prospecting': 10,
  'Qualification': 20,
  'Needs Analysis': 25,
  'Value Proposition': 30,
  'Id. Decision Makers': 40,
  'Perception Analysis': 50,
  'Proposal/Price Quote': 65,
  'Negotiation/Review': 80,
  'Closed Won': 100,
  'Closed Lost': 0,
}

export function PotentialSettings() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()

  const { data: settings, isLoading } = useQuery({
    queryKey: ['org-settings'],
    queryFn: () => api.getOrgSettings(),
  })

  const [stageProbability, setStageProbability] = useState<Record<string, number>>({})
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (!settings) return
    const stored = settings.stageProbability || {}
    const merged: Record<string, number> = {}
    for (const stage of SALES_STAGES) {
      const v = stored[stage]
      merged[stage] = v != null && v !== '' ? Number(v) : (DEFAULT_STAGE_PROBABILITIES[stage] ?? 0)
    }
    setStageProbability(merged)
  }, [settings])

  const saveMutation = useMutation({
    mutationFn: () => api.updateOrgSettings({ stageProbability }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-settings'] })
      setDirty(false)
      addToast({ title: 'Saved', description: 'Stage probability mapping updated', variant: 'success' })
    },
    onError: (e: any) => addToast({ title: 'Save failed', description: e?.message || 'Something went wrong', variant: 'destructive' }),
  })

  const setProb = (stage: string, value: string) => {
    const n = value === '' ? 0 : Math.max(0, Math.min(100, Number(value) || 0))
    setStageProbability(prev => ({ ...prev, [stage]: n }))
    setDirty(true)
  }

  const resetAll = () => {
    setStageProbability({ ...DEFAULT_STAGE_PROBABILITIES })
    setDirty(true)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-muted-foreground" size={24} />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-muted-foreground max-w-2xl">
          Assign a default probability (%) to each sales stage. When a stage is selected on an Opportunity,
          the probability is pre-filled automatically unless the user has already entered one.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={resetAll}><Undo2 size={14} className="mr-1" /> Reset to defaults</Button>
          <Button size="sm" disabled={!dirty || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            {saveMutation.isPending ? <Loader2 size={14} className="animate-spin mr-1" /> : <Save size={14} className="mr-1" />} Save mapping
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><Target size={16} className="text-primary" /> Sales Stage Probability</CardTitle>
          <CardDescription>Default probability for each Opportunity stage.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SALES_STAGES.map(stage => (
              <div key={stage} className="flex items-center justify-between gap-4 rounded-md border px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{stage}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    className="w-20 h-9 text-sm"
                    value={stageProbability[stage] ?? 0}
                    onChange={e => setProb(stage, e.target.value)}
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
