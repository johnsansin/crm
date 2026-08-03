const git = require('isomorphic-git')
const fs = require('fs')
const path = require('path')
const http = require('isomorphic-git/http/node')

const DIR = '/home/ubuntu/crm'
const token = process.argv[2]
const REPO_URL = 'https://github.com/johnsansin/crm.git'

const ignoreDirs = new Set(['node_modules', '.git', 'uploads'])
const ignoreFiles = new Set(['.env', '.DS_Store', '.spc.cache.php'])
const ignoreExact = new Set(['tsconfig.tsbuildinfo'])
const skipPrefix = ['dist/']

const ignores = fs.readFileSync(path.join(DIR, '.gitignore'), 'utf8')
  .split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'))

function isIgnored(rel) {
  const parts = rel.split('/')
  for (const f of ignoreFiles) if (parts.includes(f)) return true
  for (const d of ignoreDirs) if (parts.includes(d)) return true
  if (ignoreExact.has(parts[parts.length - 1])) return true
  for (const s of skipPrefix) if (rel.startsWith(s)) return true
  for (const ig of ignores) {
    if (ig.startsWith('*') && ig.endsWith('*')) {
      if (rel.includes(ig.slice(1, -1))) return true
    } else if (ig.startsWith('*')) {
      if (rel.endsWith(ig.slice(1))) return true
    } else if (ig.endsWith('/')) {
      if (rel.startsWith(ig)) return true
      if (parts.includes(ig.slice(0, -1))) return true
    } else if (parts[parts.length - 1] === ig) return true
  }
  return false
}

function getAllFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    const relPath = path.relative(DIR, fullPath)
    if (isIgnored(relPath)) continue
    if (entry.isDirectory()) files.push(...getAllFiles(fullPath))
    else files.push(relPath)
  }
  return files
}

async function main() {
  const files = getAllFiles(DIR).sort()
  console.log(`Found ${files.length} files`)
  if (files.includes('data/db_backup.sql')) console.log('Including DB backup: data/db_backup.sql')
  if (files.includes('data/db_backup.dump')) console.log('Including DB backup: data/db_backup.dump')

  if (!token) { console.log('No token provided. Usage: node push-crm.js <GITHUB_PAT>'); process.exit(1) }

  try { fs.rmSync(path.join(DIR, '.git'), { recursive: true, force: true }) } catch {}
  await git.init({ fs, dir: DIR, defaultBranch: 'main' })
  console.log('Repo initialized (default branch: main)')

  for (const file of files) {
    try { await git.add({ fs, dir: DIR, filepath: file }) } catch (e) { console.log('skip add', file, e.message) }
  }
  console.log('Files staged')

  const sha = await git.commit({
    fs, dir: DIR,
    author: { name: 'BizForce CRM', email: 'bot@bizforce.online' },
    message: 'BizForce CRM full codebase + database backups'
  })
  console.log(`Commit: ${sha}`)

  const remotes = await git.listRemotes({ fs, dir: DIR })
  for (const r of remotes) { await git.removeRemote({ fs, dir: DIR, remote: r.remote }) }
  await git.addRemote({ fs, dir: DIR, remote: 'origin', url: REPO_URL })

  await git.push({
    fs, dir: DIR, http,
    remote: 'origin',
    url: REPO_URL,
    ref: 'main',
    onAuth: () => ({ username: 'token', password: token }),
  })
  console.log('Push to origin/main complete!')
}

main().catch(err => {
  console.error('Error:', err.message, err.stack?.split('\n').slice(0, 6).join('\n'))
  process.exit(1)
})
