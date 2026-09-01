import fs from 'fs'
import path from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { getGlobalSetting, setGlobalSetting } from './settings'
import { sendMail } from './mailer'

const execFileAsync = promisify(execFile)
export const BACKUP_SETTING_KEY = 'databaseBackup'
export const BACKUP_DIR = path.resolve(process.cwd(), 'private', 'backups')
const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads')
const ENV_PATH = path.resolve(process.cwd(), '.env')
const PRISMA_SCHEMA_PATH = path.resolve(process.cwd(), 'prisma', 'schema.prisma')
const PACKAGE_JSON_PATH = path.resolve(process.cwd(), 'package.json')
export const BACKUP_FILE_PATTERN = /^bizforce-backup-[\w.-]+(\.tar\.gz|\.dump)$/

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
  const files = await Promise.all(names.filter(name => BACKUP_FILE_PATTERN.test(name)).map(async fileName => {
    const stat = await fs.promises.stat(path.join(BACKUP_DIR, fileName))
    return { fileName, size: stat.size, modifiedAt: stat.mtime.toISOString() }
  }))
  return files.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt))
}

export function resolveBackupFile(fileName: string): string | null {
  if (path.basename(fileName) !== fileName || !BACKUP_FILE_PATTERN.test(fileName)) return null
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
    subject: `BizForce CRM full system backup — ${fileName}`,
    text: `The requested BizForce CRM full system backup is attached (database, uploaded files and configuration). Created: ${new Date().toISOString()}`,
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
  let stagingDir: string | null = null
  let config = configOverride || await getDatabaseBackupConfig()
  try {
    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) throw new Error('DATABASE_URL is not configured')
    await fs.promises.mkdir(BACKUP_DIR, { recursive: true, mode: 0o700 })
    const stamp = startedAt.toISOString().replace(/[:.]/g, '-')
    const fileName = `bizforce-backup-${stamp}.tar.gz`
    const filePath = path.join(BACKUP_DIR, fileName)
    tempPath = `${filePath}.tmp`
    stagingDir = path.join(BACKUP_DIR, `.staging-${stamp}`)
    await fs.promises.mkdir(stagingDir, { recursive: true, mode: 0o700 })

    await fs.promises.mkdir(path.join(stagingDir, 'database'), { recursive: true })
    await execFileAsync('pg_dump', ['--dbname', dbUrl, '--no-owner', '--no-privileges', '--format=custom', '--file', path.join(stagingDir, 'database', 'postgres.dump')], { timeout: 30 * 60 * 1000 })

    if (fs.existsSync(UPLOAD_DIR)) {
      await fs.promises.cp(UPLOAD_DIR, path.join(stagingDir, 'uploads'), {
        recursive: true,
        filter: src => path.basename(src) !== 'backups',
      })
    }

    await fs.promises.mkdir(path.join(stagingDir, 'config'), { recursive: true })
    if (fs.existsSync(ENV_PATH)) await fs.promises.copyFile(ENV_PATH, path.join(stagingDir, 'config', 'env'))
    if (fs.existsSync(PRISMA_SCHEMA_PATH)) await fs.promises.copyFile(PRISMA_SCHEMA_PATH, path.join(stagingDir, 'config', 'schema.prisma'))

    const entries = (await fs.promises.readdir(stagingDir)).filter(name => !name.startsWith('.'))
    let appVersion: string | null = null
    try { appVersion = JSON.parse(await fs.promises.readFile(PACKAGE_JSON_PATH, 'utf-8'))?.version || null } catch { appVersion = null }
    const manifest = {
      kind: 'bizforce-full-system-backup',
      appVersion,
      createdAt: startedAt.toISOString(),
      contents: [...entries, 'manifest.json'],
    }
    entries.push('manifest.json')
    await fs.promises.writeFile(path.join(stagingDir, 'manifest.json'), JSON.stringify(manifest, null, 2))

    await execFileAsync('tar', ['-czf', tempPath, '-C', stagingDir, ...entries], { timeout: 30 * 60 * 1000 })
    await fs.promises.rename(tempPath, filePath)
    tempPath = null
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
      lastRunAt: startedAt.toISOString(), lastStatus: 'success', lastMessage: emailError ? `Backup created; email failed: ${emailError}` : 'Full system backup completed successfully',
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
    if (stagingDir) await fs.promises.rm(stagingDir, { recursive: true, force: true }).catch(() => {})
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
