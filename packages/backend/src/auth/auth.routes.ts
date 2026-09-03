import { Router } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'
import { canLogin, recordLoginFailure, resetLoginFailures, validatePassword } from '../lib/settings'
import { sendMail, getSmtpConfig } from '../lib/mailer'
import { verifyTotp } from '../lib/otp'
import { getClientIp, writeAudit } from '../lib/audit'
import { signingSecret } from '../lib/secrets'
import { publicUser } from '../lib/public-user'
import { PERMISSION_MODULES } from '../lib/module-permissions'
import { organizationAccessError } from '../lib/organization-limits'

const JWT_SECRET = signingSecret('JWT_SECRET', 'bizforce-jwt-secret-dev-2026')
const TWO_FACTOR_CHALLENGE_TTL = '5m'

export const authRouter = Router()

async function recordLogin(req: any, user: any) {
  const rawIp = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.socket.remoteAddress || req.ip
  const ipAddress = rawIp?.replace(/^::ffff:/, '') || null
  const userAgent = req.headers['user-agent'] || ''
  const log = await prisma.loginLog.create({
    data: {
      userId: user.id,
      email: user.email,
      userName: user.userName,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      status: 'Success',
      companyId: user.companyId,
    }
  })
  fetch('https://api.ipify.org?format=json')
    .then(r => r.json())
    .then(d => { if ((d as any).ip) prisma.loginLog.update({ where: { id: log.id }, data: { publicIp: (d as any).ip } }).catch(() => {}) })
    .catch(() => {})
  return log
}

async function issueToken(user: any) {
  const isSuperAdmin = user.profile?.isSuperAdmin || false
  const token = jwt.sign(
    { userId: user.id, email: user.email, isAdmin: user.isAdmin, companyId: user.companyId, isSuperAdmin, roleId: user.roleId, tokenVersion: user.tokenVersion || 0 },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
  return { token, isSuperAdmin }
}

async function notifySuperAdminsOfRegistration(user: any) {
  const superAdmins = await prisma.user.findMany({
    where: { isActive: true, profile: { is: { isSuperAdmin: true } } },
    select: { id: true },
  })
  if (!superAdmins.length) return

  const companyName = user.company?.name || 'A new organisation'
  const adminName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.userName || user.email
  await prisma.notification.createMany({
    data: superAdmins.map(superAdmin => ({
      userId: superAdmin.id,
      companyId: user.companyId,
      title: 'New organisation registered',
      message: `${companyName} was registered by ${adminName} (${user.email}).`,
      link: `/superadmin/organizations?id=${user.companyId}`,
    })),
  })
}

function issueTwoFactorChallenge(userId: string): string {
  return jwt.sign({ userId, purpose: 'two-factor-login' }, JWT_SECRET, {
    expiresIn: TWO_FACTOR_CHALLENGE_TTL,
    audience: 'bizforce-two-factor',
  })
}

function verifyTwoFactorChallenge(challenge: unknown): string | null {
  if (typeof challenge !== 'string' || !challenge) return null
  try {
    const payload = jwt.verify(challenge, JWT_SECRET, { audience: 'bizforce-two-factor' }) as jwt.JwtPayload
    return payload.purpose === 'two-factor-login' && typeof payload.userId === 'string' ? payload.userId : null
  } catch {
    return null
  }
}

async function verifyCredentials(user: any, password: string, req?: any) {
  const lock = canLogin(user)
  if (!lock.allowed) return { ok: false, error: lock.reason }
  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    if (user.companyId) await recordLoginFailure(user.id, user.companyId, req)
    return { ok: false, error: 'Invalid credentials' }
  }
  return { ok: true }
}

