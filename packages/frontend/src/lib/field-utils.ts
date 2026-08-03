export interface FieldConfig {
  name: string
  type: string
  required?: boolean
}

export interface FieldTab {
  label: string
  fields: string[]
}

function labelFromName(name: string): string {
  const labels: Record<string, string> = {
    accountName: 'Account Name', accountNo: 'Account Number', parentId: 'Parent Account',
    email2: 'Secondary Email', emailOptOut: 'Email Opt Out', notifyOwner: 'Notify Owner',
    accountType: 'Account Type', sicCode: 'SIC Code', tickerSymbol: 'Ticker Symbol',
    annualRevenue: 'Annual Revenue', billingPoBox: 'Billing PO Box', shippingPoBox: 'Shipping PO Box',
    billingStreet: 'Billing Street', billingCity: 'Billing City', billingState: 'Billing State',
    billingCountry: 'Billing Country', billingPostalCode: 'Billing Postal Code',
    shippingStreet: 'Shipping Street', shippingCity: 'Shipping City', shippingState: 'Shipping State',
    shippingCountry: 'Shipping Country', shippingPostalCode: 'Shipping Postal Code',
    firstName: 'First Name', lastName: 'Last Name', secondaryEmail: 'Secondary Email',
    homePhone: 'Home Phone', otherPhone: 'Other Phone', assistantPhone: 'Assistant Phone',
    reportsTo: 'Reports To', leadSource: 'Lead Source', supportStartDate: 'Support Start Date',
    supportEndDate: 'Support End Date', mailingPoBox: 'Mailing PO Box', otherPoBox: 'Other PO Box',
    mailingStreet: 'Mailing Street', mailingCity: 'Mailing City', mailingState: 'Mailing State',
    mailingCountry: 'Mailing Country', mailingPostalCode: 'Mailing Postal Code',
    otherStreet: 'Other Street', otherCity: 'Other City', otherState: 'Other State',
    otherCountry: 'Other Country', otherPostalCode: 'Other Postal Code',
    noOfEmployees: 'Employees', leadStatus: 'Lead Status', postalCode: 'Postal Code', poBox: 'PO Box',
    potentialName: 'Opportunity Name', closingDate: 'Closing Date',
    forecastCategory: 'Forecast Category', outcomeAnalysis: 'Outcome Analysis', nextStep: 'Next Step',
    campaignName: 'Campaign Name', campaignType: 'Campaign Type', expectedRevenue: 'Expected Revenue',
    actualCost: 'Actual Cost', expectedResponse: 'Expected Response', targetSize: 'Target Size',
    targetAudience: 'Target Audience', expectedROI: 'Expected ROI', actualROI: 'Actual ROI',
    expectedCount: 'Expected Count', actualCount: 'Actual Count',
    productName: 'Product Name', productNo: 'Product Number', productCategory: 'Category',
    unitPrice: 'Unit Price', costPrice: 'Cost Price', commissionRate: 'Commission Rate',
    commissionMethod: 'Commission Method', qtyInStock: 'Qty In Stock', qtyOnOrder: 'Qty On Order',
    qtyInDemand: 'Qty In Demand', reorderLevel: 'Reorder Level', usageUnit: 'Usage Unit',
    packSize: 'Pack Size', salesStartDate: 'Sales Start Date', salesEndDate: 'Sales End Date',
    startDate: 'Start Date', endDate: 'End Date', expiryDate: 'Expiry Date',
    serialNo: 'Serial Number', mfrPartNo: 'MFR Part Number', vendorPartNo: 'Vendor Part Number',
    productSheet: 'Product Sheet', glAccount: 'GL Account', taxClass: 'Tax Class', vendorId: 'Vendor',
    serviceName: 'Service Name', serviceNo: 'Service Number', serviceCategory: 'Category',
    vendorName: 'Vendor Name', priceBookName: 'Price Book Name',
    quoteNo: 'Quote Number', validUntil: 'Valid Until', grandTotal: 'Grand Total',
    subTotal: 'Sub Total', shippingHandling: 'Shipping & Handling', inventoryManager: 'Inventory Manager',
    taxType: 'Tax Type', quoteStage: 'Quote Stage',
    salesOrderNo: 'Sales Order No', soStatus: 'SO Status', customerNo: 'Customer No',
    purchaseOrderNo: 'Purchase Order No', salesCommission: 'Sales Commission', exciseDuty: 'Excise Duty',
    pending: 'Pending', enableRecurring: 'Enable Recurring',
    poStatus: 'PO Status',
    invoiceNo: 'Invoice No', invoiceDate: 'Invoice Date', dueDate: 'Due Date',
    invoiceStatus: 'Invoice Status',
    ticketNo: 'Ticket No', updateLog: 'Update Log', versionId: 'Version ID', fromMail: 'From Mail',
    noteContent: 'Note Content', fileLocationType: 'File Location Type',
    fileDownloadCount: 'Download Count', fileStatus: 'File Status', fileVersion: 'File Version',
    emailFlag: 'Email Flag', parentModule: 'Parent Module',
    toEmails: 'To', ccEmails: 'CC', bccEmails: 'BCC', fromEmail: 'From', dateSent: 'Date Sent',
    templateName: 'Template Name', folderName: 'Folder Name',
    projectName: 'Project Name', projectType: 'Project Type', targetBudget: 'Target Budget',
    actualBudget: 'Actual Budget', actualEndDate: 'Actual End Date', projectId: 'Project',
    projectTaskType: 'Task Type',
    milestoneDate: 'Milestone Date', milestoneType: 'Milestone Type',
    milestoneNo: 'Milestone No', plannedHours: 'Planned Hours', actualHours: 'Actual Hours', sequence: 'Sequence',
    assetName: 'Asset Name', tagNumber: 'Tag Number', dateSold: 'Date Sold',
    shippingMethod: 'Shipping Method', shippingTrackingNumber: 'Tracking Number', invoiceId: 'Invoice',
    contractName: 'Contract Name', contractNo: 'Contract Number', contractType: 'Contract Type',
    trackingUnit: 'Tracking Unit', totalUnits: 'Total Units', usedUnits: 'Used Units',
    renewalDate: 'Renewal Date', relatedTo: 'Related To', relatedModule: 'Related Module',
    serviceContracts: 'Service Contracts', smsnotifier: 'SMS Notifier', toNumber: 'To Number',
    fileData: 'File', fileName: 'File Name', fileType: 'File Type',
    answer: 'Answer', body: 'Body', subject: 'Subject', title: 'Title',
    terms: 'Terms & Conditions', notes: 'Notes', solution: 'Solution',
    probability: 'Probability (%)', progress: 'Progress (%)', hours: 'Hours', days: 'Days',
    rating: 'Rating', interest: 'Interest', sponsor: 'Sponsor',
    carrier: 'Carrier', weight: 'Weight', manufacturer: 'Manufacturer',
    doNotCall: 'Do Not Call', portal: 'Portal',
    discountPercent: 'Discount (%)', taxAmount: 'Tax Amount', contactId: 'Contact',
    potentialId: 'Potential', accountId: 'Account', quoteId: 'Quote', salesOrderId: 'Sales Order',
  }
  return labels[name] || name.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())
}

