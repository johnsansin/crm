import fs from 'fs'
import path from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { getGlobalSetting, setGlobalSetting } from './settings'
import { sendMail } from './mailer'

const execFileAsync = promisify(execFile)
export const BACKUP_SETTING_KEY = 'databaseBackup'
export const BACKUP_DIR = path.resolve(process.cwd(), 'private', 'backups')

export type BackupFrequency = 'daily' | 'weekly' | 'monthly'
export interface DatabaseBackupConfig {
  enabled: boolean
  frequency: BackupFrequency
  hour: number
  minute: number
  dayOfWeek: number
  dayOfMonth: number
  retentionCount: number
  emailEnabled: boolean
  emailTo: string
  nextRunAt: string | null
  lastRunAt: string | null
  lastStatus: 'success' | 'failed' | null
  lastMessage: string | null
  lastFileName: string | null
  lastEmailDelivered: boolean | null
}

export const DEFAULT_BACKUP_CONFIG: DatabaseBackupConfig = {
  enabled: false,
  frequency: 'daily',
  hour: 2,
  minute: 0,
  dayOfWeek: 0,
  dayOfMonth: 1,
  retentionCount: 14,
  emailEnabled: false,
  emailTo: '',
  nextRunAt: null,
  lastRunAt: null,
  lastStatus: null,
  lastMessage: null,
  lastFileName: null,
  lastEmailDelivered: null,
}

export async function getDatabaseBackupConfig(): Promise<DatabaseBackupConfig> {
  const saved = await getGlobalSetting(BACKUP_SETTING_KEY, {})
  return { ...DEFAULT_BACKUP_CONFIG, ...(saved || {}) }
}

export function calculateNextBackup(config: DatabaseBackupConfig, from = new Date()): string | null {
  if (!config.enabled) return null
  const candidate = new Date(from)
  candidate.setUTCSeconds(0, 0)
  candidate.setUTCHours(config.hour, config.minute, 0, 0)
  if (config.frequency === 'daily') {
    if (candidate <= from) candidate.setUTCDate(candidate.getUTCDate() + 1)
  } else if (config.frequency === 'weekly') {
    const days = (config.dayOfWeek - candidate.getUTCDay() + 7) % 7
    candidate.setUTCDate(candidate.getUTCDate() + days)
    if (candidate <= from) candidate.setUTCDate(candidate.getUTCDate() + 7)
  } else {
    candidate.setUTCDate(Math.min(config.dayOfMonth, new Date(Date.UTC(candidate.getUTCFullYear(), candidate.getUTCMonth() + 1, 0)).getUTCDate()))
    if (candidate <= from) {
      candidate.setUTCMonth(candidate.getUTCMonth() + 1, 1)
      const lastDay = new Date(Date.UTC(candidate.getUTCFullYear(), candidate.getUTCMonth() + 1, 0)).getUTCDate()
      candidate.setUTCDate(Math.min(config.dayOfMonth, lastDay))
    }
  }
  return candidate.toISOString()
}

export async function saveDatabaseBackupConfig(input: Partial<DatabaseBackupConfig>): Promise<DatabaseBackupConfig> {
  const current = await getDatabaseBackupConfig()
  const config = { ...current, ...input }
  config.nextRunAt = calculateNextBackup(config)
  await setGlobalSetting(BACKUP_SETTING_KEY, config)
  return config
}

export async function listDatabaseBackups() {
  await fs.promises.mkdir(BACKUP_DIR, { recursive: true, mode: 0o700 })
  const names = await fs.promises.readdir(BACKUP_DIR)
  const files = await Promise.all(names.filter(name => /^bizforce-backup-[\w.-]+\.dump$/.test(name)).map(async fileName => {
    const stat = await fs.promises.stat(path.join(BACKUP_DIR, fileName))
    return { fileName, size: stat.size, modifiedAt: stat.mtime.toISOString() }
  }))
  return files.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt))
}

