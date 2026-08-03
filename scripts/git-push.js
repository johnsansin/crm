const git = require('isomorphic-git')
const fs = require('fs')
const path = require('path')
const http = require('isomorphic-git/http/node')

const DIR = '/home/ubuntu/crm'
const token = process.argv[2]
const REPO_URL = 'https://github.com/johnsansin/bizforce.git'

async function getAllFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    const relPath = path.relative(DIR, fullPath)
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === '.spc.cache.php' || relPath.startsWith('data/pg')) continue
    if (entry.isDirectory()) files.push(...await getAllFiles(fullPath))
    else files.push(relPath)
  }
  return files
}

async function main() {
  const files = await getAllFiles(DIR)
  console.log(`Found ${files.length} files`)

  // Remove .git if exists to start fresh
  try { fs.rmSync(path.join(DIR, '.git'), { recursive: true }) } catch {}

  await git.init({ fs, dir: DIR })
  console.log('Repo initialized')

  for (const file of files) {
    try { await git.add({ fs, dir: DIR, filepath: file }) } catch {}
  }
  console.log('Files staged')

  const sha = await git.commit({
    fs, dir: DIR,
    author: { name: 'BizForce Bot', email: 'bot@bizforce.online' },
    message: 'Initial commit: BizForce CRM full codebase + db backup'
  })
  console.log(`Commit: ${sha}`)

  // Create 'main' branch pointing to same commit
  await git.branch({ fs, dir: DIR, ref: 'main', object: sha })
  console.log('Created main branch')

  if (!token) { console.log('No token. Set GH_TOKEN or pass as arg.'); return }

  await git.push({
    fs, dir: DIR, http,
    remote: 'origin',
    url: REPO_URL,
    ref: 'main',
    onAuth: () => ({ username: 'token', password: token }),
    force: true
  })
  console.log('Push complete!')
}

main().catch(err => {
  console.error('Error:', err.message, err.stack?.split('\n').slice(0,5).join('\n'))
  process.exit(1)
})