authRouter.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase()
    const password = typeof req.body?.password === 'string' ? req.body.password : ''
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' })
    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true, profile: true }
    })
    if (!user) {
      await writeAudit({ moduleName: 'auth', action: 'LOGIN_FAILED', newValue: email || '', req })
      return res.status(401).json({ error: 'Not registered email/user' })
    }
    if (!user.isActive) {
      await writeAudit({ moduleName: 'auth', action: 'LOGIN_FAILED', newValue: email || '', req })
      return res.status(403).json({ error: 'Your account is blocked. Please contact your organization administrator.' })
    }
    if (user.companyId) {
      const company = await prisma.company.findUnique({ where: { id: user.companyId } })
      if (company && !company.isActive) {
        return res.status(403).json({ error: 'Organization is deactivated. Contact your super admin.' })
      }
      if (company) {
        const accessError = organizationAccessError(company)
        if (accessError) return res.status(403).json({ error: accessError })
      }
    }
    const result = await verifyCredentials(user, password, req)
    if (!result.ok) return res.status(401).json({ error: result.error })

    // 2FA: issue a one-time session challenge
    if (user.twoFactorEnabled) {
      return res.json({
        requires2FA: true,
        challenge: issueTwoFactorChallenge(user.id),
        user: publicUser(user, { isSuperAdmin: user.profile?.isSuperAdmin || false }),
      })
    }

    await resetLoginFailures(user.id)
    await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date(), lastActiveAt: new Date() } })
    await recordLogin(req, user)
    await writeAudit({ moduleName: 'auth', action: 'LOGIN', newValue: user.email, userId: user.id, req })

    const { token, isSuperAdmin } = await issueToken(user)
    res.json({ token, user: publicUser(user, { isSuperAdmin }) })
  } catch (err) { next(err) }
})

authRouter.post('/login/2fa', async (req, res, next) => {
  try {
    const { challenge, code } = req.body
    const userId = verifyTwoFactorChallenge(challenge)
    if (!userId) return res.status(401).json({ error: 'Invalid or expired login challenge' })
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true, profile: true }
    })
    if (!user || !user.isActive || !user.twoFactorEnabled) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    if (user.companyId) {
      const company = await prisma.company.findUnique({ where: { id: user.companyId } })
      if (company && !company.isActive) {
        return res.status(403).json({ error: 'Organization is deactivated. Contact your super admin.' })
      }
      if (company) {
        const accessError = organizationAccessError(company)
        if (accessError) return res.status(403).json({ error: accessError })
      }
    }
    if (!user.twoFactorSecret || !verifyTotp(user.twoFactorSecret, code)) {
      return res.status(401).json({ error: 'Invalid or expired verification code' })
    }
    await resetLoginFailures(user.id)
    await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date(), lastActiveAt: new Date() } })
    await recordLogin(req, user)
    await writeAudit({ moduleName: 'auth', action: 'LOGIN', newValue: user.email, userId: user.id, req })

    const { token, isSuperAdmin } = await issueToken(user)
    res.json({ token, user: publicUser(user, { isSuperAdmin }) })
  } catch (err) { next(err) }
})

const REGISTRATION_TTL_MS = 15 * 60 * 1000
const REGISTRATION_MAX_ATTEMPTS = 5

function generateVerificationCode(): string {
  return crypto.randomInt(100000, 1000000).toString()
}

function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex')
}

async function sendVerificationEmail(email: string, code: string) {
  const html = [
    '<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px">',
    '<h2 style="margin-top:0;color:#0f172a">Verify your email</h2>',
    '<p style="color:#334155;line-height:1.6">You requested to create a BizForce CRM organization for this email address. Enter the verification code below to complete your sign-up:</p>',
    `<p style="font-size:28px;font-weight:700;letter-spacing:6px;color:#2563eb;background:#f1f5f9;border-radius:8px;padding:12px;text-align:center">${code}</p>`,
    '<p style="color:#94a3b8;font-size:13px">This code expires in 15 minutes. If you did not request this, you can safely ignore this email.</p>',
    '</div>',
  ].join('')
  const fromOverride = await getSmtpConfig(null)
  const sent = await sendMail({ to: email, subject: 'Verify your email — BizForce CRM', html, fromOverride })
  if (!sent.delivered) console.warn(`[REGISTER] Verification email could not be delivered to ${email}`)
  return sent
}