function isAddressField(name: string): boolean {
  const addr = ['billing', 'shipping', 'mailing', 'other']
  const parts = ['street', 'city', 'state', 'country', 'postalCode', 'poBox', 'PoBox']
  const raw = name.replace(/[A-Z]/g, c => '_' + c.toLowerCase())
  if (addr.some(a => raw.startsWith(a))) return true
  if (parts.some(p => raw.endsWith(p))) return true
  if (name === 'street' || name === 'city' || name === 'state' || name === 'country' || name === 'postalCode' || name === 'poBox') return true
  return false
}

function isDescriptionField(name: string): boolean {
  return ['description', 'terms', 'notes', 'solution', 'answer', 'body', 'noteContent', 'updateLog'].includes(name)
}

function isFinancialField(name: string): boolean {
  return ['amount', 'unitPrice', 'costPrice', 'grandTotal', 'subTotal', 'discount', 'adjustment',
    'shipping', 'shippingHandling', 'taxAmount', 'annualRevenue', 'expectedRevenue', 'budget',
    'actualCost', 'commissionRate', 'salesCommission', 'exciseDuty', 'targetBudget', 'actualBudget',
    'expectedROI', 'actualROI', 'listPrice', 'netPrice', 'total', 'lineTotal', 'commissionPercentage'
  ].includes(name)
}

