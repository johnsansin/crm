import { Router } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from '../lib/prisma'
import { signingSecret } from '../lib/secrets'
import { writeAudit } from '../lib/audit'
import { PERMISSION_MODULES } from '../lib/module-permissions'

export const socialAuthRouter = Router()

const JWT_SECRET = signingSecret('JWT_SECRET', 'bizforce-jwt-secret-dev-2026')

function frontendOrigin(): string {
  return process.env.CORS_ORIGIN || 'https://bizforce-crm.online'
}

function backendOrigin(): string {
  return process.env.BACKEND_PUBLIC_ORIGIN || frontendOrigin()
}

function providerConfig(provider: 'google' | 'facebook') {
  const prefix = provider === 'google' ? 'GOOGLE' : 'FACEBOOK'
  const clientID = process.env[`${prefix}_CLIENT_ID`] || ''
  const clientSecret = process.env[`${prefix}_CLIENT_SECRET`] || ''
  const callbackURL = `${backendOrigin()}/api/auth/${provider}/callback`
  return { clientID, clientSecret, callbackURL }
}

function providersReady(): boolean {
  return Boolean(
    (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) ||
    (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET)
  )
}

// Build and cache passport strategies lazily so the app starts even when no
// social credentials are configured yet.
type Builder = () => Promise<string>
const authUrlBuilders: Record<'google' | 'facebook', Builder | null> = { google: null, facebook: null }

function stateValue(): string {
  return crypto.randomBytes(16).toString('hex')
}

async function buildAuthUrl(provider: 'google' | 'facebook', state: string): Promise<string | null> {
  const cfg = providerConfig(provider)
  if (!cfg.clientID || !cfg.clientSecret) return null

  if (provider === 'google') {
    const { OAuth2Client } = await import('google-auth-library')
    const client = new OAuth2Client(cfg.clientID, cfg.clientSecret, cfg.callbackURL)
    const url = client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: ['openid', 'profile', 'email'],
      state,
    })
    return url
  }

  // facebook
  const q = new URLSearchParams({
    client_id: cfg.clientID,
    redirect_uri: cfg.callbackURL,
    response_type: 'code',
    scope: 'email',
    state,
  })
  return `https://www.facebook.com/v18.0/dialog/oauth?${q.toString()}`
}

function provisionUserData(profile: { id: string; name?: string; email?: string; displayName?: string; nameID?: string }, provider: 'google' | 'facebook') {
  const email = String(profile.email || profile.nameID || '').trim().toLowerCase()
  const fullName = profile.displayName || profile.name || ''
  const parts = fullName.split(/\s+/).filter(Boolean)
  const firstName = parts[0] || email.split('@')[0] || 'Social'
  const lastName = parts.slice(1).join(' ') || ''
  return { email, firstName, lastName, provider }
}

async function ensureAccount(profile: { id: string; email: string; firstName: string; lastName: string }, provider: 'google' | 'facebook') {
  // 1. Match an existing user by email.
  const existing = await prisma.user.findUnique({ where: { email: profile.email }, include: { profile: true } })
  if (existing) {
    if (!existing.isActive) throw new Error('account-inactive')
    return existing
  }

  // 2. No user → create a brand-new organization + admin user via social login.
  const company = await prisma.company.create({
    data: { name: `${profile.firstName}'s Organization` },
  })

  const ceo = await prisma.role.create({ data: { name: 'CEO', description: 'Full access to all modules', companyId: company.id } })
  await prisma.role.create({ data: { name: 'Manager', description: 'Manager level access', parentId: ceo.id, companyId: company.id } })
  await prisma.role.create({ data: { name: 'User', description: 'Standard user', parentId: ceo.id, companyId: company.id } })

  for (const role of await prisma.role.findMany({ where: { companyId: company.id } })) {
    const isCeo = role.name === 'CEO'
    for (const mod of PERMISSION_MODULES) {
      await prisma.rolePermission.create({
        data: {
          roleId: role.id, moduleName: mod,
          view: true, create: isCeo, edit: isCeo, delete: isCeo, import: isCeo, export: isCeo,
        },
      })
    }
  }

  const base = profile.firstName.toLowerCase().replace(/[^a-z0-9_.-]/g, '').slice(0, 20) || `user_${provider}`
  let userName = base
  let suffix = 1
  while (await prisma.user.findUnique({ where: { userName } })) {
    userName = `${base}${++suffix}`
  }

  const user = await prisma.user.create({
    data: {
      userName,
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName || '',
      password: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10),
      isAdmin: true,
      roleId: ceo.id,
      companyId: company.id,
      hasCompletedOnboarding: false,
    },
    include: { company: true, profile: true },
  })
  return user
}

