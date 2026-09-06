const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'not', 'of', 'to', 'in', 'on', 'at', 'for', 'with', 'by', 'is', 'are', 'was', 'were',
  'how', 'do', 'does', 'did', 'can', 'could', 'would', 'should', 'will', 'what', 'when', 'where', 'which', 'who', 'why',
  'i', 'me', 'my', 'you', 'your', 'we', 'us', 'our', 'it', 'its', 'this', 'that', 'these', 'those',
  'please', 'tell', 'about', 'help', 'need', 'want', 'show', 'know', 'also', 'some', 'more', 'from', 'into', 'then',
])

type KnowledgeItem = {
  id: string
  title: string
  summary: string
  category: string
  href: string
  steps: string[]
  keywords: string[]
  aliases: string[]
}

const APP = 'BizForce'

const ITEMS: KnowledgeItem[] = [
  {
    id: 'start', title: 'Get started with BizForce', summary: 'Use the application menu to move between Sales, Marketing, Support, Projects and Inventory; press Ctrl/⌘+K for global search; use New to create records; replay the guided product tour from your profile menu.', category: 'Getting started', href: '/dashboard',
    steps: ['Use the application menu to move between Sales, Marketing, Support, Projects and Inventory.', 'Press Ctrl/⌘ + K to search records across modules.', 'Use New inside a module to create a complete record.', 'Open your profile menu to replay the guided product tour.'],
    keywords: ['start', 'onboarding', 'menu', 'navigation', 'search', 'notifications', 'create', 'tour', 'introduction', 'beginner'],
    aliases: ['get started', 'how do i use', 'how to use', 'what is this app', 'what is bizforce', 'product tour', 'guided tour', 'beginner'],
  },
  {
    id: 'dashboard', title: 'Dashboards and widgets', summary: 'Arrange the widgets on your dashboard, show or hide cards, create team dashboards and set a refresh interval so your KPIs stay up to date.', category: 'Workspace', href: '/dashboard',
    steps: ['Choose the dashboard that matches your work.', 'Select Customize to show, hide or reorder widgets.', 'Create team dashboards when separate views are useful.', 'Set the refresh interval and save your layout.'],
    keywords: ['dashboard', 'widget', 'chart', 'kpi', 'tab', 'customize', 'refresh', 'graph', 'home'],
    aliases: ['add a widget', 'customize my dashboard', 'create a dashboard', 'dashboard'],
  },
  {
    id: 'contacts', title: 'Contacts and organizations', summary: 'Create the organization first when a contact represents a company, then add contact details, status, rating, owner and consent information; use tabs for activities, comments, documents and related records.', category: 'Sales', href: '/contacts',
    steps: ['Create the organization first when a contact represents a company.', 'Add contact details, status, rating, owner and consent information.', 'Use record tabs for activities, comments, documents and related records.', 'Use tags, saved views and filters to segment contacts.'],
    keywords: ['contact', 'contacts', 'account', 'organization', 'company', 'lifecycle', 'rating', 'owner', 'customer', 'people'],
    aliases: ['add a contact', 'create a contact', 'add a customer', 'contact', 'organization name', 'company'],
  },
  {
    id: 'pipeline', title: 'Leads, opportunities and forecasting', summary: 'Capture leads manually, by import or through a webform, record source and status, convert qualified demand into CRM records, and review stage probability, ageing and forecast totals.', category: 'Sales', href: '/leads',
    steps: ['Capture a lead manually, by import or through a webform.', 'Record source, status, score, owner and next follow-up.', 'Convert qualified demand into CRM records.', 'Review stage probability, ageing and forecast totals.'],
    keywords: ['lead', 'leads', 'opportunity', 'opportunities', 'potential', 'pipeline', 'forecast', 'convert', 'probability', 'deal', 'stage'],
    aliases: ['add a lead', 'create a lead', 'forecast', 'pipeline', 'opportunity', 'convert lead', 'sales pipeline'],
  },
  {
    id: 'campaigns', title: 'Campaigns and email marketing', summary: 'Build audiences using contacts, leads, tags or filters, confirm email consent, design the message and schedule, then review delivery, open, click and failure results.', category: 'Marketing', href: '/email-campaigns',
    steps: ['Create an audience using contacts, leads, tags or filters.', 'Confirm email consent and suppression status.', 'Design the message, sender identity and schedule.', 'Review delivery, open, click and failure results.'],
    keywords: ['campaign', 'campaigns', 'email', 'marketing', 'audience', 'opt in', 'consent', 'template', 'bounce', 'open', 'click'],
    aliases: ['create a campaign', 'email campaign', 'mail merge', 'marketing'],
  },
  {
    id: 'automation', title: 'Workflows and automation', summary: 'Choose a module and trigger, add conditions so only the right records qualify, configure updates, notifications or email actions, then test, activate and review the logs.', category: 'Administration', href: '/settings?section=automation',
    steps: ['Choose the module and trigger.', 'Add conditions so only intended records qualify.', 'Configure updates, notifications or email actions.', 'Test, activate and review execution logs.'],
    keywords: ['workflow', 'workflows', 'automation', 'trigger', 'condition', 'action', 'log', 'test', 'rule', 'task'],
    aliases: ['create a workflow', 'automation', 'automatic email', 'workflow'],
  },
  {
    id: 'webforms', title: 'Webforms and lead capture', summary: 'Publish secure forms that create and assign CRM records; choose the module and fields, configure CAPTCHA, assignment and return URL, then embed the code on your website.', category: 'Marketing', href: '/settings?section=automation',
    steps: ['Select a primary module and visitor fields.', 'Configure CAPTCHA, assignment and return URL.', 'Copy the embed code into your website.', 'Submit a test and verify assignment.'],
    keywords: ['webform', 'webforms', 'embed', 'captcha', 'round robin', 'lead capture', 'form', 'website form'],
    aliases: ['create a webform', 'web form', 'lead form', 'embed form'],
  },
  {
    id: 'inventory', title: 'Quotes, orders, invoices and PDFs', summary: 'Maintain products, services, vendors, prices, taxes and currencies; prepare a quotation with line items and terms; create sales and purchase documents; preview, download or email the PDF.', category: 'Inventory', href: '/quotes',
    steps: ['Maintain products, services, vendors, prices, taxes and currencies.', 'Prepare a quotation with line items and terms.', 'Create sales and purchase documents as work progresses.', 'Preview, download or email the PDF.'],
    keywords: ['quote', 'quotes', 'quotation', 'order', 'invoice', 'invoices', 'product', 'service', 'pdf', 'payment', 'currency', 'tax', 'vendor', 'price', 'purchase'],
    aliases: ['create a quote', 'create an invoice', 'pdf', 'invoice', 'quotation', 'letterhead', 'currency'],
  },
  {
    id: 'support', title: 'Cases and customer support', summary: 'Create or receive a case and link the customer, set priority, status, category and owner, collaborate using comments, documents and history, then resolve while keeping the audit trail.', category: 'Support', href: '/tickets',
    steps: ['Create or receive a case and link the customer.', 'Set priority, status, category and owner.', 'Collaborate using comments, documents and history.', 'Resolve the case and retain its audit trail.'],
    keywords: ['ticket', 'tickets', 'case', 'support', 'sla', 'escalation', 'agent', 'portal', 'issue', 'resolution'],
    aliases: ['open a ticket', 'create a ticket', 'ticket', 'sla', 'escalate a case'],
  },
  {
    id: 'layouts', title: 'Modules, layouts and fields', summary: 'Enable the modules your organization needs, create custom fields with the correct type and visibility, configure picklist values and dependencies, then test changes with a standard user.', category: 'Administration', href: '/settings?section=picklists',
    steps: ['Enable the modules your organization needs.', 'Create fields with the correct type and visibility.', 'Configure picklist values and dependencies.', 'Test changes with a standard user.'],
    keywords: ['module', 'modules', 'layout', 'custom field', 'field', 'picklist', 'dependency', 'record layout'],
    aliases: ['add a custom field', 'custom field', 'picklist', 'record layout', 'module'],
  },
  {
    id: 'security', title: 'Users, roles and data security', summary: 'Create roles that reflect your organization, define permissions for modules and sensitive fields, use groups and sharing rules for team access, and review login history and audit logs.', category: 'Administration', href: '/settings?section=users',
    steps: ['Create roles that reflect your organization.', 'Define permissions for modules and sensitive fields.', 'Use groups and sharing rules for team access.', 'Review login history and audit logs.'],
    keywords: ['user', 'users', 'role', 'profile', 'group', 'sharing', 'audit', 'login', 'security', 'permission', 'invite', 'password', '2fa', 'two factor', 'reset'],
    aliases: ['add a user', 'create a user', 'invite a user', 'add user', 'user permission', 'role', 'change password', 'forgot password', '2fa'],
  },
  {
    id: 'email', title: 'Email and communication', summary: 'Connect an approved sending mailbox, create templates and organization signatures, send from a record to keep conversations linked, and monitor delivery errors and authentication.', category: 'Communication', href: '/mailboxes',
    steps: ['Connect an approved sending mailbox.', 'Create templates and organization signatures.', 'Send from a record to keep conversations linked.', 'Monitor delivery errors and authentication.'],
    keywords: ['mailbox', 'mailboxes', 'email', 'template', 'sender', 'smtp', 'tracking', 'signature', 'communication'],
    aliases: ['connect email', 'email signature', 'add a mailbox', 'mailbox', 'smtp'],
  },
  {
    id: 'privacy', title: 'Privacy and safe data handling', summary: 'Collect only what you need for a business purpose, record consent and honor opt-outs, restrict sensitive fields and exports, and use audit and recycle-bin tools to review changes.', category: 'Security', href: '/settings?section=audit',
    steps: ['Collect only information needed for a business purpose.', 'Record consent and honor opt-outs.', 'Restrict sensitive fields and exports.', 'Use audit and recycle-bin tools to review changes.'],
    keywords: ['privacy', 'consent', 'gdpr', 'audit', 'retention', 'security', 'recycle bin', 'export', 'delete data'],
    aliases: ['privacy', 'gdpr', 'consent', 'delete a record', 'recycle bin'],
  },
  {
    id: 'ai', title: 'AI assistant', summary: 'Ask a focused question about CRM information, review source records before acting, never enter passwords or payment credentials, and treat suggestions as assistance, not automatic decisions.', category: 'Productivity', href: '/ai-assistant',
    steps: ['Ask a focused question about CRM information.', 'Review source records before acting.', 'Never enter passwords or payment credentials.', 'Treat suggestions as assistance, not automatic decisions.'],
    keywords: ['ai', 'assistant', 'insight', 'summary', 'lead', 'pipeline', 'automation'],
    aliases: ['ai assistant', 'ai insights', 'what can ai do'],
  },
]