const moduleTabs: Record<string, FieldTab[]> = {
  accounts: [
    { label: 'Details', fields: ['accountName', 'accountNo', 'parentId', 'website', 'phone', 'otherPhone', 'fax', 'email', 'email2', 'emailOptOut', 'notifyOwner', 'industry', 'accountType', 'ownership', 'rating', 'sicCode', 'tickerSymbol', 'annualRevenue', 'employees'] },
    { label: 'Address', fields: ['billingStreet', 'billingCity', 'billingState', 'billingCountry', 'billingPostalCode', 'billingPoBox', 'shippingStreet', 'shippingCity', 'shippingState', 'shippingCountry', 'shippingPostalCode', 'shippingPoBox'] },
    { label: 'Description', fields: ['description'] },
  ],
  contacts: [
    { label: 'Details', fields: ['firstName', 'lastName', 'email', 'secondaryEmail', 'phone', 'mobile', 'homePhone', 'otherPhone', 'fax', 'title', 'department', 'assistant', 'assistantPhone', 'dob', 'reportsTo', 'leadSource', 'doNotCall', 'portal', 'supportStartDate', 'supportEndDate'] },
    { label: 'Address', fields: ['mailingStreet', 'mailingCity', 'mailingState', 'mailingCountry', 'mailingPostalCode', 'mailingPoBox', 'otherStreet', 'otherCity', 'otherState', 'otherCountry', 'otherPostalCode', 'otherPoBox'] },
    { label: 'Description', fields: ['description'] },
  ],
  leads: [
    { label: 'Details', fields: ['firstName', 'lastName', 'company', 'title', 'email', 'secondaryEmail', 'phone', 'mobile', 'fax', 'website', 'leadSource', 'leadStatus', 'industry', 'annualRevenue', 'noOfEmployees', 'rating', 'interest'] },
    { label: 'Address', fields: ['street', 'city', 'state', 'country', 'postalCode', 'poBox'] },
    { label: 'Description', fields: ['description'] },
  ],
  potentials: [
    { label: 'Details', fields: ['potentialName', 'amount', 'closingDate', 'stage', 'probability', 'type', 'leadSource', 'forecastCategory', 'outcomeAnalysis', 'nextStep'] },
    { label: 'Description', fields: ['description'] },
  ],
  campaigns: [
    { label: 'Details', fields: ['campaignName', 'campaignType', 'status', 'startDate', 'endDate', 'closingDate', 'expectedRevenue', 'budget', 'actualCost', 'expectedResponse', 'targetSize', 'sponsor', 'targetAudience', 'expectedROI', 'actualROI', 'expectedCount', 'actualCount'] },
    { label: 'Description', fields: ['description'] },
  ],
  products: [
    { label: 'Details', fields: ['productName', 'productNo', 'productCategory', 'manufacturer', 'usageUnit', 'weight', 'packSize', 'website', 'serialNo', 'mfrPartNo', 'vendorPartNo', 'productSheet', 'glAccount', 'taxClass', 'vendorId', 'salesStartDate', 'salesEndDate', 'startDate', 'expiryDate', 'supportStartDate', 'supportEndDate'] },
    { label: 'Pricing', fields: ['unitPrice', 'costPrice', 'commissionRate', 'commissionMethod', 'qtyInStock', 'qtyOnOrder', 'qtyInDemand', 'reorderLevel'] },
    { label: 'Description', fields: ['description'] },
  ],
  services: [
    { label: 'Details', fields: ['serviceName', 'serviceNo', 'serviceCategory', 'usageUnit', 'website', 'serialNo', 'glAccount', 'taxClass', 'reorderLevel', 'qtyInStock', 'qtyInDemand'] },
    { label: 'Pricing', fields: ['unitPrice', 'costPrice', 'commissionRate', 'commissionMethod'] },
    { label: 'Description', fields: ['description'] },
  ],
  vendors: [
    { label: 'Details', fields: ['vendorName', 'email', 'phone', 'mobile', 'website', 'category', 'glAccount'] },
    { label: 'Address', fields: ['street', 'city', 'state', 'country', 'postalCode'] },
    { label: 'Description', fields: ['description'] },
  ],
  pricebooks: [
    { label: 'Details', fields: ['priceBookName', 'active'] },
    { label: 'Description', fields: ['description'] },
  ],
  quotes: [
    { label: 'Details', fields: ['subject', 'quoteNo', 'validUntil', 'quoteStage', 'carrier', 'inventoryManager', 'taxType'] },
    { label: 'Financial', fields: ['grandTotal', 'subTotal', 'discount', 'discountPercent', 'adjustment', 'shipping', 'shippingHandling', 'taxAmount', 'total'] },
    { label: 'Address', fields: ['billingStreet', 'billingCity', 'billingState', 'billingCountry', 'billingPostalCode', 'billingPoBox', 'shippingStreet', 'shippingCity', 'shippingState', 'shippingCountry', 'shippingPostalCode', 'shippingPoBox'] },
    { label: 'Terms', fields: ['terms', 'description'] },
  ],
  salesorders: [
    { label: 'Details', fields: ['subject', 'salesOrderNo', 'validUntil', 'soStatus', 'carrier', 'customerNo', 'purchaseOrderNo', 'taxType', 'pending', 'enableRecurring'] },
    { label: 'Financial', fields: ['grandTotal', 'subTotal', 'discount', 'discountPercent', 'adjustment', 'shipping', 'shippingHandling', 'salesCommission', 'exciseDuty', 'taxAmount', 'total'] },
    { label: 'Address', fields: ['billingStreet', 'billingCity', 'billingState', 'billingCountry', 'billingPostalCode', 'billingPoBox', 'shippingStreet', 'shippingCity', 'shippingState', 'shippingCountry', 'shippingPostalCode', 'shippingPoBox'] },
    { label: 'Terms', fields: ['terms', 'description'] },
  ],
  purchaseorders: [
    { label: 'Details', fields: ['subject', 'purchaseOrderNo', 'validUntil', 'poStatus', 'carrier', 'taxType', 'vendorId', 'contactId'] },
    { label: 'Financial', fields: ['grandTotal', 'subTotal', 'discount', 'discountPercent', 'adjustment', 'shipping', 'shippingHandling', 'salesCommission', 'exciseDuty', 'taxAmount', 'total'] },
    { label: 'Address', fields: ['billingStreet', 'billingCity', 'billingState', 'billingCountry', 'billingPostalCode', 'billingPoBox', 'shippingStreet', 'shippingCity', 'shippingState', 'shippingCountry', 'shippingPostalCode', 'shippingPoBox'] },
    { label: 'Terms', fields: ['terms', 'description'] },
  ],
  invoices: [
    { label: 'Details', fields: ['subject', 'invoiceNo', 'invoiceDate', 'dueDate', 'invoiceStatus', 'customerNo', 'purchaseOrderNo', 'taxType'] },
    { label: 'Financial', fields: ['grandTotal', 'subTotal', 'discount', 'discountPercent', 'adjustment', 'shipping', 'shippingHandling', 'salesCommission', 'exciseDuty', 'taxAmount', 'total'] },
    { label: 'Address', fields: ['billingStreet', 'billingCity', 'billingState', 'billingCountry', 'billingPostalCode', 'billingPoBox', 'shippingStreet', 'shippingCity', 'shippingState', 'shippingCountry', 'shippingPostalCode', 'shippingPoBox'] },
    { label: 'Terms', fields: ['notes', 'terms', 'description'] },
  ],
  tickets: [
    { label: 'Details', fields: ['title', 'ticketNo', 'status', 'priority', 'severity', 'category', 'hours', 'days', 'fromMail', 'versionId'] },
    { label: 'Description', fields: ['description', 'solution', 'updateLog'] },
  ],
  faq: [
    { label: 'Details', fields: ['title', 'category', 'status'] },
    { label: 'Content', fields: ['description', 'answer'] },
  ],
  documents: [
    { label: 'Details', fields: ['title', 'fileName', 'fileType', 'fileLocationType', 'fileStatus', 'fileVersion', 'folderId'] },
    { label: 'Content', fields: ['noteContent'] },
  ],
  emails: [
    { label: 'Details', fields: ['subject', 'fromEmail', 'toEmails', 'ccEmails', 'bccEmails', 'emailFlag', 'parentId', 'parentModule'] },
    { label: 'Content', fields: ['body'] },
  ],
  emailtemplates: [
    { label: 'Details', fields: ['templateName', 'subject', 'module', 'folderName'] },
    { label: 'Content', fields: ['body'] },
  ],
  projects: [
    { label: 'Details', fields: ['projectName', 'projectType', 'status', 'priority', 'progress', 'startDate', 'endDate', 'actualEndDate', 'url'] },
    { label: 'Financial', fields: ['targetBudget', 'actualBudget'] },
    { label: 'Description', fields: ['description'] },
  ],
  projecttasks: [
    { label: 'Details', fields: ['projectId', 'title', 'status', 'priority', 'projectTaskType', 'progress', 'hours', 'startDate', 'endDate'] },
    { label: 'Description', fields: ['description'] },
  ],
  projectmilestones: [
    { label: 'Details', fields: ['projectId', 'title', 'milestoneNo', 'status', 'progress', 'milestoneDate', 'milestoneType', 'plannedHours', 'actualHours', 'sequence', 'startDate', 'endDate'] },
    { label: 'Description', fields: ['description'] },
  ],
  assets: [
    { label: 'Details', fields: ['assetName', 'serialNo', 'tagNumber', 'status', 'dateSold', 'shippingMethod', 'shippingTrackingNumber', 'invoiceId'] },
    { label: 'Description', fields: ['description'] },
  ],
  servicecontracts: [
    { label: 'Details', fields: ['contractName', 'contractNo', 'contractType', 'status', 'priority', 'startDate', 'endDate', 'dueDate', 'renewalDate', 'trackingUnit', 'totalUnits', 'usedUnits', 'costPrice', 'relatedTo', 'relatedModule'] },
    { label: 'Description', fields: ['description'] },
  ],
  smsnotifier: [
    { label: 'Details', fields: ['toNumber', 'message', 'status'] },
  ],
}

