export const COLORS = {
  primary: '#4f46e5',
  primaryDark: '#4338ca',
  background: '#f8fafc',
  card: '#ffffff',
  border: '#e2e8f0',
  text: '#0f172a',
  textMuted: '#64748b',
  success: '#10b981',
  danger: '#ef4444',
  white: '#ffffff',
}

export const MODULES = [
  { key: 'accounts', label: 'Accounts', primary: 'accountName', icon: '🏢' },
  { key: 'contacts', label: 'Contacts', primary: 'name', icon: '👥' },
  { key: 'leads', label: 'Leads', primary: 'name', icon: '🧲' },
  { key: 'potentials', label: 'Opportunities', primary: 'potentialName', icon: '📈' },
  { key: 'campaigns', label: 'Campaigns', primary: 'campaignName', icon: '📣' },
  { key: 'quotes', label: 'Quotes', primary: 'quoteNo', icon: '📄' },
  { key: 'salesorders', label: 'Sales Orders', primary: 'salesOrderNo', icon: '📦' },
  { key: 'purchaseorders', label: 'Purchase Orders', primary: 'purchaseOrderNo', icon: '🛒' },
  { key: 'invoices', label: 'Invoices', primary: 'invoiceNo', icon: '🧾' },
  { key: 'products', label: 'Products', primary: 'productName', icon: '📦' },
  { key: 'services', label: 'Services', primary: 'serviceName', icon: '🛠️' },
  { key: 'vendors', label: 'Vendors', primary: 'vendorName', icon: '🏷️' },
  { key: 'pricebooks', label: 'Price Books', primary: 'bookName', icon: '💲' },
  { key: 'tickets', label: 'Tickets', primary: 'title', icon: '🎫' },
  { key: 'faq', label: 'FAQ', primary: 'faqNo', icon: '❓' },
  { key: 'servicecontracts', label: 'Service Contracts', primary: 'name', icon: '🤝' },
  { key: 'assets', label: 'Assets', primary: 'assetName', icon: '🔧' },
  { key: 'projects', label: 'Projects', primary: 'projectName', icon: '🗂️' },
  { key: 'projecttasks', label: 'Project Tasks', primary: 'title', icon: '✅' },
  { key: 'projectmilestones', label: 'Project Milestones', primary: 'title', icon: '🎯' },
  { key: 'documents', label: 'Documents', primary: 'title', icon: '📁' },
  { key: 'emails', label: 'Emails', primary: 'subject', icon: '📧' },
  { key: 'emailtemplates', label: 'Email Templates', primary: 'subject', icon: '✉️' },
  { key: 'rssfeeds', label: 'RSS', primary: 'title', icon: '📰' },
]

export function recordTitle(module: string, r: any): string {
  const m = MODULES.find(x => x.key === module)
  if (!m) return r.id
  if (m.key === 'contacts' || m.key === 'leads') {
    const name = [r.firstName, r.lastName].filter(Boolean).join(' ')
    return name || r.email || r.id
  }
  return r[m.primary] || r.id
}

export function recordSubtitle(module: string, r: any): string {
  switch (module) {
    case 'leads': return [r.company, r.leadStatus].filter(Boolean).join(' · ')
    case 'potentials': return [r.stage, r.amount != null ? `$${Number(r.amount).toLocaleString()}` : ''].filter(Boolean).join(' · ')
    case 'tickets': return [r.status, r.priority].filter(Boolean).join(' · ')
    case 'accounts': return r.industry || r.accountType || ''
    case 'contacts': return r.accountName || r.title || ''
    case 'projects': return r.status || ''
    case 'campaigns': return [r.status, r.campaignType].filter(Boolean).join(' · ')
    default: return r.status || ''
  }
}

export const DETAIL_FIELDS: Record<string, string[]> = {
  accounts: ['accountName', 'website', 'phone', 'industry', 'accountType', 'rating', 'annualRevenue', 'employees', 'billingAddress', 'shippingAddress', 'description'],
  contacts: ['firstName', 'lastName', 'email', 'phone', 'mobile', 'accountId', 'leadSource', 'title', 'department', 'description'],
  leads: ['firstName', 'lastName', 'company', 'email', 'phone', 'mobile', 'website', 'leadSource', 'leadStatus', 'industry', 'annualRevenue', 'description'],
  potentials: ['potentialName', 'accountId', 'contactId', 'amount', 'closingDate', 'stage', 'probability', 'nextStep', 'leadSource', 'campaignId', 'description'],
  campaigns: ['campaignName', 'status', 'campaignType', 'expectedRevenue', 'budgetCost', 'actualCost', 'expectedResponseCount', 'expectedSalesCount', 'description'],
  quotes: ['quoteNo', 'accountId', 'contactId', 'quotestage', 'validTill', 'shipping', 'description'],
  invoices: ['invoiceNo', 'accountId', 'contactId', 'invoicestatus', 'invoiceDates', 'description'],
  salesorders: ['salesOrderNo', 'accountId', 'contactId', 'sostatus', 'description'],
  purchaseorders: ['purchaseOrderNo', 'vendorId', 'contactId', 'postatus', 'description'],
  products: ['productName', 'productNo', 'productcategory', 'manufacturer', 'unitPrice', 'usageunit', 'quantityInStock', 'description'],
  services: ['serviceName', 'serviceNo', 'servicecategory', 'unitPrice', 'discontinued', 'description'],
  vendors: ['vendorName', 'email', 'phone', 'website', 'category', 'glAccount', 'description'],
  tickets: ['title', 'ticketNo', 'status', 'priority', 'severity', 'category', 'accountId', 'contactId', 'productId', 'description', 'solution', 'updateLog'],
  faq: ['faqNo', 'status', 'category', 'question', 'answer'],
  servicecontracts: ['name', 'contract_priority', 'contstatus', 'startDate', 'dueDate', 'tracking_unit', 'accountId', 'contactId', 'progress', 'unitPrice'],
  assets: ['assetName', 'tagNumber', 'accountId', 'productId', 'serialNumber', 'dateSold', 'status', 'datesInService', 'dateOutOfService', 'description'],
  projects: ['projectName', 'status', 'projectid', 'accountId', 'contactId', 'targetBudget', 'startDate', 'targetenddate', 'actualenddate', 'progress', 'description'],
  projecttasks: ['title', 'status', 'priority', 'progress', 'projectId', 'startDate', 'endDate', 'description'],
  projectmilestones: ['title', 'status', 'projectId', 'milestoneDate', 'description'],
  documents: ['title', 'folderid', 'filetype', 'filesize', 'description'],
  emailtemplates: ['subject', 'moduleName', 'description'],
}