const FAQ_ANSWERS: { pattern: RegExp; answer: string }[] = [
  {
    pattern: /upgrade|plan|subscription|billing|invoice me|pay|credit card/i,
    answer: 'An organisation admin can review subscription and billing information from Settings. If the required billing action is unavailable, select “Talk to an Agent” and our support team will assist without losing this conversation.',
  },
  {
    pattern: /password|sign ?in|login|2fa|two.?factor|totp|authenticator|forgot/i,
    answer: 'You can change your own password and review your security settings from your profile menu. If you cannot sign in, use the “Forgot password?” link on the sign-in page to receive a reset email. For anything else, select “Talk to an Agent” and the support team will help you recover access to your account.',
  },
  {
    pattern: /add.*user|create.*user|invite|new user/i,
    answer: 'Open Settings → Users and select New User. Complete the user details, assign a role and group, then save. Confirm that the selected role has the required module permissions.',
  },
  {
    pattern: /currency/i,
    answer: 'Organisation currencies are managed in Settings → Currencies. The active default currency is used on new quotes and sales documents, while other active currencies remain selectable.',
  },
  {
    pattern: /pdf|letter.?head|logo|print/i,
    answer: 'Configure the active master document in Settings → Master Documents. Its organisation logo, header and footer are then used by supported quotation, order and invoice print views.',
  },
  {
    pattern: /backup|restore|data export|download.*data/i,
    answer: 'Full system backups (database, uploaded files and configuration) are available to Super Admins from Super Admin → Settings → System Backups.',
  },
  {
    pattern: /error|failed|not working|technical|bug|stuck|can.t (login|open|save)|nothing happens/i,
    answer: 'I can help troubleshoot this. Please include the page address, the action you attempted, and the exact error message. You can also select “Talk to an Agent” at any time, and the whole conversation will be passed to a member of the support team.',
  },
  {
    pattern: /report|analytics|chart|export to excel|export to csv/i,
    answer: 'Build reports under Reports — pick the module, choose columns and filters, then save or export the summary. Saved reports can be turned into dashboard widgets so the team sees the same numbers.',
  },
  {
    pattern: /import|upload.*(records|csv|excel)|mass.?create/i,
    answer: 'Open the target module and select Import. Download the template, map your columns to CRM fields, then review preview errors before confirming. Imported contacts, leads and tickets are created in bulk and stay owned by your organisation.',
  },
  {
    pattern: /workflow|automation|trigger|condition|auto.?(assign|send)/i,
    answer: 'Workflows are configured in Settings → Automation. Choose a module and trigger, add conditions, then set the action (update field, notify, assign, or send email), activate and watch the execution logs.',
  },
  {
    pattern: /campaign|newsletter|mail.?merge|mass.?email/i,
    answer: 'Campaigns are managed under Email Campaigns. Build an audience from contacts, leads, tags or filters, confirm consent, design the template, schedule it, and then review delivery and click results.',
  },
]

