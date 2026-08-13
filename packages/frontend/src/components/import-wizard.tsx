import { useRef, useState } from 'react'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { getFieldLabel } from '@/lib/field-utils'
import { fieldConfigs } from '@/lib/module-fields'
import { Upload, Loader2, ChevronLeft, ChevronRight, CheckCircle2, XCircle, FileSpreadsheet, Link2 } from 'lucide-react'

const inputCls = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

function parseCSV(content: string, delimiter: string): { headers: string[]; rows: string[][] } {
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0)
  const parseRow = (line: string): string[] => {
    const out: string[] = []
    let cur = ''
    let inQ = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (c === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++ } else inQ = !inQ
      } else if (c === delimiter && !inQ) { out.push(cur.trim()); cur = '' }
      else cur += c
    }
    out.push(cur.trim())
    return out
  }
  const grid = lines.map(parseRow)
  const headers = grid[0] || []
  const rows = grid.slice(1).filter(r => r.some(c => c !== ''))
  return { headers, rows }
}

function stripBom(s: string): string {
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s
}

export function ImportWizard({ module, open, onOpenChange }: {
  module: string
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const queryClient = useQueryClient()
  const { addToast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)

  const fields = fieldConfigs[module] || []

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [delimiter, setDelimiter] = useState(',')
  const [fileName, setFileName] = useState('')
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  const [mapping, setMapping] = useState<Record<number, string>>({})
  const [matchField, setMatchField] = useState('')
  const [updateExisting, setUpdateExisting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<any | null>(null)

  const onFile = async (file: File) => {
    setFileName(file.name)
    setResult(null)
    const text = stripBom(await file.text())
    const { headers, rows } = parseCSV(text, delimiter)
    setHeaders(headers)
    setRows(rows)
    const auto: Record<number, string> = {}
    headers.forEach((h, i) => {
      const norm = h.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
      const hit = fields.find(f =>
        f.name.toLowerCase() === norm ||
        f.name.toLowerCase().replace(/[^a-z0-9]/g, '') === norm ||
        getFieldLabel(f.name).toLowerCase().replace(/[^a-z0-9]/g, '') === norm
      )
      if (hit) auto[i] = hit.name
    })
    setMapping(auto)
    setStep(2)
  }

  const previewRows = rows.slice(0, 6)

  const mappedColumns = Object.entries(mapping).filter(([, f]) => f)
  const finalRows = rows.map(row => {
    const obj: Record<string, string> = {}
    for (const [ci, f] of mappedColumns) {
      const idx = Number(ci)
      if (row[idx] !== '') obj[f] = row[idx]
    }
    return obj
  })

  const doImport = async () => {
    setImporting(true)
    setResult(null)
    try {
      const res = await api.importModuleRows(module, finalRows, { matchField: updateExisting ? matchField : undefined, updateExisting })
      setResult(res)
      setStep(3)
      queryClient.invalidateQueries({ queryKey: [module] })
      if (res.failed === 0) addToast({ title: 'Import complete', description: `${res.created} created${res.updated ? `, ${res.updated} updated` : ''}`, variant: 'success' })
    } catch (e: any) {
      addToast({ title: 'Import failed', description: e?.message || 'Unable to import rows', variant: 'destructive' })
    }
    setImporting(false)
  }

  const close = (v: boolean) => {
    onOpenChange(v)
    if (!v) { setStep(1); setFileName(''); setHeaders([]); setRows([]); setMapping({}); setMatchField(''); setUpdateExisting(false); setResult(null) }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-4xl max-h-[88vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet size={18} className="text-emerald-500" /> Import {getFieldLabel(module)}
          </DialogTitle>
        </DialogHeader>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 text-xs mb-4">
          {['Upload file', 'Map fields', 'Import'].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium ${step === i + 1 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' : step > i + 1 ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                {step > i + 1 ? <CheckCircle2 size={13} /> : <span>{i + 1}</span>} {s}
              </span>
              {i < 2 && <ChevronRight size={13} className="text-muted-foreground" />}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 max-w-md">
                <div>
                  <label className="text-sm font-medium block mb-1.5">Delimiter</label>
                  <Select value={delimiter} onValueChange={setDelimiter}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value=",">Comma (,)</SelectItem>
                      <SelectItem value=";">Semicolon (;)</SelectItem>
                      <SelectItem value="\t">Tab</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="rounded-xl border border-dashed p-8 text-center">
                <Upload size={28} className="mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">{fileName || 'Drop your CSV file here or browse'}</p>
                <p className="text-xs text-muted-foreground mt-1">First row is treated as the header with column names.</p>
                <Button className="mt-4" onClick={() => fileRef.current?.click()}>
                  {fileName ? 'Choose another file' : 'Choose file'}
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,text/csv,.tsv,.txt"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) onFile(f) }}
                />
              </div>
              {fileName && (
                <div className="flex justify-end">
                  <Button onClick={() => setStep(2)}>Next <ChevronRight size={15} className="ml-1.5" /></Button>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{fileName}</span> — {rows.length} rows found. Map each column to a {getFieldLabel(module)} field.
              </div>
              <div className="rounded-xl border overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      {headers.map((h, i) => (
                        <th key={i} className="px-3 py-2 text-left font-semibold whitespace-nowrap min-w-[140px]">
                          <div className="text-[10px] uppercase text-muted-foreground mb-1">Column: {h || `col${i + 1}`}</div>
                          <Select value={mapping[i] || '__skip'} onValueChange={(v) => setMapping(m => ({ ...m, [i]: v === '__skip' ? '' : v }))}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__skip">— Skip —</SelectItem>
                              {fields.map(f => <SelectItem key={f.name} value={f.name}>{getFieldLabel(f.name)}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, ri) => (
                      <tr key={ri} className="border-b last:border-0">
                        {headers.map((_, i) => (
                          <td key={i} className="px-3 py-1.5 max-w-[220px] truncate">{row[i]}</td>
                        ))}
                      </tr>
                    ))}
                    {previewRows.length === 0 && (
                      <tr><td colSpan={headers.length} className="px-3 py-4 text-center text-muted-foreground">No data rows found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {mappedColumns.length === 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400">Map at least one column to a field before continuing.</p>
              )}
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}><ChevronLeft size={15} className="mr-1.5" /> Back</Button>
                <Button onClick={() => setStep(3)} disabled={mappedColumns.length === 0}>
                  Review &amp; import <ChevronRight size={15} className="ml-1.5" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              {!result && (
                <>
                  <div className="rounded-xl border p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Link2 size={15} className="text-primary" /> Duplicate handling
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Optionally match existing records on a unique field and update them instead of creating duplicates.
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium block mb-1">Match on field</label>
                        <Select value={matchField} onValueChange={setMatchField}>
                          <SelectTrigger><SelectValue placeholder="None (create all)" /></SelectTrigger>
                          <SelectContent>
                            {fields.map(f => <SelectItem key={f.name} value={f.name}>{getFieldLabel(f.name)}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center gap-2 text-sm pb-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-input"
                            checked={updateExisting}
                            onChange={e => { setUpdateExisting(e.target.checked); if (!e.target.checked) setMatchField('') }}
                          />
                          Update existing records
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border bg-muted/30 p-4 text-sm">
                    <div className="font-semibold mb-2">Summary</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between border-b py-1"><span className="text-muted-foreground">Rows to import</span><span className="font-semibold">{finalRows.length}</span></div>
                      <div className="flex justify-between border-b py-1"><span className="text-muted-foreground">Mapped columns</span><span className="font-semibold">{mappedColumns.length}</span></div>
                      <div className="flex justify-between py-1"><span className="text-muted-foreground">Unmatched columns</span><span className="font-semibold">{headers.length - mappedColumns.length}</span></div>
                      <div className="flex justify-between py-1"><span className="text-muted-foreground">Target module</span><span className="font-semibold capitalize">{module}</span></div>
                    </div>
                  </div>
                </>
              )}

              {result && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl border p-4 text-center">
                      <p className="text-2xl font-bold text-emerald-600">{result.created}</p>
                      <p className="text-xs text-muted-foreground">Created</p>
                    </div>
                    <div className="rounded-xl border p-4 text-center">
                      <p className="text-2xl font-bold text-blue-600">{result.updated || 0}</p>
                      <p className="text-xs text-muted-foreground">Updated</p>
                    </div>
                    <div className="rounded-xl border p-4 text-center">
                      <p className="text-2xl font-bold text-destructive">{result.failed || 0}</p>
                      <p className="text-xs text-muted-foreground">Failed</p>
                    </div>
                  </div>
                  {result.errors?.length > 0 && (
                    <div className="rounded-xl border max-h-56 overflow-y-auto">
                      {result.errors.map((e: any, i: number) => (
                        <div key={i} className="flex items-start gap-2 px-3 py-2 text-xs border-b last:border-0">
                          <XCircle size={13} className="text-destructive shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">Row {e.row}:</span> <span>{e.error}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between">
                {!result ? (
                  <>
                    <Button variant="outline" onClick={() => setStep(2)}><ChevronLeft size={15} className="mr-1.5" /> Back</Button>
                    <Button onClick={doImport} disabled={importing || finalRows.length === 0}>
                      {importing ? <Loader2 size={15} className="mr-1.5 animate-spin" /> : <Upload size={15} className="mr-1.5" />}
                      {importing ? 'Importing...' : `Import ${finalRows.length} rows`}
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => { setStep(1); setFileName(''); setHeaders([]); setRows([]); setMapping({}); setMatchField(''); setUpdateExisting(false); setResult(null) }}>
                    Import another file
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
