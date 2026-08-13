import { useState } from 'react'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, GitMerge, Copy, Check } from 'lucide-react'
import { getFieldLabel } from '@/lib/field-utils'
import { MergeRecordsDialog } from './merge-records-dialog'
import { MERGEABLE_MODULES } from './merge-records-dialog'

export { MERGEABLE_MODULES }

const IDENTITY_FIELDS: Record<string, string[]> = {
  accounts: ['accountName', 'email', 'phone', 'website'],
  contacts: ['email', 'phone'],
  leads: ['email', 'phone', 'company'],
  potentials: ['potentialName'],
  campaigns: ['campaignName'],
  products: ['productName', 'productNo'],
  services: ['serviceName', 'serviceNo'],
  vendors: ['vendorName', 'email'],
  tickets: ['title'],
  faq: ['title'],
  projects: ['projectName', 'projectNo'],
  assets: ['assetName', 'serialNo'],
  servicecontracts: ['contractName', 'contractNo'],
}

function norm(v: any): string {
  if (v == null) return ''
  return String(v).trim().toLowerCase()
}

function recordTitle(rec: any, module: string): string {
  const fields = IDENTITY_FIELDS[module] || []
  for (const f of fields) {
    const v = rec?.[f]
    if (v != null && String(v).trim() !== '') return String(v)
  }
  return rec.id ? rec.id.slice(0, 8) : 'Unknown'
}

interface DupGroup { key: string; field: string; value: string; records: any[] }

export function FindDuplicatesDialog({ module, open, onOpenChange }: {
  module: string
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const { addToast } = useToast()
  const [groups, setGroups] = useState<DupGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [mergeFor, setMergeFor] = useState<{ id: string; record: any } | null>(null)

  const fields = IDENTITY_FIELDS[module] || []

  async function scan() {
    setLoading(true)
    setGroups([])
    try {
      const res = await api.listAll(module)
      const records: any[] = res?.data || []
      const buckets = new Map<string, { field: string; value: string; records: any[] }>()

      for (const rec of records) {
        for (const f of fields) {
          const v = norm(rec[f])
          if (!v) continue
          const key = `${f}:${v}`
          const b = buckets.get(key)
          if (b) b.records.push(rec)
          else buckets.set(key, { field: f, value: String(rec[f]).trim(), records: [rec] })
        }
      }

      const found: DupGroup[] = []
      for (const b of buckets.values()) {
        if (b.records.length > 1) {
          const unique = [...new Map(b.records.map(r => [r.id, r])).values()]
          if (unique.length > 1) found.push({ key: `${b.field}:${b.value}:${unique[0].id}`, field: b.field, value: b.value, records: unique })
        }
      }
      found.sort((a, b) => b.records.length - a.records.length)
      setGroups(found)
      if (found.length === 0) addToast({ title: 'No duplicates found', description: `No duplicate records detected in ${module}`, variant: 'success' })
    } catch (e: any) {
      addToast({ title: 'Scan failed', description: e?.message || 'Unable to scan for duplicates', variant: 'destructive' })
    }
    setLoading(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setGroups([]) }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Copy size={18} className="text-indigo-500" /> Find Duplicates — {getFieldLabel(module)}
            </DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Scans all records for matching {fields.map(f => getFieldLabel(f)).join(', ') || 'identity'} fields.
            </p>
            <Button size="sm" onClick={scan} disabled={loading}>
              {loading ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Copy size={14} className="mr-1.5" />}
              {loading ? 'Scanning...' : 'Scan now'}
            </Button>
          </div>

          <div className="mt-4 flex-1 overflow-y-auto pr-1 space-y-4">
            {groups.length === 0 && !loading && (
              <p className="text-sm text-muted-foreground text-center py-10">
                No scan yet — click "Scan now" to look for duplicate records.
              </p>
            )}
            {groups.map(g => (
              <div key={g.key} className="rounded-xl border">
                <div className="px-4 py-2.5 border-b flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-sm font-semibold">{getFieldLabel(g.field)}: <span className="text-muted-foreground">{g.value}</span></span>
                  </div>
                  <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 px-2 py-0.5 text-[11px] font-semibold">
                    {g.records.length} records
                  </span>
                </div>
                <div className="divide-y">
                  {g.records.map(r => (
                    <div key={r.id} className="px-4 py-2.5 flex items-center justify-between gap-2 text-sm">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{recordTitle(r, module)}</p>
                        <p className="text-xs text-muted-foreground truncate">id: {r.id}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setMergeFor({ id: r.id, record: r })}
                      >
                        <GitMerge size={14} className="mr-1.5" /> Merge
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {mergeFor && (
        <MergeRecordsDialog
          module={module}
          currentId={mergeFor.id}
          currentRecord={mergeFor.record}
          open
          onOpenChange={(v) => { if (!v) { setMergeFor(null); scan() } }}
          onMerged={() => {
            setMergeFor(null)
            scan()
            addToast({ title: 'Merged', description: 'Duplicate records merged', variant: 'success' })
          }}
        />
      )}
    </>
  )
}

export function hasMergeSupport(module: string): boolean {
  return MERGEABLE_MODULES.includes(module) && !!IDENTITY_FIELDS[module]
}
