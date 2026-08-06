import { ImapFlow } from 'imapflow'
import { XMLParser } from 'fast-xml-parser'
import { prisma } from './prisma'
import { sendMail } from './mailer'
import { getOrgSetting } from './settings'

// ---------------- Recurring Invoices ----------------

function addInterval(d: Date, frequency: string, interval: number): Date {
  const next = new Date(d)
  switch (frequency) {
    case 'daily': next.setDate(next.getDate() + interval); break
    case 'weekly': next.setDate(next.getDate() + interval * 7); break
    case 'monthly': next.setMonth(next.getMonth() + interval); break
    case 'yearly': next.setFullYear(next.getFullYear() + interval); break
    default: next.setMonth(next.getMonth() + interval)
  }
  return next
}

async function buildNextRun(rec: any, from: Date): Promise<Date | null> {
  let next = addInterval(from, rec.frequency, rec.interval || 1)
  if (rec.dayOfMonth && rec.frequency === 'monthly') {
    const year = next.getFullYear()
    const month = next.getMonth()
    const day = Math.min(rec.dayOfMonth, new Date(year, month + 1, 0).getDate())
    next = new Date(year, month, day, 0, 0, 0, 0)
  }
  if (rec.endDate && next > rec.endDate) return null
  return next
}

export async function generateRecurringInvoice(rec: any): Promise<any> {
  const template = await prisma.invoice.findFirst({
    where: { id: rec.invoiceId, companyId: rec.companyId, isActive: true },
    include: { lineItems: { orderBy: { sequence: 'asc' } } },
  })
  if (!template) return null

  const nextRun = await buildNextRun(rec, new Date())
  const newInv = await prisma.invoice.create({
    data: {
      invoiceNo: template.invoiceNo,
      subject: template.subject,
      invoiceDate: new Date(),
      dueDate: template.dueDate && template.invoiceDate ? new Date(Date.now() + (template.dueDate.getTime() - template.invoiceDate.getTime())) : null,
      subTotal: template.subTotal, discount: template.discount, discountPercent: template.discountPercent,
      taxAmount: template.taxAmount, taxType: template.taxType, shipping: template.shipping,
      adjustment: template.adjustment, grandTotal: template.grandTotal,
      accountId: template.accountId, contactId: template.contactId, salesOrderId: template.salesOrderId,
      quoteId: template.quoteId, invoiceStatus: 'Created',
      terms: template.terms, notes: template.notes, description: template.description,
      billingStreet: template.billingStreet, billingCity: template.billingCity,
      billingState: template.billingState, billingCountry: template.billingCountry,
      billingPostalCode: template.billingPostalCode, billingPoBox: template.billingPoBox,
      shippingStreet: template.shippingStreet, shippingCity: template.shippingCity,
      shippingState: template.shippingState, shippingCountry: template.shippingCountry,
      shippingPostalCode: template.shippingPostalCode, shippingPoBox: template.shippingPoBox,
      assignedTo: template.assignedTo, createdBy: rec.createdBy || template.createdBy,
      companyId: rec.companyId,
      lineItems: { create: template.lineItems.map((item: any, idx: number) => ({
        productId: item.productId, serviceId: item.serviceId, itemName: item.itemName,
        qty: item.qty, listPrice: item.listPrice, unitPrice: item.unitPrice,
        discount: item.discount, discountPercent: item.discountPercent,
        tax: item.tax, taxPercent: item.taxPercent, netPrice: item.netPrice,
        lineTotal: item.lineTotal, sequence: idx, description: item.description,
      })) },
    },
  })

  await prisma.recurringInvoice.update({
    where: { id: rec.id },
    data: { lastRun: new Date(), nextRun },
  })
  return newInv
}

export async function runRecurringInvoices(): Promise<number> {
  const due = await prisma.recurringInvoice.findMany({
    where: { isActive: true, nextRun: { lte: new Date() } },
    take: 50,
  })
  let count = 0
  for (const rec of due) {
    try {
      const inv = await generateRecurringInvoice(rec)
      if (inv) count++
    } catch (err) {
      console.error('[RECURRING] generate failed', rec.id, err)
    }
  }
  return count
}

