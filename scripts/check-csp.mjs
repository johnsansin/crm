import assert from 'node:assert/strict'

// Run against a production build: node scripts/check-csp.mjs http://127.0.0.1:3001
const origin = process.argv[2] || 'http://127.0.0.1:3001'
const seen = new Set()
for (const path of ['/', '/', '/login', '/signup', '/pricing', '/socialforce-demo', '/contact', '/privacy-policy', '/terms', '/cookie-policy', '/refund-policy']) {
  const response = await fetch(new URL(path, origin), { headers: { 'x-nonce': 'attacker' } })
  assert.equal(response.status, 200, path)
  const policy = response.headers.get('content-security-policy') || ''
  assert(!/unsafe-inline|unsafe-eval/.test(policy), 'Production policy must not contain unsafe keywords')
  for (const directive of ["default-src 'none'", "base-uri 'none'", "form-action 'self'", "object-src 'none'", "frame-ancestors 'self'", "script-src-attr 'none'", "style-src-attr 'none'", "'strict-dynamic'"]) {
    assert(policy.includes(directive), `Missing ${directive}`)
  }
  assert(!policy.match(/script-src ([^;]+)/)?.[1].includes("'self'"), 'Scripts must not trust all same-origin content')
  assert.equal(policy.includes('upgrade-insecure-requests'), new URL(response.url).protocol === 'https:', 'Only HTTPS pages may upgrade asset requests')
  const nonce = policy.match(/'nonce-([^']+)'/)?.[1]
  assert(nonce && nonce !== 'attacker' && !seen.has(nonce), 'Nonce must be fresh and server-generated')
  seen.add(nonce)
  assert(/no-store/.test(response.headers.get('cache-control') || ''), 'Nonce-bearing pages cannot be cached')
  const html = await response.text()
  assert(!html.includes('sajjad@bizforce-crm.online'), 'Public contact email must not leak in HTML or RSC')
  for (const [, href] of html.matchAll(/<link[^>]+href="([^"]+\.css)"/g)) {
    const css = await fetch(new URL(href, origin))
    assert.equal(css.status, 200, `Stylesheet unavailable: ${href}`)
    assert(css.headers.get('content-type')?.includes('text/css'), `Invalid stylesheet type: ${href}`)
  }
  const scripts = [...html.matchAll(/<script\b([^>]*)>/g)]
  assert(scripts.length > 0)
  for (const script of scripts) assert(script[1].includes(`nonce="${nonce}"`), `Missing or mismatched nonce: ${script[0]}`)
  console.log(`PASS ${path}`)
}

const robots = await fetch(new URL('/robots.txt', origin))
assert.equal(robots.status, 200)
assert(robots.headers.get('content-type')?.includes('text/plain'))
const rules = await robots.text()
assert(rules.includes('Disallow: /api/'))
assert(rules.includes('Disallow: /uploads/'))
assert(rules.includes('Sitemap: https://bizforce-crm.online/sitemap.xml'))
console.log('PASS robots.txt')
