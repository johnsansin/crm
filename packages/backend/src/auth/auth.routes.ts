import { Router } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'
import { canLogin, recordLoginFailure, resetLoginFailures, validatePassword } from '../lib/settings'
import { sendMail } from '../lib/mailer'
import { verifyTotp } from '../lib/otp'
import { getClientIp, writeAudit } from '../lib/audit'

const JWT_SECRET = process.env.JWT_SECRET || 'bizforce-jwt-secret-dev-2026'

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
    { userId: user.id, email: user.email, isAdmin: user.isAdmin, companyId: user.companyId, isSuperAdmin, roleId: user.roleId },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
  return { token, isSuperAdmin }
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
    const { email, password } = req.body
    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true, profile: true }
    })
    if (!user || !user.isActive) {
      await writeAudit({ moduleName: 'auth', action: 'LOGIN_FAILED', newValue: email || '', req })
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    if (user.companyId) {
      const company = await prisma.company.findUnique({ where: { id: user.companyId } })
      if (company && !company.isActive) {
        return res.status(403).json({ error: 'Organization is deactivated. Contact your super admin.' })
      }
    }
    const result = await verifyCredentials(user, password, req)
    if (!result.ok) return res.status(401).json({ error: result.error })

    // 2FA: issue a one-time session challenge
    if (user.twoFactorEnabled) {
      const { password: _, profile: p, ...userData } = user
      return res.json({
        requires2FA: true,
        userId: user.id,
        user: { ...userData, isSuperAdmin: p?.isSuperAdmin || false },
      })
    }

    await resetLoginFailures(user.id)
    await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } })
    await recordLogin(req, user)
    await writeAudit({ moduleName: 'auth', action: 'LOGIN', newValue: user.email, userId: user.id, req })

    const { token, isSuperAdmin } = await issueToken(user)
    const { password: _, profile: p, ...userData } = user
    res.json({ token, user: { ...userData, isSuperAdmin } })
  } catch (err) { next(err) }
})

authRouter.post('/login/2fa', async (req, res, next) => {
  try {
    const { userId, code } = req.body
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
    }
    if (!user.twoFactorSecret || !verifyTotp(user.twoFactorSecret, code)) {
      return res.status(401).json({ error: 'Invalid or expired verification code' })
    }
    await resetLoginFailures(user.id)
    await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } })
    await recordLogin(req, user)
    await writeAudit({ moduleName: 'auth', action: 'LOGIN', newValue: user.email, userId: user.id, req })

    const { token, isSuperAdmin } = await issueToken(user)
    const { password: _, profile: p, ...userData } = user
    res.json({ token, user: { ...userData, isSuperAdmin } })
  } catch (err) { next(err) }
})

authRouter.post('/register', async (req, res, next) => {
  try {
    const { userName, email, firstName, lastName, password, companyName } = req.body
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { userName }] }
    })
    if (existing) {
      return res.status(400).json({ error: 'User already exists' })
    }

    const company = await prisma.company.create({
      data: { name: companyName || `${firstName}'s Organization` }
    })

    const modules = ['accounts', 'contacts', 'leads', 'potentials', 'campaigns', 'products', 'services', 'vendors', 'pricebooks', 'quotes', 'salesorders', 'purchaseorders', 'invoices', 'tickets', 'faq', 'documents', 'emails', 'emailtemplates', 'projects', 'projecttasks', 'projectmilestones', 'assets', 'servicecontracts', 'smsnotifier', 'payments', 'recurringinvoices', 'calllogs', 'reports', 'mailboxes', 'rssfeeds']

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

    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        userName,
        email,
        firstName,
        lastName,
        password: hashed,
        isAdmin: true,
        roleId: ceo.id,
        companyId: company.id
      },
      include: { company: true }
    })

    await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } })
    await recordLogin(req, user)
    await writeAudit({ moduleName: 'auth', action: 'LOGIN', newValue: user.email, userId: user.id, req })

    const token = jwt.sign(
      { userId: user.id, email: user.email, isAdmin: user.isAdmin, companyId: user.companyId, roleId: user.roleId },
      JWT_SECRET,
      { expiresIn: '7d' }
    )
    const { password: _, ...userData } = user
    res.status(201).json({ token, user: { ...userData, isSuperAdmin: false } })
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
    const { password: _, profile: p, ...userData } = user
    res.json({ ...userData, isSuperAdmin: p?.isSuperAdmin || false })
  } catch (err) { next(err) }
})

// Forgot password — generates a reset token (valid 1 hour)
authRouter.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ error: 'Email is required' })
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return res.json({ message: 'If that email exists, a reset link has been sent.' })
    const token = crypto.randomUUID()
    const expires = new Date(Date.now() + 3600_000)
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpires: expires }
    })
    console.log(`[RESET] Token for ${email}: ${token}`)
    const baseUrl = req.headers.origin || 'http://localhost:5173'
    const resetLink = `${baseUrl}/reset-password?token=${token}`
    const sent = await sendMail({
      to: email,
      subject: 'Reset your BizForce password',
      html: `<p>Hello,</p><p>We received a request to reset your password.</p><p><a href="${resetLink}">Click here to reset your password</a></p><p>This link expires in 1 hour. If you did not request this, you can safely ignore this email.</p>`,
      companyId: user.companyId,
    })
    console.log(`[RESET] ${sent.delivered ? 'Email sent' : 'Email logged (SMTP not configured)'}`)
    res.json({ message: 'If that email exists, a reset link has been sent.' })
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
    const { firstName, lastName, email, phone, mobile, title, department, timezone, language, password, avatar, addressStreet, addressCity, addressState, addressCountry, addressPostalCode, dateFormat, hourFormat, startOfWeek, defaultModule, currencyCode } = req.body
    const data: any = { firstName, lastName, email, phone, mobile, title, department, timezone, language, avatar, addressStreet, addressCity, addressState, addressCountry, addressPostalCode, dateFormat, hourFormat, startOfWeek, defaultModule, currencyCode }
    if (password) {
      const policyError = await validatePassword(req.user!.companyId, password)
      if (policyError) return res.status(400).json({ error: policyError })
      data.password = await bcrypt.hash(password, 10)
    }
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data
    })
    const { password: _, ...userData } = user
    res.json(userData)
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
