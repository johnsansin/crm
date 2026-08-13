import { useState, useEffect, useMemo } from 'react'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { getFieldLabel } from '@/lib/field-utils'
import { GitMerge, Loader2 } from 'lucide-react'

const MERGE_LABEL_FIELDS: Record<string, string[]> = {
  accounts: ['accountName', 'accountNo', 'email'],
  contacts: ['firstName', 'lastName', 'email'],
  leads: ['firstName', 'lastName', 'company', 'email'],
  potentials: ['potentialName', 'amount'],
  campaigns: ['campaignName'],
  products: ['productName', 'productCode', 'productNo'],
  services: ['serviceName', 'serviceNo'],
  vendors: ['vendorName', 'email'],
  tickets: ['title', 'ticketNo'],
  faq: ['title', 'faqNo'],
  projects: ['projectName', 'projectNo'],
  assets: ['assetName', 'serialNo'],
  servicecontracts: ['contractName', 'contractNo'],
}

export const MERGEABLE_MODULES = Object.keys(MERGE_LABEL_FIELDS)

function recordLabel(rec: any, module: string): string {
  const fields = MERGE_LABEL_FIELDS[module] || []
  for (const f of fields) {
    const v = rec?.[f]
    if (v != null && String(v).trim() !== '') return String(v)
  }
  return rec?.id ? rec.id.slice(0, 8) : 'Unknown'
}

function isScalarValue(v: any): boolean {
  return v == null || typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' || v instanceof Date
}

const EXCLUDED_FIELDS = new Set(['id', 'createdAt', 'updatedAt', 'companyId', 'isActive', 'createdBy', 'customFields'])

export function MergeRecordsDialog({ module, currentId, currentRecord, open, onOpenChange, onMerged }: {
  module: string
  currentId: string
  currentRecord: any
  open: boolean
  onOpenChange: (v: boolean) => void
  onMerged: (targetId: string) => void
}) {
  const { addToast } = useToast()
  const [candidates, setCandidates] = useState<any[]>([])
  const [targetId, setTargetId] = useState('')
  const [choices, setChoices] = useState<Record<string, 'source' | 'target'>>({})
  const [merging, setMerging] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setTargetId('')
    setChoices({})
    Promise.all([
      api.getDuplicates(module, currentId).catch(() => ({ data: [] })),
      api.list(module, { limit: '100' }).catch(() => ({ data: [] })),
    ]).then(([dups, all]) => {
      const seen = new Set<string>()
      const list: any[] = []
      for (const r of [...(dups?.data || []), ...(all?.data || [])]) {
        if (!r || r.id === currentId || seen.has(r.id)) continue
        seen.add(r.id)
        list.push(r)
      }
      setCandidates(list)
      setLoading(false)
    })
  }, [open, module, currentId])

  const targetRecord = useMemo(() => candidates.find(c => c.id === targetId) || null, [candidates, targetId])

  const comparableFields = useMemo(() => {
    if (!targetRecord) return []
    const keys = new Set<string>([...Object.keys(currentRecord || {}), ...Object.keys(targetRecord)])
    const out: string[] = []
    for (const k of keys) {
      if (EXCLUDED_FIELDS.has(k)) continue
      if (!isScalarValue(currentRecord?.[k]) || !isScalarValue(targetRecord[k])) continue
      if (typeof currentRecord?.[k] === 'object' || typeof targetRecord[k] === 'object') continue
      if (currentRecord?.[k] == null && targetRecord[k] == null) continue
      out.push(k)
    }
    out.sort()
    return out
  }, [currentRecord, targetRecord])

  const defaultChoice = (field: string): 'source' | 'target' => {
    const sv = currentRecord?.[field]
    const tv = targetRecord?.[field]
    const svBlank = sv == null || sv === ''
    const tvBlank = tv == null || tv === ''
    if (svBlank) return 'target'
    if (tvBlank) return 'source'
    return 'target'
  }

  async function handleMerge() {
    if (!targetId) return
    setMerging(true)
    try {
      const keepFields = comparableFields
        .filter(f => (choices[f] || defaultChoice(f)) === 'source')
        .filter(f => currentRecord?.[f] != null && currentRecord[f] !== '')
      const res = await api.mergeRecords(module, currentId, targetId, keepFields)
      addToast({ title: 'Merged', description: 'Records merged successfully', variant: 'success' })
      onOpenChange(false)
      onMerged(res.targetId || targetId)
    } catch (e: any) {
      addToast({ title: 'Merge failed', description: e?.message || 'Unable to merge records', variant: 'destructive' })
    }
    setMerging(false)
  }

  function formatVal(v: any): string {
    if (v == null || v === '') return '—'
    if (typeof v === 'boolean') return v ? 'Yes' : 'No'
    if (v instanceof Date) return v.toLocaleDateString()
    return String(v)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitMerge size={18} className="text-violet-500" /> Merge Records
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-y-auto pr-1">
          <p className="text-sm text-muted-foreground">
            Merge the current record into the record below. The surviving record keeps its values; any blank fields are filled from this record. Field values marked as kept from this record take precedence.
          </p>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Surviving record</label>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 size={14} className="animate-spin" /> Loading records...</div>
            ) : (
              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder={candidates.length ? `Select record (${candidates.length} candidates)` : 'No other records found'} /></SelectTrigger>
                <SelectContent>
                  {candidates.map(c => (
                    <SelectItem key={c.id} value={c.id}>{recordLabel(c, module)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {targetRecord && (
            <div className="rounded-xl border">
              <div className="px-4 py-2.5 border-b text-sm font-semibold flex items-center justify-between">
                <span>Field values</span>
                <span className="text-xs font-normal text-muted-foreground">Pick which value to keep per field</span>
              </div>
              <div className="divide-y max-h-80 overflow-y-auto">
                {comparableFields.map(field => {
                  const sv = currentRecord?.[field]
                  const tv = targetRecord[field]
                  const chosen = choices[field] || defaultChoice(field)
                  const svBlank = sv == null || sv === ''
                  const tvBlank = tv == null || tv === ''
                  return (
                    <div key={field} className="px-4 py-2.5 grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr] gap-2 items-center text-sm">
                      <div className="font-medium truncate">{getFieldLabel(field)}</div>
                      <label className={`flex items-start gap-2 rounded-lg border px-2.5 py-1.5 cursor-pointer ${chosen === 'source' ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/40' : 'border-border'}`}>
                        <input type="radio" className="mt-0.5" checked={chosen === 'source'} onChange={() => setChoices(c => ({ ...c, [field]: 'source' }))} />
                        <div className="min-w-0">
                          <div className="text-[11px] text-muted-foreground">This record</div>
                          <div className={svBlank ? 'text-muted-foreground' : ''}>{formatVal(sv)}</div>
                        </div>
                      </label>
                      <label className={`flex items-start gap-2 rounded-lg border px-2.5 py-1.5 cursor-pointer ${chosen === 'target' ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/40' : 'border-border'}`}>
                        <input type="radio" className="mt-0.5" checked={chosen === 'target'} onChange={() => setChoices(c => ({ ...c, [field]: 'target' }))} />
                        <div className="min-w-0">
                          <div className="text-[11px] text-muted-foreground">Surviving ({recordLabel(targetRecord, module)})</div>
                          <div className={tvBlank ? 'text-muted-foreground' : ''}>{formatVal(tv)}</div>
                        </div>
                      </label>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t mt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleMerge} disabled={merging || !targetId}>
            {merging ? <Loader2 size={15} className="mr-1.5 animate-spin" /> : <GitMerge size={15} className="mr-1.5" />}
            Merge into selected record
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
