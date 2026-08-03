import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { runWorkflows } from '../lib/settings'
import { getModuleConfig } from './moduleSetup'

export const webformRouter = Router()

webformRouter.post('/:token/submit', async (req, res, next) => {
  try {
    const { token } = req.params
    const webform = await prisma.webform.findUnique({ where: { token } })
    if (!webform || !webform.isActive) return res.status(404).json({ error: 'Webform not found' })
    const company = await prisma.company.findUnique({ where: { id: webform.companyId || '' } })
    if (company && !company.isActive) return res.status(403).json({ error: 'Form is unavailable' })

    const config = getModuleConfig(webform.moduleName)
    if (!config) return res.status(400).json({ error: 'Invalid webform module' })
    const model = (prisma as any)[config.modelName]
    if (!model) return res.status(400).json({ error: 'Invalid webform module' })

    const fields: any[] = (webform.fields as any[]) || []
    const submitted = req.body || {}
    const data: any = {}
    for (const field of fields) {
      const value = submitted[field.name]
      if (value == null || value === '') {
        if (field.required) return res.status(400).json({ error: `Field "${field.label || field.name}" is required` })
        continue
      }
      if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) data[field.name] = new Date(String(value) + 'T12:00:00').toISOString()
      else if (field.type === 'number') data[field.name] = Number(value)
      else if (field.type === 'email') data[field.name] = String(value)
      else data[field.name] = String(value)
    }
    if (!webform.companyId) return res.status(400).json({ error: 'Webform has no company' })
    data.companyId = webform.companyId

    const record = await model.create({ data })
    await runWorkflows({ companyId: webform.companyId, moduleName: webform.moduleName, triggerType: 'onCreate', record })

    res.status(201).json({ success: true, message: webform.successMessage || 'Thank you, your submission has been received.' })
  } catch (err) { next(err) }
})
