'use client'

import { useState, useMemo } from 'react'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { fieldConfigs, type ModuleField } from '@/lib/module-fields'
import { getFieldLabel } from '@/lib/field-utils'
import { Upload, ArrowRight, ArrowLeft, Loader2, Check, AlertTriangle, FileSpreadsheet, RefreshCw } from 'lucide-react'

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cur = ''
  let inQ = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (c === '"') {
      if (inQ && text[i + 1] === '"') { cur += '"'; i++ } else inQ = !inQ
    } else if (c === ',' && !inQ) {
      row.push(cur); cur = ''
    } else if ((c === '\n' || c === '\r') && !inQ) {
      row.push(cur)
      if (row.some(cell => cell.trim() !== '')) rows.push(row)
      row = []; cur = ''
    } else cur += c
  }
  row.push(cur)
  if (row.some(cell => cell.trim() !== '')) rows.push(row)
  return rows
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

function autoMap(headers: string[], fields: ModuleField[]): Record<number, string> {
  const map: Record<number, string> = {}
  const used = new Set<string>()
  headers.forEach((h, i) => {
    const target = norm(h)
    const hit = fields.find(f => !used.has(f.name) && (norm(f.name) === target || norm(getFieldLabel(f.name)) === target))
    if (hit) { map[i] = hit.name; used.add(hit.name) }
  })
  return map
}

function isDate(v: string): boolean {
  if (!v) return true
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return true
  return !Number.isNaN(new Date(v).getTime())
}

function validateRow(data: Record<string, any>, fields: ModuleField[]): string[] {
  const errs: string[] = []
  for (const f of fields) {
    if (!(f.name in data)) continue
    const v = data[f.name]
    if (f.required && (v == null || v === '')) { errs.push(`${getFieldLabel(f.name)} is required`); continue }
    if (v == null || v === '') continue
    if (f.type === 'number' && Number.isNaN(Number(v))) errs.push(`${getFieldLabel(f.name)} must be a number`)
    if (f.type === 'date' && !isDate(String(v))) errs.push(`${getFieldLabel(f.name)} must be a date (YYYY-MM-DD)`)
  }
  return errs
}

function coerceBoolean(v: any): any {
  if (v == null || v === '') return null
  const low = String(v).trim().toLowerCase()
  if (['yes', 'no', '1', '0', 'y', 'n', 'true', 'false'].includes(low)) return ['yes', '1', 'y', 'true'].includes(low)
  return v
}

