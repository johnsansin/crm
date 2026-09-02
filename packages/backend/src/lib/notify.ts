import { prisma } from './prisma'

export async function userName(userId?: string | null): Promise<string> {
  if (!userId) return 'someone'
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { firstName: true, lastName: true, email: true } })
    .catch(() => null)
  if (!u) return 'someone'
  return `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'someone'
}

// The assignee on a record may be a single user, a role (permission group) or a
// user group — resolve it to the set of user ids that should be notified.
export async function resolveAssigneeUserIds(
  assigneeId: string | null | undefined,
  companyId?: string | null,
): Promise<string[]> {
  if (!assigneeId) return []
  const user = await prisma.user.findFirst({ where: { id: assigneeId, companyId: companyId || undefined, isActive: true }, select: { id: true } }).catch(() => null)
  if (user) return [user.id]
  const role = await prisma.role.findFirst({ where: { id: assigneeId, companyId: companyId || undefined }, select: { id: true } }).catch(() => null)
  if (role) {
    const users = await prisma.user.findMany({ where: { roleId: role.id, isActive: true }, select: { id: true } })
    return users.map((u) => u.id)
  }
  const group = await prisma.userGroup.findFirst({ where: { id: assigneeId, companyId: companyId || undefined, isActive: true }, select: { id: true } }).catch(() => null)
  if (group) {
    const members = await prisma.userGroupMember.findMany({ where: { groupId: group.id, user: { isActive: true, companyId: companyId || undefined } }, select: { userId: true } })
    return members.map((m) => m.userId)
  }
  return []
}

// Notify everyone following a record plus everyone the record is assigned to
// (assignee may be a user, a role or a group). The actor is excluded.
export async function notifyFollowersAndAssignee(opts: {
  moduleName: string
  recordId: string
  assigneeId?: string | null
  title: string
  message: string
  link?: string
  companyId?: string | null
  actorId?: string | null
}) {
  const { moduleName, recordId, assigneeId, title, message, link, companyId, actorId } = opts
  const recipients = new Set<string>()

  const follows = await prisma.follow.findMany({ where: { moduleName, recordId }, select: { userId: true } })
  for (const f of follows) recipients.add(f.userId)

  for (const id of await resolveAssigneeUserIds(assigneeId, companyId)) recipients.add(id)

  if (actorId) recipients.delete(actorId)
  if (!recipients.size) return

  for (const userId of recipients) {
    await prisma.notification.create({
      data: { userId, title, message, link: link || null, companyId: companyId || undefined },
    }).catch(() => {})
  }
}

export async function notifyEscalation(ticketId: string, fromLevel: number, toLevel: number, reason: string): Promise<void> {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId }, select: { title: true, ticketNo: true, companyId: true, assignedTo: true } })
  if (!ticket) return

  await prisma.escalationHistory.create({
    data: {
      ticketId,
      fromLevel,
      toLevel,
      reason,
      companyId: ticket.companyId,
    },
  }).catch(() => {})

  if (ticket.assignedTo) {
    await prisma.notification.create({
      data: {
        userId: ticket.assignedTo,
        title: `Ticket Escalated: ${ticket.ticketNo || ticket.title}`,
        message: `Ticket "${ticket.title}" has been escalated from level ${fromLevel} to ${toLevel}. Reason: ${reason}`,
        link: `/tickets/${ticketId}`,
        companyId: ticket.companyId,
      },
    }).catch(() => {})
  }

  const managers = await prisma.user.findMany({
    where: { companyId: ticket.companyId, isAdmin: true, isActive: true },
    select: { id: true },
  })
  for (const mgr of managers) {
    if (mgr.id === ticket.assignedTo) continue
    await prisma.notification.create({
      data: {
        userId: mgr.id,
        title: `Ticket Escalated: ${ticket.ticketNo || ticket.title}`,
        message: `Ticket "${ticket.title}" has been escalated from level ${fromLevel} to ${toLevel}. Reason: ${reason}`,
        link: `/tickets/${ticketId}`,
        companyId: ticket.companyId,
      },
    }).catch(() => {})
  }
}

export async function notifySLABreach(ticketId: string): Promise<void> {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId }, select: { title: true, ticketNo: true, companyId: true, assignedTo: true } })
  if (!ticket) return

  if (ticket.assignedTo) {
    await prisma.notification.create({
      data: {
        userId: ticket.assignedTo,
        title: `SLA Breach: ${ticket.ticketNo || ticket.title}`,
        message: `Ticket "${ticket.title}" has breached its SLA deadline. Immediate action required.`,
        link: `/tickets/${ticketId}`,
        companyId: ticket.companyId,
      },
    }).catch(() => {})

    const assignee = await prisma.user.findUnique({ where: { id: ticket.assignedTo }, select: { roleId: true } })
    if (assignee?.roleId) {
      const managers = await prisma.user.findMany({
        where: { roleId: assignee.roleId, companyId: ticket.companyId, isActive: true, id: { not: ticket.assignedTo } },
        select: { id: true },
      })
      for (const mgr of managers) {
        await prisma.notification.create({
          data: {
            userId: mgr.id,
            title: `SLA Breach: ${ticket.ticketNo || ticket.title}`,
            message: `Ticket "${ticket.title}" assigned to your team has breached its SLA deadline.`,
            link: `/tickets/${ticketId}`,
            companyId: ticket.companyId,
          },
        }).catch(() => {})
      }
    }
  }
}

export async function createBulkNotifications(
  userIds: string[],
  title: string,
  message: string,
  link: string | null,
  companyId: string | null,
): Promise<number> {
  let count = 0
  for (const userId of userIds) {
    await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        link: link || null,
        companyId: companyId || undefined,
      },
    }).catch(() => { count++ })
    count++
  }
  return count
}
