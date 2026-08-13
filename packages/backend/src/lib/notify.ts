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
  const user = await prisma.user.findUnique({ where: { id: assigneeId }, select: { id: true } }).catch(() => null)
  if (user) return [user.id]
  const role = await prisma.role.findFirst({ where: { id: assigneeId, companyId: companyId || undefined }, select: { id: true } }).catch(() => null)
  if (role) {
    const users = await prisma.user.findMany({ where: { roleId: role.id, isActive: true }, select: { id: true } })
    return users.map((u) => u.id)
  }
  const group = await prisma.userGroup.findFirst({ where: { id: assigneeId, companyId: companyId || undefined }, select: { id: true } }).catch(() => null)
  if (group) {
    const members = await prisma.userGroupMember.findMany({ where: { groupId: group.id }, select: { userId: true } })
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