export function ImportWizardDialog({ module, open, onOpenChange, onImported }: {
  module: string
  open: boolean
  onOpenChange: (v: boolean) => void
  onImported?: () => void
}) {
  const { addToast } = useToast()
  const fields = fieldConfigs[module] || []
  const [step, setStep] = useState<'upload' | 'map' | 'preview' | 'result'>('upload')
  const [fileName, setFileName] = useState('')
  const [hasHeader, setHasHeader] = useState(true)
  const [rawRows, setRawRows] = useState<string[][]>([])
  const [mapping, setMapping] = useState<Record<number, string>>({})
  const [skipInvalid, setSkipInvalid] = useState(true)
  const [updateExisting, setUpdateExisting] = useState(false)
  const [matchField, setMatchField] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<any>(null)

  function reset() {
    setStep('upload')
    setFileName('')
    setHasHeader(true)
    setRawRows([])
    setMapping({})
    setSkipInvalid(true)
    setUpdateExisting(false)
    setMatchField('')
    setBusy(false)
    setResult(null)
  }

  function onFile(file: File) {
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result || '')
      const rows = parseCsv(text)
      const dataRows = hasHeader ? rows.slice(1) : rows
      const headers = hasHeader && rows.length ? rows[0] : dataRows[0]?.map((_, i) => `column${i + 1}`) || []
      setRawRows(dataRows)
      setMapping(autoMap(headers, fields))
      setStep('map')
    }
    reader.readAsText(file)
  }

  const headers: string[] = useMemo(() => rawRows[0]?.map((_, i) => `column${i + 1}`) || [], [rawRows])

  const mappedFields = Object.values(mapping).filter(Boolean) as string[]
  const validRows = useMemo(() => rawRows.map(row => {
    const data: Record<string, any> = {}
    headers.forEach((_, i) => {
      const f = mapping[i]
      if (!f) return
      let v = row[i]
      const cfg = fields.find(x => x.name === f)
      if (cfg?.type === 'checkbox') v = coerceBoolean(v)
      data[f] = v
    })
    return { row: data, errors: validateRow(data, fields.filter(f => mappedFields.includes(f.name))) }
  }), [rawRows, headers, mapping, fields, mappedFields])

  const validCount = validRows.filter(r => r.errors.length === 0).length
  const matchOptions = mappedFields

  async function doImport() {
    setBusy(true)
    try {
      let rows = validRows.map(r => r.row)
      if (skipInvalid) rows = validRows.filter(r => r.errors.length === 0).map(r => r.row)
      const res = await api.importModuleRows(module, rows, { matchField: updateExisting ? matchField : undefined, updateExisting })
      setResult(res)
      setStep('result')
      if (res.failed === 0) addToast({ title: 'Import complete', description: `${res.created} created${res.updated ? `, ${res.updated} updated` : ''}`, variant: 'success' })
      onImported?.()
    } catch (e: any) {
      addToast({ title: 'Import failed', description: e?.message || 'Unable to import', variant: 'destructive' })
    }
    setBusy(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v) }}>
      <DialogContent className="max-w-3xl h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet size={18} className="text-emerald-500" /> Import {getFieldLabel(module).toLowerCase() || module} records
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
          {['Upload CSV', 'Map fields', 'Review & validate', 'Result'].map((label, i) => {
            const keys = ['upload', 'map', 'preview', 'result'] as const
            const active = keys.indexOf(step) === i
            const done = keys.indexOf(step) > i
            return (
              <div key={label} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-muted-foreground/50">→</span>}
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${active ? 'bg-primary/10 text-primary' : done ? 'bg-emerald-500/10 text-emerald-600' : 'text-muted-foreground'}`}>
                  {done ? <Check size={11} /> : <span className="inline-block w-3 text-center">{i + 1}</span>} {label}
                </span>
              </div>
            )
          })}
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {step === 'upload' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Switch checked={hasHeader} onCheckedChange={setHasHeader} />
                <span className="text-sm">First row is the header row</span>
              </div>
              <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-12 cursor-pointer hover:bg-muted/40 transition-colors">
                <Upload size={28} className="text-muted-foreground" />
                <span className="text-sm font-medium">{fileName || 'Choose a CSV file to upload'}</span>
                <span className="text-xs text-muted-foreground">Headers should match module field names (e.g. accountName, email, annualRevenue)</span>
                <Input type="file" accept=".csv,text/csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = '' }} />
              </label>
            </div>
          )}

          {step === 'map' && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Map each CSV column to a module field, or skip it. Fields auto-matched from the header names.</p>
              {mappedFields.length === 0 && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-300/60 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
                  <AlertTriangle size={14} /> No columns mapped yet — select a target field for each column below.
                </div>
              )}
              <div className="rounded-xl border divide-y">
                {headers.map((h, i) => (
                  <div key={i} className="px-3 py-2.5 grid grid-cols-[1fr_1.5fr_2fr] gap-3 items-center text-sm">
                    <div>
                      <div className="font-medium truncate">{h}</div>
                      <div className="text-xs text-muted-foreground truncate">e.g. {rawRows[0]?.[i] || '—'}</div>
                    </div>
                    <Select value={mapping[i] || ''} onValueChange={(v) => setMapping(m => ({ ...m, [i]: v }))}>
                      <SelectTrigger><SelectValue placeholder="Skip column" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Skip column</SelectItem>
                        {fields.map(f => <SelectItem key={f.name} value={f.name}>{getFieldLabel(f.name)} {f.required ? '*' : ''} <span className="text-muted-foreground">({f.type})</span></SelectItem>)}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                      {mapping[i] && <span className="rounded-full bg-emerald-500/10 text-emerald-600 px-2 py-0.5 text-xs font-medium">→ {getFieldLabel(mapping[i])}</span>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xs font-medium text-muted-foreground uppercase mb-2">Preview (first {Math.min(3, rawRows.length)} rows)</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <tbody>
                      {rawRows.slice(0, 3).map((row, ri) => (
                        <tr key={ri}>
                          {headers.map((_, ci) => (
                            <td key={ci} className="border px-2 py-1 whitespace-nowrap text-muted-foreground">{mapping[ci] ? row[ci] : <span className="line-through opacity-50">{row[ci]}</span>}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border px-3 py-2 text-center"><div className="text-2xl font-bold">{rawRows.length}</div><div className="text-xs text-muted-foreground">Total rows</div></div>
                <div className="rounded-lg border px-3 py-2 text-center"><div className="text-2xl font-bold text-emerald-600">{validCount}</div><div className="text-xs text-muted-foreground">Valid</div></div>
                <div className="rounded-lg border px-3 py-2 text-center"><div className="text-2xl font-bold text-destructive">{rawRows.length - validCount}</div><div className="text-xs text-muted-foreground">Invalid</div></div>
              </div>

              {rawRows.length - validCount > 0 && (
                <div className="rounded-xl border border-destructive/30">
                  <div className="px-3 py-2 border-b text-xs font-medium text-destructive flex items-center gap-1.5"><AlertTriangle size={13} /> Validation issues (showing up to 10)</div>
                  <div className="divide-y max-h-52 overflow-y-auto">
                    {validRows.filter(r => r.errors.length).slice(0, 10).map((r, i) => (
                      <div key={i} className="px-3 py-1.5 text-sm"><span className="text-muted-foreground">Row {i + 1}:</span> <span className="text-destructive">{r.errors.join('; ')}</span></div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-xl border p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Update existing records</div>
                    <div className="text-xs text-muted-foreground">Match on a unique field and update instead of creating duplicates</div>
                  </div>
                  <Switch checked={updateExisting} onCheckedChange={setUpdateExisting} />
                </div>
                {updateExisting && (
                  <div>
                    <label className="text-xs font-medium block mb-1">Match on field</label>
                    <Select value={matchField} onValueChange={setMatchField}>
                      <SelectTrigger><SelectValue placeholder="Select a field" /></SelectTrigger>
                      <SelectContent>
                        {matchOptions.map(f => <SelectItem key={f} value={f}>{getFieldLabel(f)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between rounded-xl border p-3">
                <div>
                  <div className="text-sm font-medium">Skip invalid rows</div>
                  <div className="text-xs text-muted-foreground">Import only rows that pass validation</div>
                </div>
                <Switch checked={skipInvalid} onCheckedChange={setSkipInvalid} />
              </div>
            </div>
          )}

          {step === 'result' && result && (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-2">
                <div className="rounded-lg border px-3 py-2 text-center"><div className="text-2xl font-bold text-emerald-600">{result.created}</div><div className="text-xs text-muted-foreground">Created</div></div>
                <div className="rounded-lg border px-3 py-2 text-center"><div className="text-2xl font-bold text-blue-600">{result.updated}</div><div className="text-xs text-muted-foreground">Updated</div></div>
                <div className="rounded-lg border px-3 py-2 text-center"><div className="text-2xl font-bold text-destructive">{result.failed}</div><div className="text-xs text-muted-foreground">Failed</div></div>
                <div className="rounded-lg border px-3 py-2 text-center"><div className="text-2xl font-bold">{result.total}</div><div className="text-xs text-muted-foreground">Processed</div></div>
              </div>
              {result.errors?.length > 0 && (
                <div className="rounded-xl border border-destructive/30">
                  <div className="px-3 py-2 border-b text-xs font-medium text-destructive flex items-center gap-1.5"><AlertTriangle size={13} /> Errors (showing up to 50)</div>
                  <div className="divide-y max-h-52 overflow-y-auto">
                    {result.errors.map((e: any, i: number) => (
                      <div key={i} className="px-3 py-1.5 text-sm"><span className="text-muted-foreground">Row {e.row}:</span> <span className="text-destructive">{e.error}</span></div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between gap-2 pt-3 border-t mt-3">
          <div>
            {step !== 'upload' && step !== 'result' && (
              <Button variant="outline" onClick={() => setStep(step === 'map' ? 'upload' : 'map')}><ArrowLeft size={14} className="mr-1.5" /> Back</Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            {step === 'map' && (
              <Button onClick={() => setStep('preview')} disabled={mappedFields.length === 0}><ArrowRight size={14} className="mr-1.5" /> Review ({rawRows.length} rows)</Button>
            )}
            {step === 'preview' && (
              <Button onClick={doImport} disabled={busy}>
                {busy ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Upload size={14} className="mr-1.5" />}
                Import {skipInvalid ? `${validCount}` : `${rawRows.length}`} row{skipInvalid ? validCount !== 1 && 's' : rawRows.length !== 1 && 's'}
              </Button>
            )}
            {step === 'result' && (
              <Button onClick={() => { reset(); onOpenChange(false) }}><Check size={14} className="mr-1.5" /> Done</Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
