import { NextFunction, Request, Response } from 'express'
import { prisma } from './prisma'

export const PERMISSION_MODULES = [
  'dashboard', 'calendar', 'accounts', 'contacts', 'leads', 'potentials', 'campaigns',
  'products', 'services', 'vendors', 'pricebooks', 'quotes', 'salesorders',
  'purchaseorders', 'invoices', 'tickets', 'faq', 'documents', 'emails',
  'emailtemplates', 'projects', 'projecttasks', 'projectmilestones', 'assets',
  'servicecontracts', 'smsnotifier', 'receipts', 'payments', 'recurringinvoices',
  'calllogs', 'reports', 'mailboxes', 'rssfeeds', 'timeentries', 'projectresources', 'chat', 'ai', 'landingpages',
  'social', 'webhooks',
] as const

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'import' | 'export'

function actionForMethod(method: string): PermissionAction {
  if (method === 'GET' || method === 'HEAD') return 'view'
  if (method === 'POST') return 'create'
  if (method === 'DELETE') return 'delete'
  return 'edit'
}

/** Business data always belongs to an organization, including for superadmins. */
export function requireTenant(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.companyId) return res.status(403).json({ error: 'Select an organization before accessing business data' })
  next()
}

export function requireModulePermission(moduleName: string, fixedAction?: PermissionAction) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.companyId) return res.status(403).json({ error: 'Organization access required' })
      if (req.user.isAdmin) return next()
      if (!req.user.roleId) return res.status(403).json({ error: 'No active role assigned' })
      const action = fixedAction || actionForMethod(req.method)
      const permission = await prisma.rolePermission.findFirst({
        where: {
          roleId: req.user.roleId,
          moduleName,
          role: { companyId: req.user.companyId, isActive: true },
        },
      })
      if (!permission?.[action]) return res.status(403).json({ error: `${action} permission required for ${moduleName}` })
      next()
    } catch (err) {
      next(err)
    }
  }
}
