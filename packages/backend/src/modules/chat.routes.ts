import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'
import { requireModulePermission } from '../lib/module-permissions'
import multer from 'multer'
import path from 'path'
import fs from 'fs'

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads')
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const chatUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname)
      cb(null, `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`)
    }
  }),
  limits: { fileSize: 25 * 1024 * 1024 },
})

export const chatRouter = Router()

chatRouter.use(authMiddleware)
chatRouter.use(requireModulePermission('chat'))

const ONLINE_WINDOW_MS = 2 * 60 * 1000

const USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  avatar: true,
  title: true,
  isAdmin: true,
  lastActiveAt: true,
} as const

function serializeUser(u: any) {
  return {
    ...u,
    online: !!u.lastActiveAt && Date.now() - new Date(u.lastActiveAt).getTime() < ONLINE_WINDOW_MS,
    lastActiveAt: undefined,
  }
}

function serializeParticipant(p: any) {
  return {
    userId: p.userId,
    unreadCount: p.unreadCount,
    lastReadAt: p.lastReadAt,
    joinedAt: p.joinedAt,
    ...serializeUser(p.user),
  }
}

function serializeMessage(m: any) {
  return {
    id: m.id,
    conversationId: m.conversationId,
    senderId: m.senderId,
    body: m.body,
    attachments: m.attachments || null,
    createdAt: m.createdAt,
    sender: serializeUser(m.sender),
  }
}

function serializeConversation(c: any, currentUserId: string) {
  const my = c.participants.find((p: any) => p.userId === currentUserId)
  const others = c.participants.filter((p: any) => p.userId !== currentUserId).map(serializeParticipant)
  return {
    id: c.id,
    type: c.type,
    name: c.name,
    createdAt: c.createdAt,
    lastMessageAt: c.lastMessageAt,
    unreadCount: my?.unreadCount || 0,
    participants: c.participants.map(serializeParticipant),
    others,
    lastMessage: c.messages?.[0] ? serializeMessage(c.messages[0]) : null,
  }
}

function notFound() {
  return { error: 'Conversation not found' }
}

async function requireMember(conversationId: string, userId: string) {
  return prisma.chatParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
    include: { conversation: true },
  })
}

// GET /api/chat/users — org members you can message (with online status)
chatRouter.get('/users', async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { companyId: req.user!.companyId || null, isActive: true, isAgent: false },
      select: USER_SELECT,
      orderBy: [{ isAdmin: 'desc' }, { firstName: 'asc' }],
    })
    res.json({ data: users.map(serializeUser) })
  } catch (err) { next(err) }
})

// GET /api/chat/conversations — my conversations (ordered by last activity)
chatRouter.get('/conversations', async (req, res, next) => {
  try {
    const userId = req.user!.userId
    const convos = await prisma.chatConversation.findMany({
      where: {
        companyId: req.user!.companyId || undefined,
        participants: { some: { userId } },
      },
      include: {
        participants: { include: { user: { select: USER_SELECT } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1, include: { sender: { select: USER_SELECT } } },
      },
      orderBy: [{ lastMessageAt: 'desc' }, { updatedAt: 'desc' }],
    })
    res.json({ data: convos.map((c) => serializeConversation(c, userId)) })
  } catch (err) { next(err) }
})

// POST /api/chat/conversations — { participantIds: string[], name? } (direct auto-reused, group created)
chatRouter.post('/conversations', async (req, res, next) => {
  try {
    const userId = req.user!.userId
    const companyId = req.user!.companyId || null
    const { participantIds, name } = req.body || {}
    const ids = Array.from(new Set([...(Array.isArray(participantIds) ? participantIds : []), userId]))
      .filter(Boolean) as string[]
    if (ids.length < 2) return res.status(400).json({ error: 'Select at least one other person' })

    const users = await prisma.user.findMany({ where: { id: { in: ids }, companyId: companyId || undefined } })
    if (users.length !== ids.length) return res.status(400).json({ error: 'Some users were not found in this organization' })

    const isDirect = ids.length === 2
    if (isDirect) {
      const otherId = ids.find((id) => id !== userId)!
      const existing = await prisma.chatConversation.findFirst({
        where: {
          companyId: companyId || undefined,
          type: 'direct',
          participants: { every: { userId: { in: ids } } },
        },
        include: {
          participants: { include: { user: { select: USER_SELECT } } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1, include: { sender: { select: USER_SELECT } } },
        },
      })
      if (existing && existing.participants.length === 2) {
        return res.json({ data: serializeConversation(existing, userId) })
      }
      void otherId
    }

    const conversation = await prisma.chatConversation.create({
      data: {
        companyId: companyId || '',
        createdById: userId,
        type: isDirect ? 'direct' : 'group',
        name: isDirect ? null : (name?.trim() || 'Group chat'),
        participants: {
          create: ids.map((id) => ({ userId: id, unreadCount: id === userId ? 0 : 0 })),
        },
      },
      include: {
        participants: { include: { user: { select: USER_SELECT } } },
        messages: { include: { sender: { select: USER_SELECT } } },
      },
    })
    res.status(201).json({ data: serializeConversation(conversation, userId) })
  } catch (err) { next(err) }
})

// GET /api/chat/conversations/:id/messages?after=ISO — messages (optionally only newer than `after`)
chatRouter.get('/conversations/:id/messages', async (req, res, next) => {
  try {
    const userId = req.user!.userId
    const membership = await requireMember(req.params.id, userId)
    if (!membership) return res.status(404).json(notFound())

    const { after } = req.query
    const where: any = { conversationId: req.params.id }
    if (after && !isNaN(Date.parse(String(after)))) where.createdAt = { gt: new Date(String(after)) }

    const messages = await prisma.chatMessage.findMany({
      where,
      include: { sender: { select: USER_SELECT } },
      orderBy: { createdAt: 'asc' },
      take: 200,
    })
    res.json({ data: messages.map(serializeMessage) })
  } catch (err) { next(err) }
})

// POST /api/chat/conversations/:id/messages — { body: string } or multipart with files
chatRouter.post('/conversations/:id/messages', chatUpload.array('files', 10), async (req, res, next) => {
  try {
    const userId = req.user!.userId
    const conversationId = req.params.id
    const membership = await requireMember(conversationId, userId)
    if (!membership) return res.status(404).json(notFound())

    const body = String(req.body?.body || '').trim()
    const files = (req.files as Express.Multer.File[]) || []
    if (!body && files.length === 0) return res.status(400).json({ error: 'Message body or attachments are required' })
    if (body.length > 4000) return res.status(400).json({ error: 'Message is too long (max 4000 characters)' })

    let attachments: any[] = []
    if (files.length > 0) {
      attachments = files.map(f => ({
        fileName: f.originalname,
        storedName: f.filename,
        filePath: `/uploads/${f.filename}`,
        fileSize: f.size,
        fileType: f.mimetype,
      }))
    }

    const now = new Date()
    const message = await prisma.chatMessage.create({
      data: {
        conversationId,
        senderId: userId,
        body: body || (attachments.length > 0 ? '' : ''),
        attachments: attachments.length > 0 ? attachments : undefined,
      },
      include: { sender: { select: USER_SELECT } },
    })
    await prisma.$transaction([
      prisma.chatConversation.update({ where: { id: conversationId }, data: { lastMessageAt: now } }),
      prisma.chatParticipant.updateMany({
        where: { conversationId, userId: { not: userId } },
        data: { unreadCount: { increment: 1 } },
      }),
      prisma.chatParticipant.update({
        where: { conversationId_userId: { conversationId, userId } },
        data: { lastReadAt: now },
      }),
    ])
    res.status(201).json({ data: serializeMessage(message) })
  } catch (err) { next(err) }
})

// POST /api/chat/conversations/:id/read — mark all messages read for me
chatRouter.post('/conversations/:id/read', async (req, res, next) => {
  try {
    const userId = req.user!.userId
    const conversationId = req.params.id
    const membership = await requireMember(conversationId, userId)
    if (!membership) return res.status(404).json(notFound())

    await prisma.chatParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { unreadCount: 0, lastReadAt: new Date() },
    })
    res.json({ success: true })
  } catch (err) { next(err) }
})

