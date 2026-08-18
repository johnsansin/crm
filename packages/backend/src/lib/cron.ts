import { prisma } from './prisma'
import { runScheduledTaskActions } from './settings'
import { runRecurringInvoices, fetchAllRssFeeds, syncAllMailboxes, sendPaymentReminders, checkSLADeadlines, checkFollowUpReminders, checkOverdueInvoices, checkAssetMaintenance, checkProjectHealth } from './automation'
import { runScheduledReports } from './report-runner'

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

export async function runDueTasks(): Promise<void> {
  if (running) return
  running = true
  try {
    const now = new Date()
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
}

export function startCron(): NodeJS.Timeout {
  const timer = setInterval(() => { runDueTasks().catch(() => {}) }, 60 * 1000)
  timer.unref()
  runDueTasks().catch(() => {})
  return timer
}
