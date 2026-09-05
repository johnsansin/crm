import { Router } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { Strategy as SamlStrategy } from 'passport-saml'
import { prisma } from '../lib/prisma'
import { signingSecret } from '../lib/secrets'
import { writeAudit } from '../lib/audit'
import { organizationAccessError } from '../lib/organization-limits'

export const ssoRouter = Router()

const JWT_SECRET = signingSecret('JWT_SECRET', 'bizforce-jwt-secret-dev-2026')

function frontendOrigin(): string {
  return process.env.CORS_ORIGIN || 'https://bizforce-crm.online'
}

function backendOrigin(): string {
  return process.env.BACKEND_PUBLIC_ORIGIN || frontendOrigin()
}

function isEnterprise(company: any): boolean {
  const plan = String(company.subscriptionModel?.code || company.subscriptionPlan || '').toUpperCase()
  return plan === 'ENTERPRISE'
}

/**
 * Resolve the SSO configuration for a company. Returns null when SSO is not
 * configured or is disabled. Also enforces Enterprise plan gating.
 */
async function resolveSsoConfig(companyId: string | undefined, email?: string) {
  let companyIdToUse = companyId
  if (!companyIdToUse && email) {
    const user = await prisma.user.findUnique({ where: { email: String(email).trim().toLowerCase() } })
    if (user?.companyId) companyIdToUse = user.companyId
  }
  if (!companyIdToUse) return { error: 'Unable to determine your organization. Sign in with your work email or contact your administrator.' }
  const [config, company] = await Promise.all([
    prisma.ssoConfig.findUnique({ where: { companyId: companyIdToUse } }),
    prisma.company.findUnique({ where: { id: companyIdToUse } }),
  ])
  if (!company) return { error: 'Organization not found' }
  if (!company.isActive) return { error: 'Organization is deactivated. Contact your super admin.' }
  const accessError = organizationAccessError(company)
  if (accessError) return { error: accessError }
  if (!isEnterprise(company)) return { error: 'SAML SSO is available on the Enterprise plan. Contact your administrator.' }
  if (!config || !config.isEnabled) return { error: 'Single sign-on is not enabled for your organization. Contact your administrator.' }
  return { config, companyId: companyIdToUse }
}

function buildStrategy(config: any) {
  const callbackUrl = `${backendOrigin()}/api/auth/sso/callback`
  const options: Record<string, unknown> = {
    callbackUrl,
    entryPoint: config.idpEntryPoint,
    issuer: config.issuer || callbackUrl,
    cert: config.cert,
    signatureAlgorithm: config.signatureAlgorithm || 'sha256',
    wantAuthnResponseSigned: config.wantAuthnResponseSigned !== false,
    disableRequestedAuthnContext: !!config.disableRequestedAuthnContext,
    identifierFormat: 'urn:oasis:names:tc:SAML:2.0:nameid-format:emailAddress',
    acceptedClockSkewMs: 5000,
  }
  return new SamlStrategy(options as any, (_profile: any, done: (err: Error | null, profile?: any) => void) => done(null, _profile))
}

function validateSamlResponse(strategy: any, body: string) {
  return strategy._saml.validatePostResponseAsync({
    SAMLResponse: body,
    RelayState: 'bizforce',
  }) as Promise<{ profile?: any | null; loggedOut?: boolean }>
}

function spMetadata(strategy: any): string {
  return strategy.generateServiceProviderMetadata(null, null)
}

function authorizeUrl(strategy: any, relayState: string) {
  return strategy._saml.getAuthorizeUrlAsync(relayState, undefined, {}) as Promise<string>
}

// ---- Initiate login (frontend redirects to IdP) ----
ssoRouter.post('/sso/init', async (req, res, next) => {
  try {
    const account = await resolveSsoConfig(String(req.body?.companyId || req.query.companyId || ''), String(req.body?.email || '').trim().toLowerCase())
    if (account.error || !account.config) return res.status(403).json({ error: account.error || 'SSO unavailable' })
    const strategy = buildStrategy(account.config)
    const redirectUrl = await authorizeUrl(strategy, account.companyId!)
    res.json({ redirectUrl })
  } catch (err) { next(err) }
})