// ---------------- RSS Feeds ----------------

export async function fetchRssFeed(feed: any): Promise<number> {
  const parser = new XMLParser({ ignoreAttributes: false })
  const res = await fetch(feed.url, { headers: { 'User-Agent': 'BizForceCRM-RSS/1.0' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const text = await res.text()
  const doc = parser.parse(text)
  const channel = doc?.rss?.channel || doc?.feed || doc?.RDF?.channel || {}
  const items = channel.item || channel.entry || channel.Channel || []
  const list = Array.isArray(items) ? items : [items]
  let count = 0
  for (const item of list) {
    const title = item.title || item['a10:title'] || 'Untitled'
    const link = item.link || item['a10:link'] || (item['link'] && item['link']['@_href']) || null
    const description = item.description || item.summary || item.content || null
    const author = item.author || item['dc:creator'] || null
    const pubDate = item.pubDate || item.published || item['dc:date'] || null
    try {
      await prisma.rssEntry.upsert({
        where: { feedId_link: { feedId: feed.id, link: String(link || '') } },
        update: {},
        create: {
          feedId: feed.id,
          title: String(title).slice(0, 500),
          link: link ? String(link).slice(0, 1000) : null,
          description: description ? String(description).slice(0, 5000) : null,
          author: author ? String(author).slice(0, 200) : null,
          pubDate: pubDate ? new Date(pubDate) : null,
        },
      })
      count++
    } catch { /* duplicate or invalid */ }
  }
  await prisma.rssFeed.update({ where: { id: feed.id }, data: { lastFetchedAt: new Date() } })
  return count
}

export async function fetchAllRssFeeds(): Promise<number> {
  const feeds = await prisma.rssFeed.findMany({ where: { isActive: true } })
  let count = 0
  for (const feed of feeds) {
    try { count += await fetchRssFeed(feed) } catch (err) { console.error('[RSS] fetch failed', feed.id, err) }
  }
  return count
}

// ---------------- Mailbox sync / Email-to-Ticket ----------------

export async function syncMailbox(mailbox: any): Promise<{ fetched: number; ticketsCreated: number }> {
  const client = new ImapFlow({
    host: mailbox.host,
    port: Number(mailbox.port || 993),
    secure: mailbox.secure !== false,
    auth: { user: mailbox.user, pass: mailbox.pass || '' },
    logger: false,
  })
  const result = { fetched: 0, ticketsCreated: 0 }
  const since = mailbox.lastSyncAt || new Date(Date.now() - 30 * 24 * 3600 * 1000)

  const rule = await prisma.emailToTicketRule.findFirst({
    where: { mailboxId: mailbox.id, isActive: true },
  })

  await client.connect()
  try {
    const lock = await client.getMailboxLock(mailbox.folder || 'INBOX')
    try {
      const seenUids = new Set<string>()
      const existing = await prisma.email.findMany({
        where: { mailboxId: mailbox.id, isRead: true },
        select: { messageId: true },
      })
      existing.forEach(e => e.messageId && seenUids.add(e.messageId))

      for await (const msg of client.fetch({ since }, { uid: true, envelope: true, bodyStructure: true, source: true }, { uid: true })) {
        const messageId = msg.envelope?.messageId || `uid-${msg.uid}`
        if (seenUids.has(messageId)) continue
        let body = ''
        if (msg.source) {
          const raw = msg.source.toString('utf8')
          const plain = extractPlainText(raw)
          body = plain || raw.slice(0, 2000)
        }
        const from = msg.envelope?.from?.[0]
        const to = (msg.envelope?.to || []).map((t: any) => `${t.name ? t.name + ' ' : ''}<${t.address}>`).join(', ')
        const email = await prisma.email.create({
          data: {
            subject: msg.envelope?.subject || '(no subject)',
            body,
            fromEmail: from ? `${from.name ? from.name + ' ' : ''}<${from.address}>` : '',
            toEmails: to,
            emailFlag: 'Received',
            mailboxId: mailbox.id,
            messageId,
            companyId: mailbox.companyId,
          },
        })
        result.fetched++
        seenUids.add(messageId)

        if (rule && from?.address) {
          const created = await applyEmailToTicketRule(rule, email, from.address)
          if (created) result.ticketsCreated++
        }
      }
    } finally {
      await lock.release()
    }
  } finally {
    await client.logout()
  }

  await prisma.mailbox.update({ where: { id: mailbox.id }, data: { lastSyncAt: new Date() } })
  return result
}

function extractPlainText(raw: string): string {
  const match = raw.match(/Content-Type:\s*text\/plain[\s\S]*?(?:\r?\n\r?\n)([\s\S]*?)(?:\r?\n--|\z)/)
  if (match) return match[1].trim().slice(0, 5000)
  const simple = raw.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 5000)
  return simple
}

export async function applyEmailToTicketRule(rule: any, email: any, fromAddress: string): Promise<boolean> {
  const contact = await prisma.contact.findFirst({
    where: {
      companyId: rule.companyId,
      OR: [{ email: fromAddress }, { secondaryEmail: fromAddress }],
    },
  })
  let contactId = contact?.id || null

  if (!contactId && rule.createContactIfMissing) {
    try {
      const created = await prisma.contact.create({
        data: {
          email: fromAddress,
          firstName: (fromAddress.split('@')[0] || 'New').slice(0, 100),
          lastName: 'Customer',
          assignedTo: rule.defaultAssignedTo || null,
          createdBy: rule.defaultAssignedTo || null,
          companyId: rule.companyId,
        },
      })
      contactId = created.id
    } catch { /* skip */ }
  }

  await prisma.ticket.create({
    data: {
      title: email.subject.slice(0, 255) || 'Ticket from email',
      description: email.body || '',
      status: rule.defaultStatus || 'Open',
      priority: rule.defaultPriority || 'Normal',
      contactId,
      assignedTo: rule.defaultAssignedTo || null,
      createdBy: rule.defaultAssignedTo || null,
      companyId: rule.companyId,
    },
  })
  return true
}

export async function syncAllMailboxes(): Promise<number> {
  const mailboxes = await prisma.mailbox.findMany({ where: { isActive: true } })
  let synced = 0
  for (const mb of mailboxes) {
    try { await syncMailbox(mb); synced++ } catch (err) { console.error('[MAILBOX] sync failed', mb.id, err) }
  }
  return synced
}

// ---------------- Payment reminders ----------------

export async function sendPaymentReminders(): Promise<number> {
  const companies = await prisma.company.findMany({ where: { isActive: true } })
  let sent = 0
  for (const company of companies) {
    const cfg = await getOrgSetting(company.id, 'paymentReminders', { enabled: false, daysBefore: 3, template: '' })
    if (!cfg?.enabled) continue
    const soon = new Date(Date.now() + Number(cfg.daysBefore || 3) * 86400000)
    const overdue = await prisma.invoice.findMany({
      where: {
        companyId: company.id, isActive: true,
        invoiceStatus: { in: ['Created', 'Sent'] },
        dueDate: { lte: soon },
      },
      take: 50,
    })
    for (const inv of overdue) {
      try {
        const contact = inv.contactId ? await prisma.contact.findUnique({ where: { id: inv.contactId } }) : null
        const to = contact?.email
        if (!to) continue
        const subject = `Payment reminder: ${inv.invoiceNo || 'Invoice'}`
        const body = `Dear customer,\n\nThis is a reminder that invoice ${inv.invoiceNo || ''} for ${Number(inv.grandTotal || 0).toFixed(2)} is due on ${inv.dueDate ? inv.dueDate.toISOString().slice(0, 10) : 'N/A'}.\n\nThank you,\n${company.name}`
        await sendMail({ to, subject, text: body, companyId: company.id })
        sent++
      } catch { /* skip */ }
    }
  }
  return sent
}
