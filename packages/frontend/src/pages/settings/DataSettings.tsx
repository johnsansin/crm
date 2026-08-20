import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileJson, FileText, Wand2 } from 'lucide-react'
import { ImportWizardDialog } from '@/components/import-wizard-dialog'

const inputCls = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

const MODULES = [
  'accounts', 'contacts', 'leads', 'potentials', 'campaigns', 'products', 'services',
  'vendors', 'pricebooks', 'quotes', 'salesorders', 'purchaseorders', 'invoices',
  'tickets', 'faq', 'projects', 'projecttasks', 'projectmilestones', 'assets',
  'servicecontracts', 'smsnotifier',
]

export function DataSettings() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [moduleName, setModuleName] = useState('accounts')
  const [importOpen, setImportOpen] = useState(false)

  const exportModule = (format: 'csv' | 'json') => {
    api.exportModule(moduleName, format).then(res => {
      if (!res.ok) addToast({ title: 'Export failed', description: res.error, variant: 'destructive' })
    })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-sm">Import / Export Records</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1.5">Module</label>
            <select className={`${inputCls} max-w-sm`} value={moduleName} onChange={e => setModuleName(e.target.value)}>
              {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => exportModule('csv')}>
              <FileText size={14} className="mr-1.5" /> Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportModule('json')}>
              <FileJson size={14} className="mr-1.5" /> Export JSON
            </Button>
          </div>
          <div className="border-t pt-4">
            <div className="text-xs font-medium text-muted-foreground uppercase mb-2">Import CSV</div>
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
              <Wand2 size={14} className="mr-1.5" /> Import Wizard
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Upload a CSV, map columns to fields, review validation, then import. Date columns use YYYY-MM-DD; numbers and booleans are parsed automatically. Unassigned records are assigned to you.
            </p>
          </div>
        </CardContent>
      </Card>

      <ImportWizardDialog
        module={moduleName}
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={() => queryClient.invalidateQueries({ queryKey: [moduleName] })}
      />
    </div>
  )
}
