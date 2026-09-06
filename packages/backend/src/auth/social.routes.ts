import { Router } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from '../lib/prisma'
import { signingSecret } from '../lib/secrets'
import { writeAudit } from '../lib/audit'
import { authMiddleware, requireAdmin } from '../middleware/auth'
import { PERMISSION_MODULES } from '../lib/module-permissions'

export const socialAuthRouter = Router()

const JWT_SECRET = signingSecret('JWT_SECRET', 'bizforce-jwt-secret-dev-2026')

function frontendOrigin(): string {
  return process.env.CORS_ORIGIN || 'https://bizforce-crm.online'
}

function backendOrigin(): string {
  return process.env.BACKEND_PUBLIC_ORIGIN || frontendOrigin()
}

const SOCIAL_KEY = 'social-login'

async function savedSocialConfig(): Promise<any> {
  const row = await prisma.globalSetting.findUnique({ where: { key: SOCIAL_KEY } }).catch(() => null)
  return (row?.value as any) || {}
}

function providerConfigSaved(provider: 'google' | 'facebook', saved: any) {
  const block = saved?.[provider] || {}
  return {
    clientID: String(block.clientID || block.clientId || '').trim(),
    clientSecret: String(block.clientSecret || '').trim(),
  }
}

async function providerConfig(provider: 'google' | 'facebook') {
  const prefix = provider === 'google' ? 'GOOGLE' : 'FACEBOOK'
  const saved = await savedSocialConfig()
  const fromSaved = providerConfigSaved(provider, saved)
  const clientID = process.env[`${prefix}_CLIENT_ID`] || fromSaved.clientID
  const clientSecret = process.env[`${prefix}_CLIENT_SECRET`] || fromSaved.clientSecret
  const callbackURL = `${backendOrigin()}/api/auth/${provider}/callback`
  return { clientID, clientSecret, callbackURL }
}

function maskSecret(secret: string) {
  if (!secret) return ''
  if (secret.length <= 8) return '••••'
  return `${secret.slice(0, 3)}••••••${secret.slice(-3)}`
}

async function providerStates() {
  const saved = await savedSocialConfig()
  const google = await providerConfig('google')
  const facebook = await providerConfig('facebook')
  return {
    google: Boolean(google.clientID && google.clientSecret),
    facebook: Boolean(facebook.clientID && facebook.clientSecret),
    googleConfigured: Boolean(google.clientID),
    facebookConfigured: Boolean(facebook.clientID),
  }
}

function stateValue(): string {
  return crypto.randomBytes(16).toString('hex')
}

async function buildAuthUrl(provider: 'google' | 'facebook', state: string): Promise<string | null> {
  const cfg = await providerConfig(provider)
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
      const cfg = await providerConfig('google')
      const client = new OAuth2Client(cfg.clientID, cfg.clientSecret, cfg.callbackURL)
      const { tokens } = await client.getToken(code)
      const idToken = (tokens as any).id_token as string | undefined
      if (!idToken) throw new Error('google-id-token-missing')
      const ticket = await client.verifyIdToken({ idToken, audience: cfg.clientID })
      const payload = ticket.getPayload()
      oauthProfile = { id: payload?.sub || '', email: payload?.email, name: payload?.name }
    } else {
      const cfg = await providerConfig('facebook')
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
socialAuthRouter.get('/providers', async (_req, res, next) => {
  try {
    const states = await providerStates()
    res.json({ google: states.google, facebook: states.facebook })
  } catch (err) { next(err) }
})

// ---- Initiate google ----
socialAuthRouter.get('/google', async (req, res, next) => {
  try {
    const cfg = await providerConfig('google')
    if (!cfg.clientID || !cfg.clientSecret) {
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
    const cfg = await providerConfig('facebook')
    if (!cfg.clientID || !cfg.clientSecret) {
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

// ---- Admin config: read (masked) ----
socialAuthRouter.get('/config', authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const saved = await savedSocialConfig()
    const states = await providerStates()
    res.json({
      google: {
        clientID: saved?.google?.clientID || saved?.google?.clientId || '',
        clientSecret: maskSecret(saved?.google?.clientSecret || ''),
        ...states,
      },
      facebook: {
        clientID: saved?.facebook?.clientID || saved?.facebook?.clientId || '',
        clientSecret: maskSecret(saved?.facebook?.clientSecret || ''),
        ...states,
      },
    })
  } catch (err) { next(err) }
})

// ---- Admin config: save ----
socialAuthRouter.put('/config', authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const body = req.body || {}
    const saved = await savedSocialConfig()

    const google = {
      clientID: String(body?.google?.clientID || '').trim(),
      clientSecret: String(body?.google?.clientSecret || '').trim(),
    }
    const facebook = {
      clientID: String(body?.facebook?.clientID || '').trim(),
      clientSecret: String(body?.facebook?.clientSecret || '').trim(),
    }

    // Keep existing secrets when blank is submitted; a blank clientID clears the whole provider
    if (!google.clientID) {
      google.clientSecret = ''
    } else if (!google.clientSecret && saved?.google?.clientSecret) google.clientSecret = String(saved.google.clientSecret)
    if (!facebook.clientID) {
      facebook.clientSecret = ''
    } else if (!facebook.clientSecret && saved?.facebook?.clientSecret) facebook.clientSecret = String(saved.facebook.clientSecret)

    const value = {
      google: { clientID: google.clientID, clientSecret: google.clientSecret },
      facebook: { clientID: facebook.clientID, clientSecret: facebook.clientSecret },
    }
    await prisma.globalSetting.upsert({
      where: { key: SOCIAL_KEY },
      update: { value },
      create: { key: SOCIAL_KEY, value },
    })
    await writeAudit({
      moduleName: 'settings',
      action: 'UPDATE',
      fieldName: 'socialLogin',
      newValue: `google=${google.clientID ? 'set' : 'blank'}, facebook=${facebook.clientID ? 'set' : 'blank'}`,
      req,
    })
    res.json({ ok: true })
  } catch (err) { next(err) }
})

export { frontendOrigin }