async function createCompanyForRegistration(payload: any) {
  const company = await prisma.company.create({
    data: { name: payload.companyName || `${payload.firstName}'s Organization` }
  })

  const modules = PERMISSION_MODULES

  const ceo = await prisma.role.create({ data: { name: 'CEO', description: 'Full access to all modules', companyId: company.id } })
  await prisma.role.create({ data: { name: 'Manager', description: 'Manager level access', parentId: ceo.id, companyId: company.id } })
  await prisma.role.create({ data: { name: 'User', description: 'Standard user', parentId: ceo.id, companyId: company.id } })

  for (const role of await prisma.role.findMany({ where: { companyId: company.id } })) {
    const isCeo = role.name === 'CEO'
    for (const mod of modules) {
      await prisma.rolePermission.create({
        data: {
          roleId: role.id, moduleName: mod,
          view: true,
          create: isCeo,
          edit: isCeo,
          delete: isCeo,
          import: isCeo,
          export: isCeo,
        }
      })
    }
  }

  const user = await prisma.user.create({
    data: {
      userName: payload.userName,
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      password: payload.passwordHash,
      isAdmin: true,
      roleId: ceo.id,
      companyId: company.id
    },
    include: { company: true }
  })
  return user
}

// Step 1 — request registration: validate, send a verification code by email,
// and hold the registration as pending until the code is confirmed.
authRouter.post('/register', async (req, res, next) => {
  try {
    const { userName, email, firstName, lastName, password, companyName } = req.body
    if (!email || !userName || !firstName || !lastName || !password) {
      return res.status(400).json({ error: 'All fields are required' })
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { userName }] }
    })
    if (existing) {
      return res.status(400).json({ error: 'User already exists' })
    }

    await prisma.pendingRegistration.deleteMany({ where: { email } })

    const code = generateVerificationCode()
    const pending = await prisma.pendingRegistration.create({
      data: {
        email,
        payload: {
          userName,
          email,
          firstName,
          lastName,
          passwordHash: await bcrypt.hash(password, 10),
          companyName: companyName || null,
        },
        codeHash: hashCode(code),
        expiresAt: new Date(Date.now() + REGISTRATION_TTL_MS),
        attempts: 0,
      },
    })

    sendVerificationEmail(email, code).catch(err => console.error('[REGISTER] background email error:', err?.message))
    res.status(201).json({ needsVerification: true, verificationId: pending.id, email, delivered: false })
  } catch (err) { next(err) }
})

// Step 2 — confirm the code and permanently register the organization + admin user.
authRouter.post('/register/verify', async (req, res, next) => {
  try {
    const { verificationId, code } = req.body
    if (!verificationId || !code) {
      return res.status(400).json({ error: 'Verification code is required' })
    }
    const pending = await prisma.pendingRegistration.findUnique({ where: { id: verificationId } })
    if (!pending) {
      return res.status(400).json({ error: 'Registration session not found or already completed. Please sign up again.' })
    }
    if (new Date(pending.expiresAt) < new Date()) {
      await prisma.pendingRegistration.delete({ where: { id: pending.id } })
      return res.status(400).json({ error: 'Verification code has expired. Please sign up again.' })
    }
    if (pending.attempts >= REGISTRATION_MAX_ATTEMPTS) {
      await prisma.pendingRegistration.delete({ where: { id: pending.id } })
      return res.status(400).json({ error: 'Too many incorrect attempts. Please sign up again.' })
    }

    const valid = hashCode(String(code).trim()) === pending.codeHash
    if (!valid) {
      await prisma.pendingRegistration.update({ where: { id: pending.id }, data: { attempts: { increment: 1 } } })
      return res.status(400).json({ error: 'Invalid verification code' })
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: pending.email }, { userName: (pending.payload as any).userName }] }
    })
    if (existing) {
      await prisma.pendingRegistration.delete({ where: { id: pending.id } })
      return res.status(400).json({ error: 'User already exists' })
    }

    const payload = pending.payload as any
    const user = await createCompanyForRegistration(payload)
    await prisma.pendingRegistration.delete({ where: { id: pending.id } })

    // Registration is already complete at this point, so notification delivery
    // must never prevent the new organisation admin from signing in.
    await notifySuperAdminsOfRegistration(user).catch(error => {
      console.error('Failed to notify SuperAdmins of a new organisation registration', error)
    })

    await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date(), lastActiveAt: new Date() } })
    await recordLogin(req, user)
    await writeAudit({ moduleName: 'auth', action: 'LOGIN', newValue: user.email, userId: user.id, req })

    const { token } = await issueToken(user)
    res.status(201).json({ token, user: publicUser(user, { isSuperAdmin: false }) })
  } catch (err) { next(err) }
})

