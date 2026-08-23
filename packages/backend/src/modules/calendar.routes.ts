import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'
import { requireModulePermission } from '../lib/module-permissions'

export const calendarRouter = Router()
calendarRouter.use(authMiddleware)
calendarRouter.use(requireModulePermission('calendar'))

function addScope(where: any, companyId?: string): any {
  if (companyId) where.companyId = companyId
  else where.companyId = null
  return where
}

function toDate(v: any): Date | null {
  if (!v) return null
  const d = new Date(v)
  return isNaN(d.getTime()) ? null : d
}

// Range list: /api/calendar?from=&to=
calendarRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { from, to } = req.query
    const fromDate = toDate(from)
    const toDateV = toDate(to)
    const where: any = { isActive: true }
    addScope(where, req.user!.companyId)
    if (req.query.kind === 'todo') where.activityType = 'Task'
    if (req.query.kind === 'event') where.activityType = { not: 'Task' }
    if (fromDate || toDateV) {
      const conditions: any[] = []
      if (fromDate && toDateV) {
        conditions.push({ startAt: { gte: fromDate, lte: toDateV } })
        conditions.push({ dueAt: { gte: fromDate, lte: toDateV } })
      } else if (fromDate) {
        conditions.push({ startAt: { gte: fromDate } })
        conditions.push({ dueAt: { gte: fromDate } })
      } else if (toDateV) {
        conditions.push({ startAt: { lte: toDateV } })
        conditions.push({ dueAt: { lte: toDateV } })
      }
      where.OR = conditions
    }
    const data = await prisma.activity.findMany({ where, orderBy: [{ startAt: 'asc' }, { dueAt: 'asc' }, { createdAt: 'asc' }] })
    res.json({ data })
  } catch (err) { next(err) }
})

// Upcoming activities: /api/calendar/upcoming?limit=5
calendarRouter.get('/upcoming', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit || '5')), 20)
    const now = new Date()
    const where: any = { isActive: true }
    addScope(where, req.user!.companyId)
    const data = await prisma.activity.findMany({
      where: {
        ...where,
        OR: [{ startAt: { gte: now } }, { startAt: null, dueAt: { gte: now } }],
      },
      orderBy: [{ startAt: 'asc' }, { dueAt: 'asc' }],
      take: limit,
    })
    res.json({ data })
  } catch (err) { next(err) }
})

calendarRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subject, description, activityType, status, priority, location, startAt, endAt, dueAt, reminderAt, assignedTo, assignedGroupId } = req.body
    if (!subject) return res.status(400).json({ error: 'Subject is required' })
    const type = activityType || 'Task'
    if (type === 'Task' && !dueAt) return res.status(400).json({ error: 'A To-Do requires a due date' })
    if (type !== 'Task' && (!startAt || !endAt)) return res.status(400).json({ error: 'A calendar event requires start and end times' })
    if (type !== 'Task' && new Date(endAt) <= new Date(startAt)) return res.status(400).json({ error: 'Event end time must be after its start time' })
    let ownerId: string | null = req.user!.userId
    let groupId: string | null = null
    if (assignedGroupId) {
      const group = await prisma.userGroup.findFirst({ where: { id: assignedGroupId, companyId: req.user!.companyId, isActive: true }, select: { id: true } })
      if (!group) return res.status(400).json({ error: 'Assigned group is not active in this organisation' })
      groupId = group.id; ownerId = null
    }
    if (assignedTo) {
      const owner = await prisma.user.findFirst({ where: { id: assignedTo, companyId: req.user!.companyId, isActive: true }, select: { id: true } })
      if (!owner) return res.status(400).json({ error: 'Assigned user is not active in this organisation' })
      ownerId = owner.id
    }
    const activity = await prisma.activity.create({
      data: {
        subject,
        description,
        activityType: type,
        status: status || (activityType === 'Task' ? 'Planned' : 'Planned'),
        priority: priority || 'Medium',
        location,
        startAt: toDate(startAt),
        endAt: toDate(endAt),
        dueAt: toDate(dueAt),
        reminderAt: toDate(reminderAt),
        companyId: req.user!.companyId ?? null,
        assignedTo: ownerId,
        assignedGroupId: groupId,
        createdBy: req.user!.userId,
      },
    })
    res.status(201).json(activity)
  } catch (err) { next(err) }
})

calendarRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subject, description, activityType, status, priority, location, startAt, endAt, dueAt, reminderAt, assignedTo, assignedGroupId } = req.body
    const existing = await prisma.activity.findFirst({ where: { id: req.params.id } })
    if (!existing) return res.status(404).json({ error: 'Not found' })
    if (existing.companyId !== (req.user!.companyId ?? null)) return res.status(403).json({ error: 'Access denied' })
    if (assignedTo) {
      const owner = await prisma.user.findFirst({ where: { id: assignedTo, companyId: req.user!.companyId, isActive: true }, select: { id: true } })
      if (!owner) return res.status(400).json({ error: 'Assigned user is not active in this organisation' })
    }
    if (assignedGroupId) {
      const group = await prisma.userGroup.findFirst({ where: { id: assignedGroupId, companyId: req.user!.companyId, isActive: true }, select: { id: true } })
      if (!group) return res.status(400).json({ error: 'Assigned group is not active in this organisation' })
    }
    const activity = await prisma.activity.update({
      where: { id: req.params.id },
      data: {
        subject: subject ?? existing.subject,
        description: description ?? existing.description,
        activityType: activityType ?? existing.activityType,
        status: status ?? existing.status,
        priority: priority ?? existing.priority,
        location: location ?? existing.location,
        startAt: startAt !== undefined ? toDate(startAt) : existing.startAt,
        endAt: endAt !== undefined ? toDate(endAt) : existing.endAt,
        dueAt: dueAt !== undefined ? toDate(dueAt) : existing.dueAt,
        reminderAt: reminderAt !== undefined ? toDate(reminderAt) : existing.reminderAt,
        reminderSentAt: reminderAt !== undefined ? null : existing.reminderSentAt,
        assignedTo: assignedGroupId ? null : (assignedTo ?? existing.assignedTo),
        assignedGroupId: assignedTo ? null : (assignedGroupId ?? existing.assignedGroupId),
      },
    })
    res.json(activity)
  } catch (err) { next(err) }
})

calendarRouter.get('/users/active', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [data, groups] = await Promise.all([
      prisma.user.findMany({ where: { companyId: req.user!.companyId, isActive: true, isAgent: false }, select: { id: true, firstName: true, lastName: true, email: true }, orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }] }),
      prisma.userGroup.findMany({ where: { companyId: req.user!.companyId, isActive: true }, select: { id: true, name: true, _count: { select: { members: true } } }, orderBy: { name: 'asc' } }),
    ])
    res.json({ data, groups })
  } catch (err) { next(err) }
})

calendarRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.activity.findFirst({ where: { id: req.params.id } })
    if (!existing) return res.status(404).json({ error: 'Not found' })
    if (existing.companyId !== (req.user!.companyId ?? null)) return res.status(403).json({ error: 'Access denied' })
    await prisma.activity.update({ where: { id: req.params.id }, data: { isActive: false } })
    res.json({ success: true })
  } catch (err) { next(err) }
})