const VOCAB = new Map<number, Map<string, number>>()

for (const [index, item] of ITEMS.entries()) {
  const weights = new Map<string, number>()
  const add = (text: string, weight: number) => {
    for (const token of tokens(text)) {
      if (STOPWORDS.has(token)) continue
      weights.set(token, (weights.get(token) || 0) + weight)
    }
  }
  add(item.title, 5)
  add(item.keywords.join(' '), 3)
  add(item.summary, 2)
  item.steps.forEach(step => add(step, 1))
  VOCAB.set(index, weights)
}

function tokens(value: string): string[] {
  return value.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
}

function topicLine(item: KnowledgeItem): string {
  const steps = item.steps.map((step, index) => `${index + 1}. ${step}`).join('\n')
  return `${item.title} — ${item.summary}\n\n${steps}`
}

export function answerSupportQuery(content: string): string {
  const lower = content.toLowerCase().trim()
  if (!lower) return DEFAULT_ANSWER

  for (const rule of FAQ_ANSWERS) {
    if (rule.pattern.test(lower)) return rule.answer
  }

  const messageTokens = tokens(content)
  let bestIndex = -1
  let bestScore = 0
  let bestAlias = ''
  for (const [index, item] of ITEMS.entries()) {
    const weights = VOCAB.get(index)!
    let score = 0
    for (const token of messageTokens) score += weights.get(token) || 0
    for (const alias of item.aliases) {
      if (lower.includes(alias)) {
        score += 8
        bestAlias = alias
        break
      }
    }
    if (score > bestScore) {
      bestScore = score
      bestIndex = index
    }
  }

  if (bestIndex >= 0 && bestScore >= 4) {
    const item = ITEMS[bestIndex]
    return `Here’s how to do that in ${APP}:\n\n${topicLine(item)}\n\nIf you need more guidance, select “Talk to an Agent” and a member of the support team will continue this conversation.`
  }

  return DEFAULT_ANSWER
}

const DEFAULT_ANSWER = `I'm the ${APP} support assistant. I can answer questions about this app — getting started, dashboards, contacts and organizations, leads and pipeline, quotes and PDFs, users and permissions, workflows, campaigns, support tickets and more.\n\nTry asking me something like "How do I add a user?", "How do I create a quote?" or "How do I set up a workflow?". If you need a person, select “Talk to an Agent” and the whole conversation will be passed to our support team.`