// POST /api/chat/conversations/:id/members — add users to a group chat { participantIds: string[] }
chatRouter.post('/conversations/:id/members', async (req, res, next) => {
  try {
    const userId = req.user!.userId
    const conversationId = req.params.id
    const membership = await requireMember(conversationId, userId)
    if (!membership) return res.status(404).json(notFound())
    if (membership.conversation.type !== 'group') return res.status(400).json({ error: 'Only group chats support adding members' })

    const ids = Array.from(new Set((req.body?.participantIds || []).filter(Boolean) as string[]))
    if (!ids.length) return res.status(400).json({ error: 'No users provided' })
    const users = await prisma.user.findMany({
      where: { id: { in: ids }, companyId: membership.conversation.companyId },
    })
    if (users.length !== ids.length) return res.status(400).json({ error: 'Some users were not found in this organization' })

    await prisma.chatParticipant.createMany({
      data: ids.map((id) => ({ conversationId, userId: id })),
      skipDuplicates: true,
    })
    const conversation = await prisma.chatConversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: { include: { user: { select: USER_SELECT } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1, include: { sender: { select: USER_SELECT } } },
      },
    })
    res.json({ data: conversation ? serializeConversation(conversation, userId) : null })
  } catch (err) { next(err) }
})

// DELETE /api/chat/conversations/:id/members/:memberUserId — remove a member (group chat)
chatRouter.delete('/conversations/:id/members/:memberUserId', async (req, res, next) => {
  try {
    const userId = req.user!.userId
    const conversationId = req.params.id
    const memberUserId = req.params.memberUserId
    const membership = await requireMember(conversationId, userId)
    if (!membership) return res.status(404).json(notFound())
    if (membership.conversation.type !== 'group') return res.status(400).json({ error: 'Only group chats support removing members' })
    if (memberUserId !== userId && membership.conversation.createdById !== userId) {
      return res.status(403).json({ error: 'Only the chat owner can remove other members' })
    }

    await prisma.chatParticipant.deleteMany({ where: { conversationId, userId: memberUserId } })
    const remaining = await prisma.chatParticipant.count({ where: { conversationId } })
    if (remaining === 0) {
      await prisma.chatConversation.delete({ where: { id: conversationId } })
      return res.json({ success: true, deleted: true })
    }
    res.json({ success: true })
  } catch (err) { next(err) }
})

// DELETE /api/chat/conversations/:id — leave the conversation
chatRouter.delete('/conversations/:id', async (req, res, next) => {
  try {
    const userId = req.user!.userId
    const conversationId = req.params.id
    const membership = await requireMember(conversationId, userId)
    if (!membership) return res.status(404).json(notFound())

    await prisma.chatParticipant.deleteMany({ where: { conversationId, userId } })
    const remaining = await prisma.chatParticipant.count({ where: { conversationId } })
    if (remaining === 0) {
      await prisma.chatConversation.delete({ where: { id: conversationId } })
      return res.json({ success: true, deleted: true })
    }
    res.json({ success: true })
  } catch (err) { next(err) }
})
