export interface ModuleConfig {
  modelName: string
  label: string
  parent: string
  icon: string
  sequence: number
  searchFields: string[]
  listFields: string[]
  relatedModules: string[]
}

const modules: Record<string, ModuleConfig> = {
  accounts: {
    modelName: 'account',
    label: 'Accounts',
    parent: 'Marketing',
    icon: 'Building2',
    sequence: 10,
    searchFields: ['accountName', 'email', 'phone'],
    listFields: ['accountName', 'email', 'phone', 'industry', 'accountType'],
    relatedModules: ['contacts', 'potentials']
  },
  contacts: {
    modelName: 'contact',
    label: 'Contacts',
    parent: 'Marketing',
    icon: 'Users',
    sequence: 20,
    searchFields: ['firstName', 'lastName', 'email', 'phone'],
    listFields: ['firstName', 'lastName', 'email', 'phone', 'accountName'],
    relatedModules: ['accounts', 'potentials']
  },
  leads: {
    modelName: 'lead',
    label: 'Leads',
    parent: 'Marketing',
    icon: 'UserPlus',
    sequence: 30,
    searchFields: ['firstName', 'lastName', 'email', 'company', 'phone'],
    listFields: ['firstName', 'lastName', 'company', 'email', 'leadStatus', 'leadSource'],
    relatedModules: ['campaigns']
  },
  potentials: {
    modelName: 'potential',
    label: 'Opportunities',
    parent: 'Sales',
    icon: 'TrendingUp',
    sequence: 40,
    searchFields: ['potentialName', 'potentialNo'],
    listFields: ['potentialName', 'amount', 'stage', 'closingDate', 'probability'],
    relatedModules: ['accounts', 'contacts', 'campaigns']
  },
  campaigns: {
    modelName: 'campaign',
    label: 'Campaigns',
    parent: 'Marketing',
    icon: 'Megaphone',
    sequence: 5,
    searchFields: ['campaignName', 'campaignType'],
    listFields: ['campaignName', 'campaignType', 'status', 'startDate', 'endDate'],
    relatedModules: ['leads', 'potentials']
  },
  products: {
    modelName: 'product',
    label: 'Products',
    parent: 'Inventory',
    icon: 'Package',
    sequence: 50,
    searchFields: ['productName', 'productNo'],
    listFields: ['productName', 'productCategory', 'unitPrice', 'qtyInStock'],
    relatedModules: []
  },
  services: {
    modelName: 'service',
    label: 'Services',
    parent: 'Inventory',
    icon: 'Wrench',
    sequence: 55,
    searchFields: ['serviceName', 'serviceNo'],
    listFields: ['serviceName', 'serviceCategory', 'unitPrice'],
    relatedModules: []
  },
  vendors: {
    modelName: 'vendor',
    label: 'Vendors',
    parent: 'Inventory',
    icon: 'Truck',
    sequence: 60,
    searchFields: ['vendorName', 'email', 'phone'],
    listFields: ['vendorName', 'email', 'phone', 'category'],
    relatedModules: []
  },
  pricebooks: {
    modelName: 'priceBook',
    label: 'Price Books',
    parent: 'Inventory',
    icon: 'BookOpen',
    sequence: 65,
    searchFields: ['priceBookName'],
    listFields: ['priceBookName'],
    relatedModules: ['products']
  },
  quotes: {
    modelName: 'quote',
    label: 'Quotes',
    parent: 'Sales',
    icon: 'FileText',
    sequence: 70,
    searchFields: ['quoteNo', 'subject'],
    listFields: ['quoteNo', 'subject', 'grandTotal', 'quoteStage', 'validUntil'],
    relatedModules: ['accounts', 'contacts', 'potentials']
  },
  salesorders: {
    modelName: 'salesOrder',
    label: 'Sales Orders',
    parent: 'Sales',
    icon: 'ShoppingCart',
    sequence: 80,
    searchFields: ['salesOrderNo', 'subject'],
    listFields: ['salesOrderNo', 'subject', 'grandTotal', 'soStatus'],
    relatedModules: ['accounts', 'contacts', 'quotes']
  },
  purchaseorders: {
    modelName: 'purchaseOrder',
    label: 'Purchase Orders',
    parent: 'Inventory',
    icon: 'ClipboardList',
    sequence: 85,
    searchFields: ['purchaseOrderNo', 'subject'],
    listFields: ['purchaseOrderNo', 'subject', 'grandTotal', 'poStatus'],
    relatedModules: ['vendors']
  },
  invoices: {
    modelName: 'invoice',
    label: 'Invoices',
    parent: 'Inventory',
    icon: 'Receipt',
    sequence: 90,
    searchFields: ['invoiceNo', 'subject'],
    listFields: ['invoiceNo', 'subject', 'grandTotal', 'invoiceStatus'],
    relatedModules: ['accounts', 'contacts', 'salesorders']
  },
  tickets: {
    modelName: 'ticket',
    label: 'Tickets',
    parent: 'Support',
    icon: 'LifeBuoy',
    sequence: 100,
    searchFields: ['ticketNo', 'title'],
    listFields: ['ticketNo', 'title', 'status', 'priority', 'severity'],
    relatedModules: ['contacts', 'accounts', 'products']
  },
  faq: {
    modelName: 'faq',
    label: 'FAQ',
    parent: 'Support',
    icon: 'HelpCircle',
    sequence: 110,
    searchFields: ['title', 'category'],
    listFields: ['title', 'category', 'status'],
    relatedModules: []
  },
  documents: {
    modelName: 'document',
    label: 'Documents',
    parent: 'Tools',
    icon: 'File',
    sequence: 120,
    searchFields: ['title', 'fileName'],
    listFields: ['title', 'fileName', 'fileType'],
    relatedModules: []
  },
  emails: {
    modelName: 'email',
    label: 'Emails',
    parent: 'Tools',
    icon: 'Mail',
    sequence: 130,
    searchFields: ['subject', 'fromEmail'],
    listFields: ['subject', 'fromEmail', 'toEmails', 'dateSent'],
    relatedModules: []
  },
  emailtemplates: {
    modelName: 'emailTemplate',
    label: 'Email Templates',
    parent: 'Tools',
    icon: 'FileText',
    sequence: 135,
    searchFields: ['templateName', 'subject'],
    listFields: ['templateName', 'subject', 'module'],
    relatedModules: []
  },
  projects: {
    modelName: 'project',
    label: 'Projects',
    parent: 'Projects',
    icon: 'FolderKanban',
    sequence: 140,
    searchFields: ['projectName', 'projectNo'],
    listFields: ['projectName', 'status', 'priority', 'progress', 'startDate'],
    relatedModules: ['contacts', 'accounts']
  },
  projecttasks: {
    modelName: 'projectTask',
    label: 'Project Tasks',
    parent: 'Projects',
    icon: 'CheckSquare',
    sequence: 145,
    searchFields: ['title'],
    listFields: ['title', 'status', 'priority', 'progress', 'endDate'],
    relatedModules: ['projects']
  },
  projectmilestones: {
    modelName: 'projectMilestone',
    label: 'Project Milestones',
    parent: 'Projects',
    icon: 'Flag',
    sequence: 150,
    searchFields: ['title', 'milestoneNo'],
    listFields: ['title', 'milestoneDate', 'status', 'progress'],
    relatedModules: ['projects']
  },
  assets: {
    modelName: 'asset',
    label: 'Assets',
    parent: 'Support',
    icon: 'HardDrive',
    sequence: 160,
    searchFields: ['assetName', 'assetNo', 'serialNo'],
    listFields: ['assetName', 'serialNo', 'status', 'datesInService'],
    relatedModules: ['accounts', 'contacts', 'products']
  },
  servicecontracts: {
    modelName: 'serviceContract',
    label: 'Service Contracts',
    parent: 'Support',
    icon: 'FileSignature',
    sequence: 170,
    searchFields: ['contractName', 'contractNo'],
    listFields: ['contractName', 'contractType', 'status', 'startDate', 'endDate'],
    relatedModules: ['accounts', 'contacts']
  },
  smsnotifier: {
    modelName: 'smsNotifier',
    label: 'SMS Notifier',
    parent: 'Sales',
    icon: 'MessageSquare',
    sequence: 175,
    searchFields: ['toNumber', 'message'],
    listFields: ['toNumber', 'message', 'status', 'createdAt'],
    relatedModules: []
  },
  payments: {
    modelName: 'payment',
    label: 'Payments',
    parent: 'Sales',
    icon: 'CreditCard',
    sequence: 95,
    searchFields: ['reference', 'invoiceId'],
    listFields: ['amount', 'paymentDate', 'method', 'reference'],
    relatedModules: ['invoices']
  },
  recurringinvoices: {
    modelName: 'recurringInvoice',
    label: 'Recurring Invoices',
    parent: 'Sales',
    icon: 'Repeat',
    sequence: 96,
    searchFields: ['invoiceId', 'frequency'],
    listFields: ['frequency', 'interval', 'nextRun', 'isActive'],
    relatedModules: ['invoices']
  },
  calllogs: {
    modelName: 'callLog',
    label: 'Phone Calls',
    parent: 'Support',
    icon: 'Phone',
    sequence: 165,
    searchFields: ['fromNumber', 'toNumber', 'notes'],
    listFields: ['fromNumber', 'toNumber', 'direction', 'callTime', 'status', 'duration'],
    relatedModules: []
  },
  reports: {
    modelName: 'report',
    label: 'Reports',
    parent: 'Tools',
    icon: 'BarChart3',
    sequence: 155,
    searchFields: ['name'],
    listFields: ['name', 'moduleName', 'reportType'],
    relatedModules: []
  },
  mailboxes: {
    modelName: 'mailbox',
    label: 'Mailboxes',
    parent: 'Tools',
    icon: 'Inbox',
    sequence: 156,
    searchFields: ['name', 'user'],
    listFields: ['name', 'host', 'lastSyncAt'],
    relatedModules: []
  },
  rssfeeds: {
    modelName: 'rssFeed',
    label: 'RSS Feeds',
    parent: 'Tools',
    icon: 'Rss',
    sequence: 158,
    searchFields: ['name', 'url'],
    listFields: ['name', 'category', 'lastFetchedAt'],
    relatedModules: []
  },
  currencies: {
    modelName: 'currency',
    label: 'Currencies',
    parent: '',
    icon: 'Banknote',
    sequence: 200,
    searchFields: ['name', 'code'],
    listFields: ['name', 'code', 'symbol', 'rate'],
    relatedModules: []
  },
  taxinfo: {
    modelName: 'taxInfo',
    label: 'Tax Info',
    parent: '',
    icon: 'Percent',
    sequence: 210,
    searchFields: ['taxName'],
    listFields: ['taxName', 'taxRate'],
    relatedModules: []
  },
  roles: {
    modelName: 'role',
    label: 'Roles',
    parent: '',
    icon: 'Shield',
    sequence: 220,
    searchFields: ['name'],
    listFields: ['name', 'description'],
    relatedModules: ['rolepermissions']
  },
  usergroups: {
    modelName: 'userGroup',
    label: 'User Groups',
    parent: '',
    icon: 'Users',
    sequence: 230,
    searchFields: ['name'],
    listFields: ['name', 'description'],
    relatedModules: []
  },
  rolepermissions: {
    modelName: 'rolePermission',
    label: 'Role Permissions',
    parent: '',
    icon: 'Shield',
    sequence: 225,
    searchFields: ['moduleName'],
    listFields: ['moduleName', 'view', 'create', 'edit', 'delete'],
    relatedModules: []
  }
}

export function setupModules(): string[] {
  return Object.keys(modules)
}

export function getModuleConfig(moduleName: string): ModuleConfig | undefined {
  return modules[moduleName]
}

export function getAllModuleConfigs(): Record<string, ModuleConfig> {
  return modules
}
