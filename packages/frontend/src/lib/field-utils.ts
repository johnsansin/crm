import { formatDate, formatMoney } from '@/lib/org-format'

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
    expectedResponseCount: 'Expected Response Count', expectedSalesCount: 'Expected Sales Count',
    actualResponseCount: 'Actual Response Count', actualSalesCount: 'Actual Sales Count',
    productName: 'Product Name', productNo: 'Product No', productCategory: 'Category', isActive: 'Active',
    unitPrice: 'Unit Price', costPrice: 'Cost Price', commissionRate: 'Commission Rate',
    commissionMethod: 'Commission Method', qtyInStock: 'Qty In Stock', qtyOnOrder: 'Qty On Order',
    qtyInDemand: 'Qty In Demand', reorderLevel: 'Reorder Level', usageUnit: 'Usage Unit',
    qtyPerUnit: 'Qty/Unit', markupPercent: 'Markup %', pricingFormula: 'Pricing Formula',
    image: 'Image',
    competitorName: 'Competitor Name', marketShare: 'Market Share', strengths: 'Strengths',
    weaknesses: 'Weaknesses',
    paymentDate: 'Payment Date', method: 'Payment Method',
    packSize: 'Pack Size', salesStartDate: 'Sales Start Date', salesEndDate: 'Sales End Date',
    startDate: 'Start Date', endDate: 'End Date', expiryDate: 'Expiry Date',
    serialNo: 'Serial No', mfrPartNo: 'Mfr PartNo', vendorPartNo: 'Vendor PartNo',
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
    projectName: 'Project Name', projectNo: 'Project Number', projectType: 'Project Type', targetBudget: 'Target Budget',
    actualBudget: 'Actual Budget', actualEndDate: 'Actual End Date', projectId: 'Project',
    projectTaskType: 'Task Type', projectTaskNo: 'Task Number', assignedTo: 'Assigned To',
    milestoneDate: 'Milestone Date', milestoneType: 'Milestone Type',
    milestoneNo: 'Milestone No', plannedHours: 'Planned Hours', actualHours: 'Actual Hours', sequence: 'Sequence',
    assetName: 'Asset Name', tagNumber: 'Tag Number', dateSold: 'Date Sold', datesInService: 'Date In Service',
    dateOutOfService: 'Date Out Of Service', faqNo: 'FAQ Number',
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
    currency: 'Currency', conversionRate: 'Conversion Rate',
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
    { label: 'Details', fields: ['accountName', 'accountNo', 'parentId', 'website', 'phone', 'otherPhone', 'fax', 'email', 'email2', 'emailOptOut', 'notifyOwner', 'industry', 'accountType', 'ownership', 'rating', 'sicCode', 'tickerSymbol', 'glAccount', 'annualRevenue', 'employees'] },
    { label: 'Address', fields: ['billingStreet', 'billingCity', 'billingState', 'billingCountry', 'billingPostalCode', 'billingPoBox', 'shippingStreet', 'shippingCity', 'shippingState', 'shippingCountry', 'shippingPostalCode', 'shippingPoBox'] },
    { label: 'Description', fields: ['description'] },
  ],
  contacts: [
    { label: 'Details', fields: ['image', 'firstName', 'lastName', 'email', 'secondaryEmail', 'phone', 'mobile', 'homePhone', 'otherPhone', 'fax', 'title', 'department', 'assistant', 'assistantPhone', 'dob', 'reportsTo', 'leadSource', 'doNotCall', 'notifyOwner', 'portal', 'supportStartDate', 'supportEndDate'] },
    { label: 'Address', fields: ['mailingStreet', 'mailingCity', 'mailingState', 'mailingCountry', 'mailingPostalCode', 'mailingPoBox', 'otherStreet', 'otherCity', 'otherState', 'otherCountry', 'otherPostalCode', 'otherPoBox'] },
    { label: 'Description', fields: ['description'] },
  ],
  leads: [
    { label: 'Details', fields: ['salutation', 'firstName', 'lastName', 'company', 'assignedTo', 'title', 'email', 'secondaryEmail', 'phone', 'mobile', 'fax', 'website', 'leadSource', 'leadStatus', 'industry', 'annualRevenue', 'noOfEmployees', 'rating', 'interest'] },
    { label: 'Address', fields: ['street', 'city', 'state', 'country', 'postalCode', 'poBox'] },
    { label: 'Description', fields: ['description'] },
  ],
  potentials: [
    { label: 'Details', fields: ['potentialName', 'amount', 'currency', 'closingDate', 'stage', 'probability', 'type', 'leadSource', 'forecastCategory', 'outcomeAnalysis', 'nextStep'] },
    { label: 'Description', fields: ['description'] },
  ],
  competitors: [
    { label: 'Details', fields: ['competitorName', 'website', 'rating', 'marketShare', 'products'] },
    { label: 'Analysis', fields: ['strengths', 'weaknesses'] },
    { label: 'Description', fields: ['description'] },
  ],
  payments: [
    { label: 'Payment', fields: ['invoiceId', 'amount', 'paymentDate', 'method'] },
    { label: 'Details', fields: ['reference', 'notes'] },
  ],
  campaigns: [
    { label: 'Details', fields: ['campaignName', 'campaignType', 'status', 'startDate', 'endDate', 'closingDate', 'expectedRevenue', 'budget', 'actualCost', 'expectedResponse', 'targetSize', 'sponsor', 'targetAudience', 'expectedROI', 'actualROI', 'expectedResponseCount', 'expectedSalesCount', 'actualResponseCount', 'actualSalesCount'] },
    { label: 'Description', fields: ['description'] },
  ],
  products: [
    { label: 'Product Details', fields: ['productName', 'productNo', 'isActive', 'productCategory', 'manufacturer', 'website', 'mfrPartNo', 'vendorPartNo', 'productSheet', 'serialNo', 'usageUnit', 'qtyPerUnit', 'description', 'vendorId', 'assignedTo'] },
    { label: 'Product Image Information', fields: ['image'] },
    { label: 'Stock Information', fields: ['qtyInStock', 'qtyInDemand', 'reorderLevel', 'qtyOnOrder', 'weight', 'packSize', 'taxClass', 'glAccount'] },
    { label: 'Product Prices', fields: ['unitPrice', 'costPrice', 'commissionRate', 'commissionMethod', 'commissionPercentage', 'pricingFormula', 'markupPercent'] },
    { label: 'Pricing', fields: ['unitPrice', 'costPrice', 'commissionRate', 'commissionMethod', 'qtyInStock', 'qtyOnOrder', 'qtyInDemand', 'reorderLevel'] },
    { label: 'Description', fields: ['description'] },
  ],
  services: [
    { label: 'Details', fields: ['serviceName', 'serviceNo', 'serviceCategory', 'usageUnit', 'website', 'serialNo', 'glAccount', 'taxClass', 'reorderLevel', 'qtyInStock', 'qtyInDemand', 'discontinued'] },
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
    { label: 'Details', fields: ['subject', 'quoteNo', 'validUntil', 'quoteStage', 'carrier', 'inventoryManager', 'taxType', 'currency', 'conversionRate'] },
    { label: 'Financial', fields: ['grandTotal', 'subTotal', 'discount', 'discountPercent', 'adjustment', 'shipping', 'shippingHandling', 'taxAmount', 'total'] },
    { label: 'Address', fields: ['billingStreet', 'billingCity', 'billingState', 'billingCountry', 'billingPostalCode', 'billingPoBox', 'shippingStreet', 'shippingCity', 'shippingState', 'shippingCountry', 'shippingPostalCode', 'shippingPoBox'] },
    { label: 'Terms', fields: ['terms', 'description'] },
  ],
  salesorders: [
    { label: 'Details', fields: ['subject', 'salesOrderNo', 'validUntil', 'soStatus', 'carrier', 'customerNo', 'purchaseOrderNo', 'taxType', 'pending', 'enableRecurring', 'currency', 'conversionRate'] },
    { label: 'Financial', fields: ['grandTotal', 'subTotal', 'discount', 'discountPercent', 'adjustment', 'shipping', 'shippingHandling', 'salesCommission', 'exciseDuty', 'taxAmount', 'total'] },
    { label: 'Address', fields: ['billingStreet', 'billingCity', 'billingState', 'billingCountry', 'billingPostalCode', 'billingPoBox', 'shippingStreet', 'shippingCity', 'shippingState', 'shippingCountry', 'shippingPostalCode', 'shippingPoBox'] },
    { label: 'Terms', fields: ['terms', 'description'] },
  ],
  purchaseorders: [
    { label: 'Details', fields: ['subject', 'purchaseOrderNo', 'validUntil', 'poStatus', 'carrier', 'taxType', 'currency', 'conversionRate', 'vendorId', 'contactId'] },
    { label: 'Financial', fields: ['grandTotal', 'subTotal', 'discount', 'discountPercent', 'adjustment', 'shipping', 'shippingHandling', 'salesCommission', 'exciseDuty', 'taxAmount', 'total'] },
    { label: 'Address', fields: ['billingStreet', 'billingCity', 'billingState', 'billingCountry', 'billingPostalCode', 'billingPoBox', 'shippingStreet', 'shippingCity', 'shippingState', 'shippingCountry', 'shippingPostalCode', 'shippingPoBox'] },
    { label: 'Terms', fields: ['terms', 'description'] },
  ],
  invoices: [
    { label: 'Details', fields: ['subject', 'invoiceNo', 'invoiceDate', 'dueDate', 'invoiceStatus', 'customerNo', 'purchaseOrderNo', 'taxType', 'currency', 'conversionRate'] },
    { label: 'Financial', fields: ['grandTotal', 'subTotal', 'discount', 'discountPercent', 'adjustment', 'shipping', 'shippingHandling', 'salesCommission', 'exciseDuty', 'taxAmount', 'total'] },
    { label: 'Address', fields: ['billingStreet', 'billingCity', 'billingState', 'billingCountry', 'billingPostalCode', 'billingPoBox', 'shippingStreet', 'shippingCity', 'shippingState', 'shippingCountry', 'shippingPostalCode', 'shippingPoBox'] },
    { label: 'Terms', fields: ['notes', 'terms', 'description'] },
  ],
  tickets: [
    { label: 'Details', fields: ['title', 'ticketNo', 'contactId', 'accountId', 'productId', 'status', 'priority', 'severity', 'category', 'hours', 'days', 'fromMail', 'versionId'] },
    { label: 'Description', fields: ['description', 'solution', 'updateLog'] },
  ],
  faq: [
    { label: 'Details', fields: ['title', 'faqNo', 'category', 'status', 'assignedTo'] },
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
    { label: 'Information', fields: ['projectName', 'projectNo', 'projectType', 'status', 'priority', 'progress', 'accountId', 'contactId', 'url', 'assignedTo'] },
    { label: 'Schedule', fields: ['startDate', 'endDate', 'actualEndDate'] },
    { label: 'Financial', fields: ['targetBudget', 'actualBudget'] },
    { label: 'Description', fields: ['description'] },
  ],
  projecttasks: [
    { label: 'Information', fields: ['projectId', 'projectTaskNo', 'title', 'status', 'priority', 'projectTaskType', 'progress', 'hours', 'assignedTo', 'startDate', 'endDate'] },
    { label: 'Description', fields: ['description'] },
  ],
  projectmilestones: [
    { label: 'Information', fields: ['projectId', 'milestoneNo', 'title', 'status', 'progress', 'milestoneDate', 'milestoneType', 'plannedHours', 'actualHours', 'sequence', 'assignedTo', 'startDate', 'endDate'] },
    { label: 'Description', fields: ['description'] },
  ],
  assets: [
    { label: 'Details', fields: ['assetName', 'assetNo', 'serialNo', 'tagNumber', 'productId', 'accountId', 'contactId', 'datesInService', 'dateOutOfService', 'dateSold', 'status', 'shippingMethod', 'shippingTrackingNumber', 'invoiceId'] },
    { label: 'Description', fields: ['description'] },
  ],
  servicecontracts: [
    { label: 'Details', fields: ['contractName', 'contractNo', 'contractType', 'status', 'priority', 'accountId', 'contactId', 'startDate', 'endDate', 'dueDate', 'renewalDate', 'progress', 'trackingUnit', 'totalUnits', 'usedUnits', 'unitPrice', 'costPrice', 'relatedTo', 'relatedModule'] },
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
    return formatMoney(value)
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (key.toLowerCase().includes('date') || key.toLowerCase().includes('Date')) {
    return formatDate(value) || '-'
  }
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return formatDate(value) || '-'
  }
  return String(value)
}
