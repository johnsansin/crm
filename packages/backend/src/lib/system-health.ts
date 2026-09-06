import fs from 'fs'
import os from 'os'
import http from 'http'
import { prisma } from './prisma'

const HOST_PROC = fs.existsSync('/host/proc') ? '/host/proc' : '/proc'
const HOST_ROOT = fs.existsSync('/host') ? '/host' : '/'
const DOCKER_SOCKET = '/var/run/docker.sock'

function readFileSafe(p: string): string {
  try { return fs.readFileSync(p, 'utf8') } catch { return '' }
}

function kilobytes(str: string): number {
  const m = /^(\d+) kB/.exec(str.trim())
  return m ? Number(m[1]) * 1024 : 0
}

// Parse /proc/<pid>/stat: comm may contain parentheses, so split after the last ')'
function parseStat(line: string): { pid: string; comm: string; fields: string[] } | null {
  try {
    const close = line.lastIndexOf(')')
    if (close === -1) return null
    const pid = line.slice(0, line.indexOf('(')).trim()
    const comm = line.slice(line.indexOf('(') + 1, close)
    const fields = line.slice(close + 2).split(' ')
    return { pid, comm, fields }
  } catch { return null }
}

function pctFromTicks(procTicks: number, uptimeTicks: number): number {
  if (!uptimeTicks) return 0
  return Math.min(100, Math.round((procTicks / uptimeTicks) * 1000) / 10)
}

function dockerApi(path: string, method = 'GET'): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(DOCKER_SOCKET)) return reject(new Error('docker socket unavailable'))
    const req = http.request(
      { socketPath: DOCKER_SOCKET, path, method, headers: { Host: 'localhost' } },
      res => {
        const chunks: Buffer[] = []
        res.on('data', c => chunks.push(c))
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8')
          if (res.statusCode && res.statusCode >= 400) {
            return reject(new Error(`docker ${res.statusCode}: ${body.slice(0, 200)}`))
          }
          try { resolve(body ? JSON.parse(body) : {}) } catch { resolve({}) }
        })
      }
    )
    req.on('error', reject)
    req.setTimeout(3000, () => req.destroy(new Error('docker timeout')))
    req.end()
  })
}