// Resend the verification code for a pending registration.
authRouter.post('/register/resend', async (req, res, next) => {
  try {
    const { email, verificationId } = req.body
    if (!email && !verificationId) {
      return res.status(400).json({ error: 'email is required' })
    }
    const pending = verificationId
      ? await prisma.pendingRegistration.findUnique({ where: { id: verificationId } })
      : await prisma.pendingRegistration.findFirst({ where: { email } })
    if (!pending) {
      return res.status(400).json({ error: 'No pending registration found. Please sign up again.' })
    }

    const code = generateVerificationCode()
    await prisma.pendingRegistration.update({
      where: { id: pending.id },
      data: { codeHash: hashCode(code), expiresAt: new Date(Date.now() + REGISTRATION_TTL_MS), attempts: 0 },
    })
    const sent = await sendVerificationEmail(pending.email, code)
    res.json({ needsVerification: true, verificationId: pending.id, email: pending.email, delivered: sent.delivered })
  } catch (err) { next(err) }
})

authRouter.post('/logout', authMiddleware, async (req, res, next) => {
  try {
    await writeAudit({
      moduleName: 'auth',
      action: 'LOGOUT',
      newValue: req.user!.email || '',
      userId: req.user!.userId,
      req,
    })
    await prisma.user.update({ where: { id: req.user!.userId }, data: { lastActiveAt: null } })
    res.json({ success: true })
  } catch (err) { next(err) }
})

authRouter.post('/logout-all', authMiddleware, async (req, res, next) => {
  try {
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { tokenVersion: { increment: 1 }, lastActiveAt: null },
    })
    await writeAudit({ moduleName: 'auth', action: 'LOGOUT', newValue: `${req.user!.email || ''} (all devices)`, userId: req.user!.userId, req })
    res.json({ success: true })
  } catch (err) { next(err) }
})

authRouter.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { role: true, company: true, profile: true }
    })
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(publicUser(user, { isSuperAdmin: user.profile?.isSuperAdmin || false }))
  } catch (err) { next(err) }
})

// Forgot password — generates a reset token (valid 1 hour)
authRouter.post('/forgot-password', async (req, res, next) => {
  try {
    const raw = (req.body?.email || '').toString().trim().toLowerCase()
    if (!raw) return res.status(400).json({ error: 'Email is required' })
    const user = await prisma.user.findUnique({ where: { email: raw } })
    if (!user) return res.status(404).json({ error: 'The given email address was not found.' })
    const now = Date.now()
    if (user.resetToken && user.resetTokenExpires && user.resetTokenExpires.getTime() > now) {
      return res.json({ message: `A reset link was already sent to ${raw}. Please check your inbox.`, email: raw, alreadySent: true, delivered: false })
    }
    const token = crypto.randomUUID()
    const expires = new Date(now + 3600_000)
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpires: expires }
    })
    const baseUrl = req.headers.origin || 'http://localhost:3001'
    const resetLink = `${baseUrl}/reset-password?token=${token}`
    const sent = await sendMail({
      to: raw,
      subject: 'Reset your BizForce password',
      html: `<p>Hello,</p><p>We received a request to reset your password.</p><p><a href="${resetLink}">Click here to reset your password</a></p><p>This link expires in 1 hour. If you did not request this, you can safely ignore this email.</p>`,
      companyId: user.companyId,
      fromOverride: await getSmtpConfig(null),
    })
    console.log(`[RESET] ${sent.delivered ? 'Email sent' : 'Email logged (SMTP not configured)'}`)
    res.json({ message: 'If that email exists, a reset link has been sent.', email: raw, delivered: sent.delivered })
  } catch (err) { next(err) }
})

// Reset password
authRouter.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body
    if (!token || !password) return res.status(400).json({ error: 'Token and password are required' })
    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetTokenExpires: { gte: new Date() } }
    })
    if (!user) return res.status(400).json({ error: 'Invalid or expired reset token' })
    const policyError = await validatePassword(user.companyId, password)
    if (policyError) return res.status(400).json({ error: policyError })
    const hashed = await bcrypt.hash(password, 10)
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, resetToken: null, resetTokenExpires: null, failedLoginAttempts: 0, lockedUntil: null }
    })
    res.json({ message: 'Password has been reset successfully.' })
  } catch (err) { next(err) }
})