export function resolveBackupFile(fileName: string): string | null {
  if (path.basename(fileName) !== fileName || !/^bizforce-backup-[\w.-]+\.dump$/.test(fileName)) return null
  return path.join(BACKUP_DIR, fileName)
}

async function enforceRetention(retentionCount: number) {
  const files = await listDatabaseBackups()
  for (const file of files.slice(Math.max(1, retentionCount))) {
    await fs.promises.unlink(path.join(BACKUP_DIR, file.fileName)).catch(() => {})
  }
}

export async function emailDatabaseBackup(fileName: string, emailTo: string) {
  const filePath = resolveBackupFile(fileName)
  if (!filePath || !fs.existsSync(filePath)) throw new Error('Backup file not found')
  const result = await sendMail({
    to: emailTo,
    subject: `BizForce CRM database backup — ${fileName}`,
    text: `The requested BizForce CRM system database backup is attached. Created: ${new Date().toISOString()}`,
    attachments: [{ filename: fileName, path: filePath }],
  })
  if (!result.delivered) throw new Error(result.error || 'SMTP is not configured; backup email was not delivered')
  return result
}

let backupRunning = false
export async function createDatabaseBackup(configOverride?: DatabaseBackupConfig) {
  if (backupRunning) throw new Error('A database backup is already running')
  backupRunning = true
  const startedAt = new Date()
  let tempPath: string | null = null
  let config = configOverride || await getDatabaseBackupConfig()
  try {
    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) throw new Error('DATABASE_URL is not configured')
    await fs.promises.mkdir(BACKUP_DIR, { recursive: true, mode: 0o700 })
    const stamp = startedAt.toISOString().replace(/[:.]/g, '-')
    const fileName = `bizforce-backup-${stamp}.dump`
    const filePath = path.join(BACKUP_DIR, fileName)
    tempPath = `${filePath}.tmp`
    await execFileAsync('pg_dump', ['--dbname', dbUrl, '--no-owner', '--no-privileges', '--format=custom', '--file', tempPath], { timeout: 30 * 60 * 1000 })
    await fs.promises.rename(tempPath, filePath)
    await fs.promises.chmod(filePath, 0o600)
    await enforceRetention(config.retentionCount)
    let emailDelivered: boolean | null = null
    let emailError: string | null = null
    if (config.emailEnabled && config.emailTo) {
      try {
        await emailDatabaseBackup(fileName, config.emailTo)
        emailDelivered = true
      } catch (error: any) {
        emailDelivered = false
        emailError = error?.message || 'Backup email was not delivered'
      }
    }
    config = {
      ...config,
      lastRunAt: startedAt.toISOString(), lastStatus: 'success', lastMessage: emailError ? `Backup created; email failed: ${emailError}` : 'Database backup completed successfully',
      lastFileName: fileName, lastEmailDelivered: emailDelivered,
    }
    config.nextRunAt = calculateNextBackup(config, new Date())
    await setGlobalSetting(BACKUP_SETTING_KEY, config)
    const stat = await fs.promises.stat(filePath)
    return { fileName, size: stat.size, modifiedAt: stat.mtime.toISOString(), emailDelivered, emailError }
  } catch (error: any) {
    if (tempPath) await fs.promises.unlink(tempPath).catch(() => {})
    config = { ...config, lastRunAt: startedAt.toISOString(), lastStatus: 'failed', lastMessage: error?.message || 'Backup failed', lastEmailDelivered: false }
    config.nextRunAt = calculateNextBackup(config, new Date())
    await setGlobalSetting(BACKUP_SETTING_KEY, config).catch(() => {})
    throw error
  } finally {
    backupRunning = false
  }
}

export async function runScheduledDatabaseBackup(): Promise<void> {
  const config = await getDatabaseBackupConfig()
  if (!config.enabled) return
  if (!config.nextRunAt) {
    await saveDatabaseBackupConfig(config)
    return
  }
  if (new Date(config.nextRunAt) <= new Date()) await createDatabaseBackup(config)
}