async function handleCallback(provider: 'google' | 'facebook', code: string, req: any, res: any, next: any) {
  try {
    if (!code) return res.redirect(`${frontendOrigin()}/login?sso=error&reason=invalid-assertion`)

    let oauthProfile: { email?: string; name?: string; displayName?: string; id: string } | null = null

    if (provider === 'google') {
      const { OAuth2Client } = await import('google-auth-library')
      const cfg = providerConfig('google')
      const client = new OAuth2Client(cfg.clientID, cfg.clientSecret, cfg.callbackURL)
      const { tokens } = await client.getToken(code)
      const idToken = (tokens as any).id_token as string | undefined
      if (!idToken) throw new Error('google-id-token-missing')
      const ticket = await client.verifyIdToken({ idToken, audience: cfg.clientID })
      const payload = ticket.getPayload()
      oauthProfile = { id: payload?.sub || '', email: payload?.email, name: payload?.name }
    } else {
      const cfg = providerConfig('facebook')
      const tokenRes = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?client_id=${cfg.clientID}&client_secret=${cfg.clientSecret}&redirect_uri=${cfg.callbackURL}&code=${code}`)
      const tokenJson: any = await tokenRes.json()
      if (!tokenJson.access_token) throw new Error('facebook-code-exchange-failed')
      const meRes = await fetch(`https://graph.facebook.com/me?fields=id,name,email&access_token=${tokenJson.access_token}`)
      const me: any = await meRes.json()
      oauthProfile = { id: String(me.id || ''), email: me.email, name: me.name }
    }

    const { email, firstName, lastName } = provisionUserData(oauthProfile as any, provider)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.redirect(`${frontendOrigin()}/login?sso=error&reason=no-email`)
    }

    const user = await ensureAccount({ id: oauthProfile?.id || '', email, firstName, lastName }, provider)
    if (!user || !user.isActive) return res.redirect(`${frontendOrigin()}/login?sso=error&reason=account-inactive`)

    await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date(), lastActiveAt: new Date() } })
    const isSuperAdmin = user.profile?.isSuperAdmin || false
    const token = jwt.sign(
      { userId: user.id, email: user.email, isAdmin: user.isAdmin, companyId: user.companyId, isSuperAdmin, roleId: user.roleId, tokenVersion: user.tokenVersion || 0 },
      JWT_SECRET,
      { expiresIn: '7d' }
    )
    await writeAudit({ moduleName: 'auth', action: 'LOGIN', newValue: `${user.email} (${provider})`, userId: user.id, req })
    res.redirect(`${frontendOrigin()}/login#token=${encodeURIComponent(token)}`)
  } catch (err: any) {
    if (err?.message === 'account-inactive') {
      return res.redirect(`${frontendOrigin()}/login?sso=error&reason=account-inactive`)
    }
    console.warn(`[${provider}] oauth callback failed`, err?.message)
    await writeAudit({ moduleName: 'auth', action: 'LOGIN_FAILED', newValue: `${provider}:${code?.slice(0, 10) || ''}`, req }).catch(() => {})
    res.redirect(`${frontendOrigin()}/login?sso=error&reason=invalid-assertion`)
  }
}

// ---- Status: tells the frontend which providers are configured ----
socialAuthRouter.get('/providers', (_req, res) => {
  res.json({
    google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    facebook: !!(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET),
  })
})

// ---- Initiate google ----
socialAuthRouter.get('/google', async (req, res, next) => {
  try {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.redirect(`${frontendOrigin()}/login?sso=error&reason=not-configured`)
    }
    const url = await buildAuthUrl('google', stateValue())
    if (!url) return res.redirect(`${frontendOrigin()}/login?sso=error&reason=not-configured`)
    res.redirect(url)
  } catch (err) { next(err) }
})

// ---- Google callback ----
socialAuthRouter.get('/google/callback', (req, res, next) => {
  handleCallback('google', String(req.query?.code || ''), req, res, next)
})

// ---- Initiate facebook ----
socialAuthRouter.get('/facebook', async (req, res, next) => {
  try {
    if (!process.env.FACEBOOK_CLIENT_ID || !process.env.FACEBOOK_CLIENT_SECRET) {
      return res.redirect(`${frontendOrigin()}/login?sso=error&reason=not-configured`)
    }
    const url = await buildAuthUrl('facebook', stateValue())
    if (!url) return res.redirect(`${frontendOrigin()}/login?sso=error&reason=not-configured`)
    res.redirect(url)
  } catch (err) { next(err) }
})

// ---- Facebook callback ----
socialAuthRouter.get('/facebook/callback', (req, res, next) => {
  handleCallback('facebook', String(req.query?.code || ''), req, res, next)
})

export { frontendOrigin, providersReady }
