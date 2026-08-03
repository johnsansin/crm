import { Request, Response, NextFunction } from 'express'

const FIELD_LABELS: Record<string, string> = {
  code: 'Currency Code',
  name: 'Name',
  email: 'Email',
  userName: 'Username',
  quoteNo: 'Quote No',
  invoiceNo: 'Invoice No',
  salesOrderNo: 'Sales Order No',
  purchaseOrderNo: 'Purchase Order No',
  accountNo: 'Account No',
  contactNo: 'Contact No',
  leadNo: 'Lead No',
  productCode: 'Product Code',
  serviceName: 'Service Name',
  roleName: 'Role Name',
  taxName: 'Tax Name',
}

function prettifyField(raw: string): string {
  if (FIELD_LABELS[raw]) return FIELD_LABELS[raw]
  return raw
    .replace(/([A-Z])/g, ' $1')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .trim()
    .replace(/^./, c => c.toUpperCase())
}

function handlePrismaError(err: any): { status: number; message: string } {
  const code = err?.code
  if (code === 'P2002') {
    const target = err?.meta?.target || []
    const field = Array.isArray(target) ? target[0] : String(target || '')
    const label = field ? prettifyField(field) : 'record'
    return { status: 409, message: `Duplicate record — this ${label} already exists` }
  }
  if (code === 'P2003') {
    return { status: 409, message: 'This record is referenced by other records and cannot be modified or deleted' }
  }
  if (code === 'P2025') {
    return { status: 404, message: 'Record not found' }
  }
  return { status: err.status || 500, message: err.message || 'Internal server error' }
}

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error('Error:', err)
  const handled = handlePrismaError(err)
  res.status(handled.status).json({ error: handled.message })
}