authRouter.put('/me', authMiddleware, async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, mobile, title, department, timezone, language, password, avatar, addressStreet, addressCity, addressState, addressCountry, addressPostalCode, dateFormat, hourFormat, startOfWeek, defaultModule, pbxExtension, sidebarColor } = req.body
    const sidebarColors = new Set(['vtiger', 'navy', 'graphite', 'emerald', 'burgundy'])
    if (sidebarColor !== undefined && !sidebarColors.has(sidebarColor)) return res.status(400).json({ error: 'Invalid sidebar color' })
    const data: any = {
      ...(firstName !== undefined && { firstName }),
      ...(lastName !== undefined && { lastName }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
      ...(mobile !== undefined && { mobile }),
      ...(title !== undefined && { title }),
      ...(department !== undefined && { department }),
      ...(timezone !== undefined && { timezone }),
      ...(language !== undefined && { language }),
      ...(avatar !== undefined && { avatar }),
      ...(addressStreet !== undefined && { addressStreet }),
      ...(addressCity !== undefined && { addressCity }),
      ...(addressState !== undefined && { addressState }),
      ...(addressCountry !== undefined && { addressCountry }),
      ...(addressPostalCode !== undefined && { addressPostalCode }),
      ...(dateFormat !== undefined && { dateFormat }),
      ...(hourFormat !== undefined && { hourFormat }),
      ...(startOfWeek !== undefined && { startOfWeek }),
      ...(defaultModule !== undefined && { defaultModule }),
      ...(pbxExtension !== undefined && { pbxExtension }),
      ...(sidebarColor !== undefined && { sidebarColor }),
    }
    if (password) {
      const policyError = await validatePassword(req.user!.companyId, password)
      if (policyError) return res.status(400).json({ error: policyError })
      data.password = await bcrypt.hash(password, 10)
    }
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data
    })
    res.json(publicUser(user))
  } catch (err) { next(err) }
})

authRouter.put('/me/onboarding', authMiddleware, async (req, res, next) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: { hasCompletedOnboarding: true },
    })
    res.json({ success: true, hasCompletedOnboarding: true })
  } catch (err) { next(err) }
})

authRouter.put('/me/onboarding/reset', authMiddleware, async (req, res, next) => {
  try {
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { hasCompletedOnboarding: false },
    })
    res.json({ success: true, hasCompletedOnboarding: false })
  } catch (err) { next(err) }
})

authRouter.put('/me/quickstart', authMiddleware, async (req, res, next) => {
  try {
    const { language, timezone, dateFormat } = req.body || {}
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: {
        hasCompletedQuickStart: true,
        ...(language ? { language } : {}),
        ...(timezone ? { timezone } : {}),
        ...(dateFormat ? { dateFormat } : {}),
      },
    })
    res.json({ success: true, hasCompletedQuickStart: true })
  } catch (err) { next(err) }
})

authRouter.get('/me/dashboard', authMiddleware, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { dashboardConfig: true }
    })
    res.json({ config: user?.dashboardConfig || null })
  } catch (err) { next(err) }
})

authRouter.put('/me/dashboard', authMiddleware, async (req, res, next) => {
  try {
    const { config } = req.body
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { dashboardConfig: config == null ? null : config }
    })
    res.json({ success: true })
  } catch (err) { next(err) }
})

authRouter.get('/me/favorites', authMiddleware, async (req, res, next) => {
  try {
    const rows = await prisma.$queryRaw<Array<{ favoriteModules: unknown }>>`SELECT "favoriteModules" FROM "User" WHERE id = ${req.user!.userId} LIMIT 1`
    const favorites = rows[0]?.favoriteModules
    const configured = Array.isArray(favorites)
    res.json({ data: configured ? favorites : [], configured })
  } catch (err) { next(err) }
})

authRouter.put('/me/favorites', authMiddleware, async (req, res, next) => {
  try {
    const requested = Array.isArray(req.body?.modules) ? req.body.modules : null
    if (!requested) return res.status(400).json({ error: 'Modules must be an array' })
    const modules = [...new Set(requested.map((value: unknown) => String(value).trim().toLowerCase()).filter((value: string) => /^[a-z][a-z0-9_-]{0,49}$/.test(value)))].slice(0, 30)
    await prisma.$executeRaw`UPDATE "User" SET "favoriteModules" = ${JSON.stringify(modules)}::jsonb, "updatedAt" = NOW() WHERE id = ${req.user!.userId}`
    res.json({ data: modules })
  } catch (err) { next(err) }
})
