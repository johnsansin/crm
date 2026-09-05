export type LogLevel = 'log' | 'info' | 'warn' | 'error'

export interface LogEntry {
  ts: string
  level: LogLevel
  msg: string
}

const MAX_ENTRIES = 500
const buffer: LogEntry[] = []

const orig = {
  log: console.log.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
}

function push(level: LogLevel, args: unknown[]) {
  const msg = args
    .map(a => (typeof a === 'string' ? a : typeof a === 'object' ? JSON.stringify(a, null, 0) : String(a)))
    .join(' ')
  buffer.push({ ts: new Date().toISOString(), level, msg })
  if (buffer.length > MAX_ENTRIES) buffer.shift()
}

console.log = (...args: unknown[]) => { push('log', args); orig.log(...args) }
console.info = (...args: unknown[]) => { push('info', args); orig.info(...args) }
console.warn = (...args: unknown[]) => { push('warn', args); orig.warn(...args) }
console.error = (...args: unknown[]) => { push('error', args); orig.error(...args) }

export function getLogs(level?: string, q?: string, limit = 200): LogEntry[] {
  let items = [...buffer]
  if (level && level !== 'all') items = items.filter(l => l.level === level)
  if (q) { const lc = q.toLowerCase(); items = items.filter(l => l.msg.toLowerCase().includes(lc)) }
  return items.slice(-Math.min(limit, MAX_ENTRIES)).reverse()
}

export function clearLogs() {
  buffer.length = 0
}