async function collectDocker() {
  try {
    const containers = await dockerApi('/containers/json?all=1')
    const df = await dockerApi('/system/df').catch(() => null)

    const list = (Array.isArray(containers) ? containers : []).slice(0, 12)
    const items = await Promise.all(
      list.map(async (c: any) => {
        let memUse = 0
        let memLimit = 0
        let cpuPct = 0
        try {
          const s = await dockerApi(`/containers/${c.Id}/stats?stream=false&one-shot=true`)
          const mem = s?.memory_stats || {}
          memUse = mem.usage || 0
          memLimit = mem.limit || 0
          const cpu = s?.cpu_stats || {}
          const pre = s?.precpu_stats || {}
          const delta = (cpu.cpu_usage?.total_usage || 0) - (pre.cpu_usage?.total_usage || 0)
          const sysDelta = (cpu.system_cpu_usage || 0) - (pre.system_cpu_usage || 0)
          const onlineCpus = cpu.online_cpus || os.cpus().length || 1
          cpuPct = sysDelta > 0 && delta > 0 ? Math.round((delta / sysDelta) * onlineCpus * 1000) / 10 : 0
        } catch { /* per-container stats are best-effort */ }
        return {
          id: String(c.Id || '').slice(0, 12),
          name: (c.Names?.[0] || c.Name || '').replace(/^\//, ''),
          image: c.Image || '',
          state: c.State || '',
          status: c.Status || '',
          memUseB: memUse,
          memLimitB: memLimit,
          cpuPct,
        }
      })
    )

    let buildCacheSize = 0
    if (df && Array.isArray(df.BuildCache)) {
      for (const b of df.BuildCache) if (typeof b.Size === 'number') buildCacheSize += b.Size
    }

    return {
      available: true,
      containers: items,
      layersSizeB: df?.LayersSize || 0,
      buildCacheSizeB: buildCacheSize,
    }
  } catch (err: any) {
    return { available: false, reason: String(err?.message || 'unknown'), containers: [], layersSizeB: 0, buildCacheSizeB: 0 }
  }
}

async function collectProcesses(uptimeSec: number) {
  const tickHZ = 100
  const uptimeTicks = uptimeSec * tickHZ
  const procs: any[] = []
  let zombies = 0
  let dir: string[] = []
  try { dir = fs.readdirSync(HOST_PROC) } catch { }
  for (const entry of dir) {
    if (!/^\d+$/.test(entry)) continue
    const stat = readFileSafe(`${HOST_PROC}/${entry}/stat`)
    const parsed = parseStat(stat)
    if (!parsed) continue
    const state = parsed.fields[0] || '?'
    if (state === 'Z') zombies++
    const utime = Number(parsed.fields[13] || 0)
    const stime = Number(parsed.fields[14] || 0)
    const totalTicks = utime + stime
    const cmdline = readFileSafe(`${HOST_PROC}/${entry}/cmdline`).replace(/\0/g, ' ').trim()
    const statm = readFileSafe(`${HOST_PROC}/${entry}/statm`).split(' ')
    const rssPages = Number(statm[1] || 0)
    procs.push({
      pid: entry,
      comm: parsed.comm,
      state,
      cpuPct: pctFromTicks(totalTicks, uptimeTicks),
      rssB: rssPages * 4096,
      cmd: cmdline || parsed.comm,
    })
  }
  return {
    zombieCount: zombies,
    total: procs.length,
    top: procs
      .slice()
      .sort((a, b) => (b.cpuPct - a.cpuPct) || (b.rssB - a.rssB))
      .slice(0, 10),
    topMem: procs.slice().sort((a, b) => b.rssB - a.rssB).slice(0, 5),
  }
}

export async function collectSystemHealth() {
  const now = Date.now()
  let uptimeSec = 0
  try { uptimeSec = Number(readFileSafe(`${HOST_PROC}/uptime`).split(' ')[0] || 0) } catch { }

  const loadTxt = readFileSafe(`${HOST_PROC}/loadavg`).split(' ')
  const loadavg = loadTxt.length >= 3 ? [Number(loadTxt[0]), Number(loadTxt[1]), Number(loadTxt[2])] : [0, 0, 0]

  const memRaw = readFileSafe(`${HOST_PROC}/meminfo`)
  const mem: any = {}
  for (const key of ['MemTotal', 'MemFree', 'MemAvailable', 'Buffers', 'Cached', 'SwapTotal', 'SwapFree', 'SReclaimable']) {
    const m = memRaw.match(new RegExp(`^${key}:\\s+(\\d+) kB`, 'm'))
    mem[key] = m ? Number(m[1]) * 1024 : 0
  }

  let disk: any = { totalB: 0, usedB: 0, freeB: 0, availableB: 0, mount: HOST_ROOT }
  try {
    const s = fs.statfsSync(HOST_ROOT)
    disk = {
      totalB: s.blocks * s.bsize,
      usedB: (s.blocks - s.bfree) * s.bsize,
      freeB: s.bavail * s.bsize,
      availableB: s.bavail * s.bsize,
      mount: HOST_ROOT,
    }
  } catch { }

  let hostname = os.hostname()
  const hostHostname = readFileSafe('/host/proc/sys/kernel/hostname').trim()
  if (hostHostname) hostname = hostHostname

  const fin = collectProcesses(uptimeSec)
  const dockerFin = collectDocker()

  let dbLatency = 0
  let dbOk = false
  try {
    const t0 = Date.now()
    await prisma.$queryRaw`SELECT 1`
    dbLatency = Date.now() - t0
    dbOk = true
  } catch { }

  const processes = await fin
  const docker = await dockerFin

  const memUsed = mem.MemTotal ? Math.max(0, mem.MemTotal - mem.MemFree - mem.Buffers - mem.Cached - (mem.SReclaimable || 0)) : 0

  return {
    now: new Date(now).toISOString(),
    system: {
      hostname,
      platform: os.platform(),
      arch: os.arch(),
      osRelease: readFileSafe('/host/proc/sys/kernel/osrelease').trim() || os.release(),
      cpus: os.cpus().length,
      uptimeSec: Math.round(uptimeSec),
      loadavg,
      zombieCount: processes.zombieCount,
      processCount: processes.total,
      hostProc: HOST_PROC,
    },
    memory: {
      totalB: mem.MemTotal,
      freeB: mem.MemFree,
      availableB: mem.MemAvailable,
      usedB: memUsed,
      bufferedCached: mem.Buffers + mem.Cached + (mem.SReclaimable || 0),
      swapTotalB: mem.SwapTotal,
      swapFreeB: mem.SwapFree,
    },
    disk,
    topProcesses: {
      byCpu: processes.top,
      byMem: processes.topMem,
    },
    docker,
    app: {
      pid: process.pid,
      uptimeSec: Math.round(process.uptime()),
      nodeVersion: process.version,
      cwd: process.cwd(),
      mem: process.memoryUsage(),
    },
    db: { ok: dbOk, latencyMs: dbLatency },
  }
}