import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'

const bundledChromium = '/home/ubuntu/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell'

export async function htmlToPdf(html: string): Promise<Buffer> {
  const dir = await mkdtemp(path.join(tmpdir(), 'bizforce-pdf-'))
  const source = path.join(dir, 'document.html')
  const output = path.join(dir, 'document.pdf')
  try {
    await writeFile(source, html, 'utf8')
    await new Promise<void>((resolve, reject) => {
      const child = spawn(process.env.CHROMIUM_PATH || bundledChromium, [
        '--headless', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
        '--no-pdf-header-footer', `--print-to-pdf=${output}`, `file://${source}`,
      ], { stdio: ['ignore', 'ignore', 'pipe'] })
      let error = ''
      child.stderr.on('data', chunk => { error += String(chunk) })
      child.once('error', reject)
      child.once('close', code => code === 0 ? resolve() : reject(new Error(error || `PDF renderer exited with code ${code}`)))
    })
    return await readFile(output)
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {})
  }
}

export async function pdfAttachmentFromRoute(req: any, route: string, fileName: string) {
  const port = process.env.PORT || 3000
  const response = await fetch(`http://127.0.0.1:${port}/api${route}`, {
    headers: req.headers.authorization ? { Authorization: req.headers.authorization } : {},
  })
  if (!response.ok) throw new Error(`Could not render PDF attachment (${response.status})`)
  const html = await response.text()
  return { filename: fileName.replace(/[^a-zA-Z0-9._-]/g, '_'), content: await htmlToPdf(html), contentType: 'application/pdf' }
}
