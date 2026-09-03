import { prisma } from './prisma'
import { runScheduledTaskActions } from './settings'
import { runRecurringInvoices, fetchAllRssFeeds, syncAllMailboxes, sendPaymentReminders, checkSLADeadlines, checkFollowUpReminders, checkOverdueInvoices, checkAssetMaintenance, checkProjectHealth } from './automation'
import { runScheduledReports } from './report-runner'
import { runScheduledDatabaseBackup } from './database-backup'

function nextRunFor(frequency: string): Date {
  const d = new Date(Date.now() + 60 * 1000)
  switch (frequency) {
    case 'hourly': d.setHours(d.getHours() + 1); break
    case 'daily': d.setDate(d.getDate() + 1); d.setHours(0, 0, 0, 0); break
    case 'weekly': d.setDate(d.getDate() + 7); d.setHours(0, 0, 0, 0); break
    case 'monthly': d.setMonth(d.getMonth() + 1); d.setDate(1); d.setHours(0, 0, 0, 0); break
    default: d.setMinutes(d.getMinutes() + 5)
  }
  return d
}

let running = false

let lastSlaCheck = 0
let lastFollowUpCheck = 0
let lastOverdueInvoiceCheck = 0
let lastAssetMaintenanceCheck = 0
let lastProjectHealthCheck = 0
let lastSubscriptionNoticeCheck = 0

async function sendSubscriptionLifecycleNotifications(now: Date) {
  const warningCutoff = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const companies = await prisma.company.findMany({
    where: {
      isActive: true,
      OR: [
        { trialEndsAt: { lte: warningCutoff } },
        { subscriptionEndsAt: { lte: warningCutoff } },
      ],
    },
    select: { id: true, trialEndsAt: true, subscriptionEndsAt: true, subscriptionStatus: true },
  })
  for (const company of companies) {
    const admins = await prisma.user.findMany({ where: { companyId: company.id, isAdmin: true, isActive: true }, select: { id: true } })
    if (!admins.length) continue
    const notices: Array<{ title: string; message: string }> = []
    const addNotice = (kind: 'Trial' | 'Subscription', endsAt: Date) => {
      const ended = endsAt.getTime() <= now.getTime()
      const dateLabel = endsAt.toISOString().slice(0, 10)
      const days = Math.max(1, Math.ceil((endsAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)))
      notices.push(ended
        ? { title: `${kind} ended`, message: `Your organisation ${kind.toLowerCase()} ended on ${dateLabel}. Review the subscription settings to restore or update access.` }
        : { title: `${kind} ends soon`, message: `Your organisation ${kind.toLowerCase()} ends in ${days} day${days === 1 ? '' : 's'} on ${dateLabel}. Review the subscription settings to avoid interruption.` })
    }
    if (company.trialEndsAt && company.subscriptionStatus === 'TRIAL') addNotice('Trial', company.trialEndsAt)
    if (company.subscriptionEndsAt && company.subscriptionStatus !== 'TRIAL') addNotice('Subscription', company.subscriptionEndsAt)
    for (const notice of notices) {
      for (const admin of admins) {
        const exists = await prisma.notification.findFirst({ where: { userId: admin.id, title: notice.title, message: notice.message }, select: { id: true } })
        if (!exists) await prisma.notification.create({ data: { userId: admin.id, companyId: company.id, ...notice, link: '/settings?section=subscription' } })
      }
    }
  }
}

async function sendActivityReminders(now: Date) {
  const activities = await prisma.activity.findMany({ where: { isActive: true, reminderAt: { lte: now }, reminderSentAt: null, OR: [{ assignedTo: { not: null } }, { assignedGroupId: { not: null } }], status: { notIn: ['Completed', 'Held', 'Cancelled'] } }, take: 100 })
  for (const activity of activities) {
    const claimed = await prisma.activity.updateMany({ where: { id: activity.id, reminderSentAt: null }, data: { reminderSentAt: now } })
    if (!claimed.count) continue
    const isTodo = activity.activityType === 'Task'
    let userIds = activity.assignedTo ? [activity.assignedTo] : []
    if (activity.assignedGroupId) {
      const members = await prisma.userGroupMember.findMany({ where: { groupId: activity.assignedGroupId, user: { isActive: true } }, select: { userId: true } })
      userIds = members.map(member => member.userId)
    }
    if (userIds.length) await prisma.notification.createMany({ data: userIds.map(userId => ({ userId, companyId: activity.companyId, title: isTodo ? 'To-Do reminder' : 'Calendar reminder', message: activity.subject, link: isTodo ? '/activities' : '/calendar' })) }).catch(() => {})
  }
}

export async function runDueTasks(): Promise<void> {
  if (running) return
  running = true
  try {
    const now = new Date()
    await sendActivityReminders(now)
    const tasks = await prisma.scheduledTask.findMany({
      where: { isActive: true, OR: [{ nextRun: { lte: now } }, { nextRun: null }] },
      take: 50,
    })
    for (const task of tasks) {
      const taskStart = Date.now()
      try {
        await runScheduledTaskActions(task)
        await prisma.scheduledTask.update({
          where: { id: task.id },
          data: { lastRun: now, nextRun: nextRunFor(task.frequency), runCount: { increment: 1 }, lastError: null },
        })
      } catch (err: any) {
        console.error('[CRON] task failed:', task.name, err)
        await prisma.scheduledTask.update({
          where: { id: task.id },
          data: { lastRun: now, nextRun: nextRunFor(task.frequency), lastError: err?.message || String(err) },
        }).catch(() => {})
      }
    }
  } catch (err) {
    console.error('[CRON] scan failed:', err)
  } finally {
    running = false
  }

  // Feature automation passes
  runRecurringInvoices().catch(() => {})
  fetchAllRssFeeds().catch(() => {})
  syncAllMailboxes().catch(() => {})
  sendPaymentReminders().catch(() => {})
  runScheduledReports().catch(() => {})
  runScheduledDatabaseBackup().catch(err => console.error('[CRON] database backup failed:', err?.message || err))

  // Automated monitoring tasks
  const now = Date.now()
  if (now - lastSlaCheck >= 5 * 60 * 1000) {
    lastSlaCheck = now
    checkSLADeadlines().catch(() => {})
  }
  if (now - lastFollowUpCheck >= 60 * 60 * 1000) {
    lastFollowUpCheck = now
    checkFollowUpReminders().catch(() => {})
  }
  if (now - lastOverdueInvoiceCheck >= 24 * 60 * 60 * 1000) {
    lastOverdueInvoiceCheck = now
    checkOverdueInvoices().catch(() => {})
  }
  if (now - lastAssetMaintenanceCheck >= 24 * 60 * 60 * 1000) {
    lastAssetMaintenanceCheck = now
    checkAssetMaintenance().catch(() => {})
  }
  if (now - lastProjectHealthCheck >= 24 * 60 * 60 * 1000) {
    lastProjectHealthCheck = now
    checkProjectHealth().catch(() => {})
  }
  if (now - lastSubscriptionNoticeCheck >= 6 * 60 * 60 * 1000) {
    lastSubscriptionNoticeCheck = now
    sendSubscriptionLifecycleNotifications(new Date()).catch(err => console.error('[CRON] subscription notification check failed:', err?.message || err))
  }
}

export function startCron(): NodeJS.Timeout {
  const timer = setInterval(() => { runDueTasks().catch(() => {}) }, 60 * 1000)
  timer.unref()
  runDueTasks().catch(() => {})
  return timer
}