export function getFieldTabs(module: string, fields: FieldConfig[]): { label: string; fieldConfigs: FieldConfig[] }[] {
  const tabs = moduleTabs[module]
  if (!tabs) {
    const detailFields = fields.filter(f => !isDescriptionField(f.name) && !isAddressField(f.name) && !isFinancialField(f.name))
    const descFields = fields.filter(f => isDescriptionField(f.name))
    const addrFields = fields.filter(f => isAddressField(f.name))
    const finFields = fields.filter(f => isFinancialField(f.name))
    const result: { label: string; fieldConfigs: FieldConfig[] }[] = []
    if (detailFields.length) result.push({ label: 'Details', fieldConfigs: detailFields })
    if (addrFields.length) result.push({ label: 'Address', fieldConfigs: addrFields })
    if (finFields.length) result.push({ label: 'Financial', fieldConfigs: finFields })
    if (descFields.length) result.push({ label: 'Description', fieldConfigs: descFields })
    return result
  }
  return tabs.map(tab => ({
    label: tab.label,
    fieldConfigs: tab.fields.map(name => fields.find(f => f.name === name)).filter(Boolean) as FieldConfig[],
  })).filter(t => t.fieldConfigs.length > 0)
}

export function getFieldLabel(name: string): string {
  return labelFromName(name)
}

export function formatFieldValue(value: any, key: string): string {
  if (value == null || value === '') return '-'
  const monetary = ['amount', 'grandTotal', 'subTotal', 'unitPrice', 'costPrice', 'annualRevenue', 'expectedRevenue', 'budget', 'actualCost', 'shipping', 'shippingHandling', 'discount', 'adjustment', 'salesCommission', 'exciseDuty', 'targetBudget', 'actualBudget', 'expectedROI', 'actualROI', 'commissionRate', 'listPrice', 'netPrice', 'total', 'lineTotal', 'commissionPercentage', 'taxAmount']
  if (monetary.includes(key)) {
    return `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (key.toLowerCase().includes('date') || key.toLowerCase().includes('Date')) {
    try { return new Date(value).toLocaleDateString() } catch { return value }
  }
  return String(value)
}