// ---- SP metadata (fetched by the Identity Provider) ----
ssoRouter.get('/sso/sp-metadata/:companyId', async (req, res, next) => {
  try {
    const account = await resolveSsoConfig(String(req.params.companyId || ''))
    if (account.error || !account.config) return res.status(404).json({ error: 'SSO configuration not found' })
    const xml = await spMetadata(buildStrategy(account.config))
    res.setHeader('Content-Type', 'application/xml')
    res.send(xml)
  } catch (err) { next(err) }
})

// ---- ACS endpoint (Identity Provider posts the SAML response here) ----
ssoRouter.post('/sso/callback', async (req, res, next) => {
  try {
    const samlResponse = String(req.body?.SAMLResponse || '')
    const relay = String(req.body?.RelayState || '')
    if (!samlResponse) return res.status(400).send('SAML callback failed: missing SAMLResponse')

    // RelayState carries the companyId. Resolve the SSO configuration, but do
    // not fail on plan gating here again: the redirect flow already checked it.
    const companyId = relay || String(req.query.companyId || '')
    const config = await prisma.ssoConfig.findUnique({ where: { companyId } })
    if (!config || !config.isEnabled) {
      return res.redirect(`${frontendOrigin()}/login?sso=error&reason=not-enabled`)
    }
    const company = await prisma.company.findUnique({ where: { id: companyId } })
    if (!company || !company.isActive) return res.redirect(`${frontendOrigin()}/login?sso=error&reason=company-inactive`)

    let profile: any
    try {
      const result = await validateSamlResponse(buildStrategy(config), samlResponse)
      profile = result?.profile
      if (!profile?.email && !profile?.nameID) throw new Error('No email provided in SAML assertion')
    } catch (err: any) {
      console.warn('[SSO] callback validation failed', err?.message)
      await writeAudit({ moduleName: 'auth', action: 'LOGIN_FAILED', newValue: `sso:${companyId}`, req }).catch(() => {})
      return res.redirect(`${frontendOrigin()}/login?sso=error&reason=invalid-assertion`)
    }

    const email = String((profile as any).email || profile.nameID || '').trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.redirect(`${frontendOrigin()}/login?sso=error&reason=no-email`)
    }
    if (organizationAccessError(company)) {
      return res.redirect(`${frontendOrigin()}/login?sso=error&reason=subscription`)
    }

    const firstName = String(profile.firstName || '').trim()
    const lastName = String(profile.lastName || '').trim()

    let user = await prisma.user.findFirst({ where: { email, companyId }, include: { profile: true } })
    if (!user) {
      const sanitizedName = (firstName + lastName).replace(/[^a-zA-Z0-9_.-]/g, '').slice(0, 40) ||
        email.split('@')[0].replace(/[^a-zA-Z0-9_.-]/g, '').slice(0, 40) || 'sso-user'
      let userName = sanitizedName
      let suffix = 1
      while (await prisma.user.findUnique({ where: { userName } })) {
        userName = `${sanitizedName}${++suffix}`
      }
      const roleId = await prisma.role.findFirst({ where: { companyId, isActive: true }, orderBy: { createdAt: 'asc' } }).then(r => r?.id)
      user = await prisma.user.create({
        data: {
          userName,
          email,
          firstName: firstName || email.split('@')[0],
          lastName: lastName || '',
          password: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10),
          companyId,
          roleId: roleId || null,
          isActive: true,
        },
        include: { company: true, profile: true },
      })
    } else if (!user.isActive) {
      return res.redirect(`${frontendOrigin()}/login?sso=error&reason=account-inactive`)
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date(), lastActiveAt: new Date() } })
    const isSuperAdmin = user.profile?.isSuperAdmin || false
    const token = jwt.sign(
      { userId: user.id, email: user.email, isAdmin: user.isAdmin, companyId: user.companyId, isSuperAdmin, roleId: user.roleId, tokenVersion: user.tokenVersion || 0 },
      JWT_SECRET,
      { expiresIn: '7d' }
    )
    await writeAudit({ moduleName: 'auth', action: 'LOGIN', newValue: `${user.email} (SSO)`, userId: user.id, req })
    res.redirect(`${frontendOrigin()}/login#token=${encodeURIComponent(token)}`)
  } catch (err) { next(err) }
})

// ---- Logout (stateless JWT — nothing server-side to destroy) ----
ssoRouter.post('/sso/logout', (_req, res) => {
  res.redirect(`${frontendOrigin()}/login`)
})