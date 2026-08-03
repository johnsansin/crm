import { prisma } from './prisma'
import { runScheduledTaskActions } from './settings'

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
      try {
        await runScheduledTaskActions(task)
      } catch (err) {
        console.error('[CRON] task failed:', task.name, err)
      }
      await prisma.scheduledTask.update({
        where: { id: task.id },
        data: { lastRun: now, nextRun: nextRunFor(task.frequency) },
      })
    }
  } catch (err) {
    console.error('[CRON] scan failed:', err)
  } finally {
    running = false
  }
}

export function startCron(): NodeJS.Timeout {
  const timer = setInterval(() => { runDueTasks().catch(() => {}) }, 60 * 1000)
  timer.unref()
  runDueTasks().catch(() => {})
  return timer
}
