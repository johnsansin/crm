import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { cn } from '@/lib/utils'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { getFieldTabs, getFieldLabel, formatFieldValue } from '@/lib/field-utils'
import { useOrgSettings } from '@/lib/org-format'
import { ProjectSearchSelect } from '@/components/project-search-select'
import { ArrowLeft, Save, Loader2, Trash2, Pencil, ChevronRight, Asterisk } from 'lucide-react'

const labelMap: Record<string, string> = {
  accounts: 'Account', contacts: 'Contact', leads: 'Lead',
  potentials: 'Opportunity', campaigns: 'Campaign',
  products: 'Product', services: 'Service', vendors: 'Vendor',
  pricebooks: 'Price Book', quotes: 'Quote',
  salesorders: 'Sales Order', purchaseorders: 'Purchase Order',
  invoices: 'Invoice', tickets: 'Ticket', faq: 'FAQ',
  documents: 'Document', emails: 'Email',
  emailtemplates: 'Email Template', projects: 'Project',
  projecttasks: 'Project Task', projectmilestones: 'Project Milestone',
  assets: 'Asset', servicecontracts: 'Service Contract',
  smsnotifier: 'SMS Notifier'
}

const TAB_DOT_COLORS = ['bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500']
const TAB_ACTIVE_COLORS = [
  'data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400',
  'data-[state=active]:border-violet-500 data-[state=active]:text-violet-600 dark:data-[state=active]:text-violet-400',
  'data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400',
  'data-[state=active]:border-amber-500 data-[state=active]:text-amber-600 dark:data-[state=active]:text-amber-400',
  'data-[state=active]:border-rose-500 data-[state=active]:text-rose-600 dark:data-[state=active]:text-rose-400',
]

const SELECT_OPTIONS: Record<string, Record<string, string[]>> = {
  accounts: { industry: ['--None--','Apparel','Banking','Biotechnology','Chemicals','Communications','Construction','Consulting','Education','Electronics','Energy','Engineering','Entertainment','Environmental','Finance','Food & Beverage','Government','Healthcare','Hospitality','Insurance','Machinery','Manufacturing','Media','Not for Profit','Other','Recreation','Retail','Shipping','Technology','Telecommunications','Transportation','Utilities'], accountType: ['--None--','Prospect','Customer','Vendor','Reseller','Partner','Investor','Other'] },
  leads: { leadStatus: ['--None--','New','Contacted','Working','Qualified','Unqualified','Converted','Junk','Lost'], leadSource: ['--None--','Cold Call','Existing Customer','Self Generated','Employee','Partner','Public Relations','Direct Mail','Conference','Trade Show','Website','Word of Mouth','Email','Campaign','Other'], salutation: ['--None--','Mr.','Ms.','Mrs.','Dr.','Prof.'], industry: ['--None--','Apparel','Banking','Biotechnology','Chemicals','Communications','Construction','Consulting','Education','Electronics','Energy','Engineering','Entertainment','Environmental','Finance','Food & Beverage','Government','Healthcare','Hospitality','Insurance','Machinery','Manufacturing','Media','Not for Profit','Other','Recreation','Retail','Shipping','Technology','Telecommunications','Transportation','Utilities'] },
  potentials: { stage: ['--None--','Prospecting','Qualification','Needs Analysis','Value Proposition','Id. Decision Makers','Perception Analysis','Proposal/Price Quote','Negotiation/Review','Closed Won','Closed Lost'], leadSource: ['--None--','Cold Call','Existing Customer','Self Generated','Employee','Partner','Public Relations','Direct Mail','Conference','Trade Show','Website','Word of Mouth','Email','Campaign','Other'], type: ['--None--','Existing Business','New Business'], forecastCategory: ['--None--','Pipeline','Best Case','Commit','Closed','Omitted'] },
  campaigns: { campaignType: ['--None--','Marketing','Webinar','Email','Newsletter','Product Launch','Partners','Referral Program','Social Media','Television','Print','Other'], status: ['--None--','Planning','Active','Inactive','Completed','Cancelled'] },
  tickets: { status: ['--None--','Open','In Progress','Wait for Response','Closed'], priority: ['--None--','Low','Medium','High','Urgent'], severity: ['--None--','Minor','Major','Critical','Feature'], category: ['--None--','General','Technical','Billing','Sales','Administrative'] },
  projects: { status: ['--None--','Prospecting','Initiated','In Progress','Waiting for Feedback','On Hold','Completed','Delivered','Cancelled'], priority: ['--None--','Low','Medium','High','Urgent'], projectType: ['--None--','Internal','External','Research & Development','Training','Other'] },
  projecttasks: { status: ['--None--','Not Started','In Progress','Completed','Deferred','Waiting for Feedback'], priority: ['--None--','Low','Medium','High','Urgent'], projectTaskType: ['--None--','Development','Design','Testing','Documentation','Meeting','Administrative','Other'] },
  projectmilestones: { status: ['--None--','Not Started','In Progress','Completed','Deferred'], milestoneType: ['--None--','Internal','External','Milestone'] },
  invoices: { invoiceStatus: ['--None--','Created','Sent','Paid','Partially Paid','Cancelled','Credit'], taxType: ['--None--','Individual','Group','VAT','GST','Sales Tax'] },
  quotes: { quoteStage: ['--None--','Created','Draft','Reviewed','Delivered','Accepted','Rejected'], taxType: ['--None--','Individual','Group','VAT','GST','Sales Tax'] },
  salesorders: { soStatus: ['--None--','Created','Approved','Delivered','Cancelled'], taxType: ['--None--','Individual','Group','VAT','GST','Sales Tax'] },
  purchaseorders: { poStatus: ['--None--','Created','Approved','Delivered','Cancelled'], taxType: ['--None--','Individual','Group','VAT','GST','Sales Tax'] },
  assets: { status: ['--None--','In Service','Out of Service','Disposed'] },
  servicecontracts: { contractType: ['--None--','Support','Service','Maintenance','SLA'], status: ['--None--','In Planning','In Progress','Active','On Hold','Completed','Cancelled'], priority: ['--None--','Low','Medium','High','Urgent'], trackingUnit: ['--None--','Hours','Days','Months','Years','Support Incidents'] },
  faq: { status: ['--None--','Draft','Published','Archived'], category: ['--None--','General','Technical','Billing','Sales','Support'] },
  products: { productCategory: ['--None--','Hardware','Software','Services','Consulting','Training','Other'], usageUnit: ['--None--','Each','Hour','Day','Month','Year','Box','Dozen','Kg','Lb','Set'], commissionMethod: ['--None--','Fixed','Percentage'] },
  services: { serviceCategory: ['--None--','Consulting','Training','Support','Maintenance','Installation','Other'], usageUnit: ['--None--','Each','Hour','Day','Month','Year','Box','Dozen','Kg','Lb','Set'], commissionMethod: ['--None--','Fixed','Percentage'] },
  vendors: { category: ['--None--','Software','Hardware','Services','Consulting','Training','Other'] },
  documents: { fileType: ['--None--','PDF','Document','Spreadsheet','Presentation','Image','Video','Audio','Archive','Other'], fileStatus: ['--None--','Active','Archived','Deleted'] },
  emails: { emailFlag: ['--None--','Sent','Received','Draft','Spam','Forwarded'] },
  smsnotifier: { status: ['--None--','Sent','Failed','Queued'] }
}

const fieldConfigs: Record<string, { name: string; type: string; required?: boolean }[]> = {
  accounts: [
    { name: 'accountName', type: 'text', required: true },
    { name: 'accountNo', type: 'text' },
    { name: 'parentId', type: 'text' },
    { name: 'website', type: 'text' },
    { name: 'phone', type: 'text' },
    { name: 'otherPhone', type: 'text' },
    { name: 'fax', type: 'text' },
    { name: 'email', type: 'email' },
    { name: 'email2', type: 'email' },
    { name: 'emailOptOut', type: 'text' },
    { name: 'notifyOwner', type: 'text' },
    { name: 'industry', type: 'select' },
    { name: 'accountType', type: 'select' },
    { name: 'ownership', type: 'text' },
    { name: 'rating', type: 'text' },
    { name: 'sicCode', type: 'text' },
    { name: 'tickerSymbol', type: 'text' },
    { name: 'annualRevenue', type: 'number' },
    { name: 'employees', type: 'number' },
    { name: 'description', type: 'textarea' },
    { name: 'billingStreet', type: 'text' },
    { name: 'billingCity', type: 'text' },
    { name: 'billingState', type: 'text' },
    { name: 'billingCountry', type: 'text' },
    { name: 'billingPostalCode', type: 'text' },
    { name: 'billingPoBox', type: 'text' },
    { name: 'shippingStreet', type: 'text' },
    { name: 'shippingCity', type: 'text' },
    { name: 'shippingState', type: 'text' },
    { name: 'shippingCountry', type: 'text' },
    { name: 'shippingPostalCode', type: 'text' },
    { name: 'shippingPoBox', type: 'text' },
  ],
  contacts: [
    { name: 'firstName', type: 'text', required: true },
    { name: 'lastName', type: 'text', required: true },
    { name: 'email', type: 'email' },
    { name: 'secondaryEmail', type: 'email' },
    { name: 'phone', type: 'text' },
    { name: 'mobile', type: 'text' },
    { name: 'homePhone', type: 'text' },
    { name: 'otherPhone', type: 'text' },
    { name: 'fax', type: 'text' },
    { name: 'title', type: 'text' },
    { name: 'department', type: 'text' },
    { name: 'assistant', type: 'text' },
    { name: 'assistantPhone', type: 'text' },
    { name: 'dob', type: 'date' },
    { name: 'reportsTo', type: 'text' },
    { name: 'leadSource', type: 'select' },
    { name: 'description', type: 'textarea' },
    { name: 'mailingStreet', type: 'text' },
    { name: 'mailingCity', type: 'text' },
    { name: 'mailingState', type: 'text' },
    { name: 'mailingCountry', type: 'text' },
    { name: 'mailingPostalCode', type: 'text' },
    { name: 'mailingPoBox', type: 'text' },
    { name: 'otherStreet', type: 'text' },
    { name: 'otherCity', type: 'text' },
    { name: 'otherState', type: 'text' },
    { name: 'otherCountry', type: 'text' },
    { name: 'otherPostalCode', type: 'text' },
    { name: 'otherPoBox', type: 'text' },
  ],
  leads: [
    { name: 'salutation', type: 'select' },
    { name: 'firstName', type: 'text', required: true },
    { name: 'lastName', type: 'text', required: true },
    { name: 'company', type: 'text', required: true },
    { name: 'assignedTo', type: 'user-select', required: true },
    { name: 'title', type: 'text' },
    { name: 'email', type: 'email' },
    { name: 'secondaryEmail', type: 'email' },
    { name: 'phone', type: 'text' },
    { name: 'mobile', type: 'text' },
    { name: 'fax', type: 'text' },
    { name: 'website', type: 'text' },
    { name: 'leadSource', type: 'select' },
    { name: 'leadStatus', type: 'select' },
    { name: 'industry', type: 'select' },
    { name: 'annualRevenue', type: 'number' },
    { name: 'noOfEmployees', type: 'number' },
    { name: 'rating', type: 'text' },
    { name: 'interest', type: 'text' },
    { name: 'description', type: 'textarea' },
    { name: 'street', type: 'text' },
    { name: 'city', type: 'text' },
    { name: 'state', type: 'text' },
    { name: 'country', type: 'text' },
    { name: 'postalCode', type: 'text' },
    { name: 'poBox', type: 'text' },
  ],
  potentials: [
    { name: 'potentialName', type: 'text', required: true },
    { name: 'amount', type: 'number' },
    { name: 'closingDate', type: 'date' },
    { name: 'stage', type: 'select' },
    { name: 'probability', type: 'number' },
    { name: 'type', type: 'select' },
    { name: 'leadSource', type: 'select' },
    { name: 'forecastCategory', type: 'select' },
    { name: 'outcomeAnalysis', type: 'text' },
    { name: 'nextStep', type: 'text' },
    { name: 'description', type: 'textarea' },
  ],
  tickets: [
    { name: 'title', type: 'text', required: true },
    { name: 'description', type: 'textarea' },
    { name: 'status', type: 'select' },
    { name: 'priority', type: 'select' },
    { name: 'severity', type: 'select' },
    { name: 'category', type: 'select' },
    { name: 'solution', type: 'textarea' },
    { name: 'updateLog', type: 'textarea' },
    { name: 'hours', type: 'number' },
    { name: 'days', type: 'number' },
    { name: 'fromMail', type: 'email' },
    { name: 'versionId', type: 'text' },
  ],
  products: [
    { name: 'productName', type: 'text', required: true },
    { name: 'productNo', type: 'text' },
    { name: 'productCategory', type: 'select' },
    { name: 'manufacturer', type: 'text' },
    { name: 'unitPrice', type: 'number' },
    { name: 'costPrice', type: 'number' },
    { name: 'commissionRate', type: 'number' },
    { name: 'commissionMethod', type: 'select' },
    { name: 'qtyInStock', type: 'number' },
    { name: 'qtyOnOrder', type: 'number' },
    { name: 'qtyInDemand', type: 'number' },
    { name: 'reorderLevel', type: 'number' },
    { name: 'usageUnit', type: 'select' },
    { name: 'weight', type: 'number' },
    { name: 'packSize', type: 'number' },
    { name: 'salesStartDate', type: 'date' },
    { name: 'salesEndDate', type: 'date' },
    { name: 'startDate', type: 'date' },
    { name: 'expiryDate', type: 'date' },
    { name: 'supportStartDate', type: 'date' },
    { name: 'supportEndDate', type: 'date' },
    { name: 'website', type: 'text' },
    { name: 'serialNo', type: 'text' },
    { name: 'mfrPartNo', type: 'text' },
    { name: 'vendorPartNo', type: 'text' },
    { name: 'productSheet', type: 'text' },
    { name: 'glAccount', type: 'text' },
    { name: 'taxClass', type: 'text' },
    { name: 'vendorId', type: 'text' },
    { name: 'description', type: 'textarea' },
  ],
  projects: [
    { name: 'projectName', type: 'text', required: true },
    { name: 'projectNo', type: 'text' },
    { name: 'projectType', type: 'select' },
    { name: 'status', type: 'select' },
    { name: 'priority', type: 'select' },
    { name: 'progress', type: 'number' },
    { name: 'assignedTo', type: 'user-select' },
    { name: 'startDate', type: 'date' },
    { name: 'endDate', type: 'date' },
    { name: 'actualEndDate', type: 'date' },
    { name: 'targetBudget', type: 'number' },
    { name: 'actualBudget', type: 'number' },
    { name: 'url', type: 'text' },
    { name: 'description', type: 'textarea' },
  ],
  campaigns: [
    { name: 'campaignName', type: 'text', required: true },
    { name: 'campaignType', type: 'select' },
    { name: 'status', type: 'select' },
    { name: 'startDate', type: 'date' },
    { name: 'endDate', type: 'date' },
    { name: 'closingDate', type: 'date' },
    { name: 'expectedRevenue', type: 'number' },
    { name: 'budget', type: 'number' },
    { name: 'actualCost', type: 'number' },
    { name: 'expectedResponse', type: 'number' },
    { name: 'targetSize', type: 'number' },
    { name: 'sponsor', type: 'text' },
    { name: 'targetAudience', type: 'text' },
    { name: 'expectedROI', type: 'number' },
    { name: 'actualROI', type: 'number' },
    { name: 'description', type: 'textarea' },
  ],
  invoices: [
    { name: 'subject', type: 'text', required: true },
    { name: 'invoiceNo', type: 'text' },
    { name: 'invoiceDate', type: 'date' },
    { name: 'dueDate', type: 'date' },
    { name: 'grandTotal', type: 'number' },
    { name: 'subTotal', type: 'number' },
    { name: 'discount', type: 'number' },
    { name: 'discountPercent', type: 'number' },
    { name: 'adjustment', type: 'number' },
    { name: 'shipping', type: 'number' },
    { name: 'shippingHandling', type: 'number' },
    { name: 'taxAmount', type: 'number' },
    { name: 'total', type: 'number' },
    { name: 'salesCommission', type: 'number' },
    { name: 'exciseDuty', type: 'number' },
    { name: 'customerNo', type: 'text' },
    { name: 'purchaseOrderNo', type: 'text' },
    { name: 'invoiceStatus', type: 'select' },
    { name: 'taxType', type: 'select' },
    { name: 'notes', type: 'textarea' },
    { name: 'terms', type: 'textarea' },
    { name: 'description', type: 'textarea' },
    { name: 'billingStreet', type: 'text' },
    { name: 'billingCity', type: 'text' },
    { name: 'billingState', type: 'text' },
    { name: 'billingCountry', type: 'text' },
    { name: 'billingPostalCode', type: 'text' },
    { name: 'billingPoBox', type: 'text' },
    { name: 'shippingStreet', type: 'text' },
    { name: 'shippingCity', type: 'text' },
    { name: 'shippingState', type: 'text' },
    { name: 'shippingCountry', type: 'text' },
    { name: 'shippingPostalCode', type: 'text' },
    { name: 'shippingPoBox', type: 'text' },
  ],
  services: [
    { name: 'serviceName', type: 'text', required: true },
    { name: 'serviceNo', type: 'text' },
    { name: 'serviceCategory', type: 'select' },
    { name: 'unitPrice', type: 'number' },
    { name: 'costPrice', type: 'number' },
    { name: 'commissionRate', type: 'number' },
    { name: 'commissionMethod', type: 'select' },
    { name: 'usageUnit', type: 'select' },
    { name: 'reorderLevel', type: 'number' },
    { name: 'qtyInStock', type: 'number' },
    { name: 'qtyInDemand', type: 'number' },
    { name: 'website', type: 'text' },
    { name: 'serialNo', type: 'text' },
    { name: 'glAccount', type: 'text' },
    { name: 'taxClass', type: 'text' },
    { name: 'description', type: 'textarea' },
  ],
  vendors: [
    { name: 'vendorName', type: 'text', required: true },
    { name: 'email', type: 'email' },
    { name: 'phone', type: 'text' },
    { name: 'mobile', type: 'text' },
    { name: 'website', type: 'text' },
    { name: 'category', type: 'select' },
    { name: 'glAccount', type: 'text' },
    { name: 'description', type: 'textarea' },
    { name: 'street', type: 'text' },
    { name: 'city', type: 'text' },
    { name: 'state', type: 'text' },
    { name: 'country', type: 'text' },
    { name: 'postalCode', type: 'text' },
  ],
  pricebooks: [
    { name: 'priceBookName', type: 'text', required: true },
    { name: 'active', type: 'text' },
    { name: 'description', type: 'textarea' },
  ],
  quotes: [
    { name: 'subject', type: 'text', required: true },
    { name: 'quoteNo', type: 'text' },
    { name: 'validUntil', type: 'date' },
    { name: 'grandTotal', type: 'number' },
    { name: 'subTotal', type: 'number' },
    { name: 'discount', type: 'number' },
    { name: 'discountPercent', type: 'number' },
    { name: 'adjustment', type: 'number' },
    { name: 'shipping', type: 'number' },
    { name: 'shippingHandling', type: 'number' },
    { name: 'taxAmount', type: 'number' },
    { name: 'total', type: 'number' },
    { name: 'carrier', type: 'text' },
    { name: 'inventoryManager', type: 'text' },
    { name: 'taxType', type: 'select' },
    { name: 'quoteStage', type: 'select' },
    { name: 'terms', type: 'textarea' },
    { name: 'description', type: 'textarea' },
    { name: 'billingStreet', type: 'text' },
    { name: 'billingCity', type: 'text' },
    { name: 'billingState', type: 'text' },
    { name: 'billingCountry', type: 'text' },
    { name: 'billingPostalCode', type: 'text' },
    { name: 'billingPoBox', type: 'text' },
    { name: 'shippingStreet', type: 'text' },
    { name: 'shippingCity', type: 'text' },
    { name: 'shippingState', type: 'text' },
    { name: 'shippingCountry', type: 'text' },
    { name: 'shippingPostalCode', type: 'text' },
    { name: 'shippingPoBox', type: 'text' },
  ],
  salesorders: [
    { name: 'subject', type: 'text', required: true },
    { name: 'salesOrderNo', type: 'text' },
    { name: 'validUntil', type: 'date' },
    { name: 'grandTotal', type: 'number' },
    { name: 'subTotal', type: 'number' },
    { name: 'discount', type: 'number' },
    { name: 'discountPercent', type: 'number' },
    { name: 'adjustment', type: 'number' },
    { name: 'shipping', type: 'number' },
    { name: 'shippingHandling', type: 'number' },
    { name: 'taxAmount', type: 'number' },
    { name: 'total', type: 'number' },
    { name: 'carrier', type: 'text' },
    { name: 'customerNo', type: 'text' },
    { name: 'purchaseOrderNo', type: 'text' },
    { name: 'salesCommission', type: 'number' },
    { name: 'exciseDuty', type: 'number' },
    { name: 'soStatus', type: 'select' },
    { name: 'taxType', type: 'select' },
    { name: 'terms', type: 'textarea' },
    { name: 'description', type: 'textarea' },
    { name: 'billingStreet', type: 'text' },
    { name: 'billingCity', type: 'text' },
    { name: 'billingState', type: 'text' },
    { name: 'billingCountry', type: 'text' },
    { name: 'billingPostalCode', type: 'text' },
    { name: 'billingPoBox', type: 'text' },
    { name: 'shippingStreet', type: 'text' },
    { name: 'shippingCity', type: 'text' },
    { name: 'shippingState', type: 'text' },
    { name: 'shippingCountry', type: 'text' },
    { name: 'shippingPostalCode', type: 'text' },
    { name: 'shippingPoBox', type: 'text' },
  ],
  purchaseorders: [
    { name: 'subject', type: 'text', required: true },
    { name: 'purchaseOrderNo', type: 'text' },
    { name: 'validUntil', type: 'date' },
    { name: 'grandTotal', type: 'number' },
    { name: 'subTotal', type: 'number' },
    { name: 'discount', type: 'number' },
    { name: 'discountPercent', type: 'number' },
    { name: 'adjustment', type: 'number' },
    { name: 'shipping', type: 'number' },
    { name: 'shippingHandling', type: 'number' },
    { name: 'taxAmount', type: 'number' },
    { name: 'total', type: 'number' },
    { name: 'carrier', type: 'text' },
    { name: 'salesCommission', type: 'number' },
    { name: 'exciseDuty', type: 'number' },
    { name: 'poStatus', type: 'select' },
    { name: 'taxType', type: 'select' },
    { name: 'vendorId', type: 'text' },
    { name: 'contactId', type: 'text' },
    { name: 'terms', type: 'textarea' },
    { name: 'description', type: 'textarea' },
    { name: 'billingStreet', type: 'text' },
    { name: 'billingCity', type: 'text' },
    { name: 'billingState', type: 'text' },
    { name: 'billingCountry', type: 'text' },
    { name: 'billingPostalCode', type: 'text' },
    { name: 'billingPoBox', type: 'text' },
    { name: 'shippingStreet', type: 'text' },
    { name: 'shippingCity', type: 'text' },
    { name: 'shippingState', type: 'text' },
    { name: 'shippingCountry', type: 'text' },
    { name: 'shippingPostalCode', type: 'text' },
    { name: 'shippingPoBox', type: 'text' },
  ],
  faq: [
    { name: 'title', type: 'text', required: true },
    { name: 'category', type: 'select' },
    { name: 'status', type: 'select' },
    { name: 'description', type: 'textarea' },
    { name: 'answer', type: 'textarea' },
  ],
  documents: [
    { name: 'title', type: 'text', required: true },
    { name: 'fileName', type: 'file' },
    { name: 'fileType', type: 'select' },
    { name: 'fileLocationType', type: 'text' },
    { name: 'fileStatus', type: 'select' },
    { name: 'fileVersion', type: 'text' },
    { name: 'noteContent', type: 'textarea' },
    { name: 'folderId', type: 'text' },
  ],
  emails: [
    { name: 'subject', type: 'text' },
    { name: 'fromEmail', type: 'email' },
    { name: 'toEmails', type: 'text' },
    { name: 'ccEmails', type: 'text' },
    { name: 'bccEmails', type: 'text' },
    { name: 'emailFlag', type: 'select' },
    { name: 'parentId', type: 'text' },
    { name: 'parentModule', type: 'text' },
    { name: 'body', type: 'textarea' },
  ],
  emailtemplates: [
    { name: 'templateName', type: 'text', required: true },
    { name: 'subject', type: 'text' },
    { name: 'module', type: 'text' },
    { name: 'folderName', type: 'text' },
    { name: 'body', type: 'textarea' },
  ],
  projecttasks: [
    { name: 'projectId', type: 'project-select', required: true },
    { name: 'projectTaskNo', type: 'text' },
    { name: 'title', type: 'text', required: true },
    { name: 'status', type: 'select' },
    { name: 'priority', type: 'select' },
    { name: 'projectTaskType', type: 'select' },
    { name: 'progress', type: 'number' },
    { name: 'hours', type: 'number' },
    { name: 'assignedTo', type: 'user-select' },
    { name: 'startDate', type: 'date' },
    { name: 'endDate', type: 'date' },
    { name: 'description', type: 'textarea' },
  ],
  projectmilestones: [
    { name: 'projectId', type: 'project-select', required: true },
    { name: 'milestoneNo', type: 'text' },
    { name: 'title', type: 'text', required: true },
    { name: 'status', type: 'select' },
    { name: 'progress', type: 'number' },
    { name: 'milestoneDate', type: 'date' },
    { name: 'milestoneType', type: 'select' },
    { name: 'plannedHours', type: 'number' },
    { name: 'actualHours', type: 'number' },
    { name: 'sequence', type: 'number' },
    { name: 'assignedTo', type: 'user-select' },
    { name: 'startDate', type: 'date' },
    { name: 'endDate', type: 'date' },
    { name: 'description', type: 'textarea' },
  ],
  assets: [
    { name: 'assetName', type: 'text', required: true },
    { name: 'assetNo', type: 'text' },
    { name: 'serialNo', type: 'text' },
    { name: 'tagNumber', type: 'text' },
    { name: 'datesInService', type: 'date' },
    { name: 'dateOutOfService', type: 'date' },
    { name: 'dateSold', type: 'date' },
    { name: 'status', type: 'select' },
    { name: 'shippingMethod', type: 'text' },
    { name: 'shippingTrackingNumber', type: 'text' },
    { name: 'description', type: 'textarea' },
  ],
  servicecontracts: [
    { name: 'contractName', type: 'text', required: true },
    { name: 'contractNo', type: 'text' },
    { name: 'contractType', type: 'select' },
    { name: 'status', type: 'select' },
    { name: 'priority', type: 'select' },
    { name: 'startDate', type: 'date' },
    { name: 'endDate', type: 'date' },
    { name: 'renewalDate', type: 'date' },
    { name: 'trackingUnit', type: 'select' },
    { name: 'totalUnits', type: 'number' },
    { name: 'usedUnits', type: 'number' },
    { name: 'unitPrice', type: 'number' },
    { name: 'costPrice', type: 'number' },
    { name: 'relatedTo', type: 'text' },
    { name: 'relatedModule', type: 'text' },
    { name: 'description', type: 'textarea' },
  ],
  smsnotifier: [
    { name: 'toNumber', type: 'text', required: true },
    { name: 'fromNumber', type: 'text' },
    { name: 'message', type: 'textarea' },
    { name: 'status', type: 'select' },
  ],
}

function formatDisplayValue(value: any, type: string, name?: string) {
  if (value == null || value === '') return '-'
  if (type === 'user-select' && name === 'assignedTo') return value
  if (type === 'number') return formatFieldValue(value, name || '')
  if (type === 'date') return formatFieldValue(value, name || '')
  return value
}

export function ModuleDetailPage() {
  useOrgSettings()
  const { module, id } = useParams<{ module: string; id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { addToast } = useToast()
  const isNew = !id || id === 'new'
  const isEditMode = isNew || searchParams.get('edit') === 'true' || window.location.pathname.endsWith('/edit')
  const mod = module || (window.location.pathname.split('/').filter(Boolean)[0] || '')

  const [formData, setFormData] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showDelete, setShowDelete] = useState(false)

  const { data: record, isLoading: loadingRecord } = useQuery({
    queryKey: [mod, id],
    queryFn: () => api.get(mod, id!),
    enabled: !isNew,
  })

  const { data: projectsData } = useQuery({
    queryKey: ['projects', 'all'],
    queryFn: () => api.listAll('projects'),
    enabled: mod === 'projectmilestones' || mod === 'projecttasks',
  })
  const projects = projectsData?.data || []

  const { data: usersData } = useQuery({
    queryKey: ['module-users', mod],
    queryFn: () => api.request<any>(`/${mod}/users`),
    enabled: mod === 'leads',
  })
  const users = usersData?.data || []

  const { data: customFieldsData } = useQuery({
    queryKey: ['custom-fields', mod],
    queryFn: () => api.getCustomFields(mod).catch(() => ({ data: [] })),
  })
  const customFields = (customFieldsData?.data || []).filter((f: any) => f.isActive)

  const { data: picklistData } = useQuery({
    queryKey: ['picklists-all', mod],
    queryFn: () => api.getAllPicklists(mod).catch(() => ({ data: {} })),
  })
  const dynamicOptions = useMemo(() => {
    const merged: Record<string, Record<string, string[]>> = {}
    for (const [k, v] of Object.entries(SELECT_OPTIONS)) merged[k] = { ...v }
    const modMap = (picklistData?.data || {}) as Record<string, Record<string, string[]>>
    const modOptions = modMap[mod]
    if (modOptions && typeof modOptions === 'object') {
      for (const [field, opts] of Object.entries(modOptions)) {
        if (Array.isArray(opts)) {
          merged[mod] = { ...(merged[mod] || {}), [field]: ['--None--', ...opts] }
        }
      }
    }
    return merged
  }, [picklistData, mod])

  function formatRecordForForm(data: any) {
    const result: Record<string, any> = {}
    const config = fieldConfigs[mod] || []
    for (const f of config) {
      if (f.type === 'date' && data[f.name]) {
        const d = new Date(data[f.name])
        result[f.name] = d.toISOString().slice(0, 10)
      } else {
        result[f.name] = data[f.name] ?? ''
      }
    }
    for (const cf of customFields) {
      result[cf.fieldName] = data.customFields?.[cf.fieldName] ?? ''
    }
    return result
  }

  const DRAFT_KEY = `draft_${mod}`

  useEffect(() => {
    if (isNew) {
      const saved = localStorage.getItem(DRAFT_KEY)
      if (saved) {
        try { setFormData(JSON.parse(saved)); return } catch {}
      }
      setFormData({})
    } else if (record) {
      setFormData(formatRecordForForm(record))
    }
  }, [record, isNew])

  useEffect(() => {
    if (isNew && Object.keys(formData).length > 0) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(formData))
    }
  }, [formData, isNew])

  const saveMutation = useMutation({
    mutationFn: (data: any) =>
      isNew ? api.create(mod, data) : api.update(mod, id!, data),
    onSuccess: () => {
      localStorage.removeItem(DRAFT_KEY)
      queryClient.invalidateQueries({ queryKey: [mod] })
      addToast({ title: isNew ? 'Created' : 'Updated', description: `${label} has been saved`, variant: 'success' })
      navigate(isNew ? `/${mod}` : `/${mod}/${id}`)
    },
    onError: (err: Error) => {
      addToast({ title: 'Error', description: err.message, variant: 'destructive' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(mod, id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [mod] })
      addToast({ title: 'Deleted', description: `${label} has been deleted`, variant: 'success' })
      navigate(`/${mod}`)
    },    onError: (err: Error) => {
      addToast({ title: 'Error', description: err.message, variant: 'destructive' })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const config = fieldConfigs[mod] || []
    const newErrors: Record<string, string> = {}
    for (const field of config) {
      if (field.required && !formData[field.name]) {
        newErrors[field.name] = 'This field is required'
      }
    }
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return
    const payload: Record<string, any> = {}
    for (const field of config) {
      const val = formData[field.name]
      if (field.type === 'date' && val) {
        payload[field.name] = new Date(val + 'T12:00:00').toISOString()
      } else if ((field.type === 'number') && (val === '' || val == null)) {
        payload[field.name] = null
      } else {
        payload[field.name] = val ?? null
      }
    }
    for (const cf of customFields) {
      const val = formData[cf.fieldName]
      payload[cf.fieldName] = cf.type === 'checkbox' ? !!val : (val === '' || val == null ? null : val)
    }
    saveMutation.mutate(payload)
  }

  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const label = labelMap[mod] || mod
  const fields = fieldConfigs[mod] || [{ name: 'id', type: 'text' }]
  const tabs = useMemo(() => {
    const base = getFieldTabs(mod, fields)
    if (customFields.length) {
      return [...base, { label: 'Custom Fields', fieldConfigs: customFields.map((cf: any) => ({ name: cf.fieldName, type: cf.type, options: cf.options })) }]
    }
    return base
  }, [mod, customFields])
  const [activeTab, setActiveTab] = useState(tabs[0]?.label || 'Details')

  if (!isNew && loadingRecord) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!isNew && !isEditMode) {
    return (
      <div className="space-y-5 w-full">
        <div className="rounded-xl border bg-card p-4 sm:p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Button variant="outline" size="icon" onClick={() => navigate(`/${mod}`)}>
                <ArrowLeft size={18} />
              </Button>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {label} <ChevronRight size={12} /> Details
                </p>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight truncate">{record?.[fields[0]?.name] || label}</h1>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate(`/${mod}/${id}?edit=true`)}>
                <Pencil size={16} className="mr-2" /> <span className="hidden sm:inline">Edit</span>
              </Button>
              <Button variant="destructive" onClick={() => setShowDelete(true)}>
                <Trash2 size={16} className="mr-2" /> <span className="hidden sm:inline">Delete</span>
              </Button>
            </div>
          </div>
        </div>
        <Card>
          <CardContent className="p-0">
            <TabsRoot value={activeTab} onValueChange={setActiveTab}>
              <div className="px-6 pt-4 border-b">
                <TabsList className="border-b-0">
                  {tabs.map((tab, i) => (
                    <TabsTrigger key={tab.label} value={tab.label} className={TAB_ACTIVE_COLORS[i % TAB_ACTIVE_COLORS.length]}>
                      <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${TAB_DOT_COLORS[i % TAB_DOT_COLORS.length]}`} />{tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              {tabs.map(tab => (
                <TabsContent key={tab.label} value={tab.label} className="px-6 pb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-6">
                    {tab.fieldConfigs.map((field) => {
                      const isLong = field.type === 'textarea'
                      return (
                        <div key={field.name} className={isLong ? 'md:col-span-2 xl:col-span-3' : ''}>
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {(field as any).label || getFieldLabel(field.name)}
                          </label>
                          <p className="text-sm mt-1.5 font-medium text-foreground">
                            {field.name === 'projectId'
                              ? (projects.find(p => p.id === record?.projectId)?.projectName || '-')
                              : field.name === 'assignedTo' && users.length
                                ? ((() => { const u: any = users.find((x: any) => x.id === record?.assignedTo); return u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || u.userName || '-' : record?.ownerName || '-' })())
                                : formatDisplayValue(field.name.startsWith('cf_') ? record?.customFields?.[field.name] : record?.[field.name], field.type, field.name)}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </TabsContent>
              ))}
            </TabsRoot>
          </CardContent>
        </Card>
        <ConfirmDialog
          open={showDelete}
          onOpenChange={setShowDelete}
          onConfirm={() => deleteMutation.mutate()}
          title="Delete Record"
          description={`Are you sure you want to delete this ${label}?`}
          confirmLabel="Delete"
          variant="destructive"
        />
      </div>
    )
  }

  return (
    <div className="space-y-5 w-full">
      <div className="rounded-xl border bg-card p-4 sm:p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="outline" size="icon" onClick={() => navigate(isNew ? `/${mod}` : `/${mod}/${id}`)}>
              <ArrowLeft size={18} />
            </Button>
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label} <ChevronRight size={12} /> {isNew ? 'New Record' : 'Edit Record'}
              </p>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight truncate">
                {isNew ? `Create New ${label}` : `Edit ${label}`}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">Fill in the details below and save to {isNew ? 'create this' : 'update the'} record.</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <Asterisk size={13} className="text-destructive" /> Required fields
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="p-0">
            <FormTabs
              module={mod}
              fields={fields}
              formData={formData}
              errors={errors}
              handleChange={handleChange}
              SELECT_OPTIONS={dynamicOptions}
              projects={projects}
              users={users}
              customFields={customFields}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2 mt-4">
          <Button type="button" variant="outline" onClick={() => { localStorage.removeItem(DRAFT_KEY); navigate(isNew ? `/${mod}` : `/${mod}/${id}`) }}>Cancel</Button>
          {!isNew && (
            <Button type="button" variant="destructive" onClick={() => setShowDelete(true)}>
              <Trash2 size={16} className="mr-2" /> Delete
            </Button>
          )}
          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <Loader2 size={16} className="mr-2 animate-spin" />
            ) : (
              <Save size={16} className="mr-2" />
            )}
            Save
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Record"
        description={`Are you sure you want to delete this ${label}?`}
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  )
}

function FormTabs({ module, fields, formData, errors, handleChange, SELECT_OPTIONS: options, projects, users = [], customFields = [] }: {
  module: string; fields: any[]; formData: any; errors: any; handleChange: any; SELECT_OPTIONS: any; projects: any[]; users?: any[]; customFields?: any[]
}) {
  const tabs = [
    ...getFieldTabs(module, fields),
    ...(customFields.length ? [{ label: 'Custom Fields', fieldConfigs: customFields.map((cf: any) => ({ name: cf.fieldName, type: cf.type, required: cf.isRequired, label: cf.label, options: cf.options })) }] : []),
  ]
  const [activeTab, setActiveTab] = useState(tabs[0]?.label || 'Details')

  return (
    <TabsRoot value={activeTab} onValueChange={setActiveTab}>
      <div className="px-6 pt-4 border-b">
        <TabsList className="border-b-0">
          {tabs.map((tab, i) => (
            <TabsTrigger key={tab.label} value={tab.label} className={TAB_ACTIVE_COLORS[i % TAB_ACTIVE_COLORS.length]}>
              <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${TAB_DOT_COLORS[i % TAB_DOT_COLORS.length]}`} />{tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {tabs.map(tab => (
        <TabsContent key={tab.label} value={tab.label} className="px-6 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-5">
            {tab.fieldConfigs.map((field: any) => {
              const isLong = field.type === 'textarea'
              const selOptions = options[module]?.[field.name]
              return (
                <div key={field.name} className={isLong ? 'md:col-span-2 xl:col-span-3' : ''}>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
                    {field.label || getFieldLabel(field.name)}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                      value={formData[field.name] ?? ''}
                      onChange={e => handleChange(field.name, e.target.value)}
                    />
                  ) : field.type === 'select' && selOptions ? (
                    <Select
                      value={formData[field.name] || '_none_'}
                      onValueChange={v => handleChange(field.name, v === '_none_' ? '' : v)}
                    >
                      <SelectTrigger className={cn(errors[field.name] ? 'border-destructive' : '', 'h-9')}>
                        <SelectValue placeholder="--None--" />
                      </SelectTrigger>
                      <SelectContent>
                        {(selOptions || ['--None--']).map((o: string) => (
                          <SelectItem key={o} value={o === '--None--' ? '_none_' : o}>{o}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : field.type === 'picklist' && field.options?.length ? (
                    <Select
                      value={formData[field.name] || '_none_'}
                      onValueChange={v => handleChange(field.name, v === '_none_' ? '' : v)}
                    >
                      <SelectTrigger className={cn(errors[field.name] ? 'border-destructive' : '', 'h-9')}>
                        <SelectValue placeholder="--None--" />
                      </SelectTrigger>
                      <SelectContent>
                        {(['--None--', ...(field.options || [])]).map((o: string) => (
                          <SelectItem key={o} value={o === '--None--' ? '_none_' : o}>{o}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : field.type === 'user-select' ? (
                    <Select
                      value={formData[field.name] || '_none_'}
                      onValueChange={v => handleChange(field.name, v === '_none_' ? '' : v)}
                    >
                      <SelectTrigger className={cn(errors[field.name] ? 'border-destructive' : '', 'h-9')}>
                        <SelectValue placeholder="--None--" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none_">--None--</SelectItem>
                        {users.map((u: any) => {
                          const uname = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.userName || u.email
                          return <SelectItem key={u.id} value={u.id}>{uname}</SelectItem>
                        })}
                      </SelectContent>
                    </Select>
                  ) : field.type === 'checkbox' ? (
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-input"
                        checked={!!formData[field.name]}
                        onChange={e => handleChange(field.name, e.target.checked)}
                      />
                      <span className="text-sm text-muted-foreground">{field.label || getFieldLabel(field.name)}</span>
                    </div>
                  ) : field.type === 'multiselect' ? (
                    <Input
                      value={formData[field.name] || ''}
                      onChange={e => handleChange(field.name, e.target.value)}
                      placeholder="Comma-separated values"
                      className="rounded-lg"
                    />
                  ) : field.type === 'date' ? (
                    <Input
                      type="date"
                      value={formData[field.name] || ''}
                      onChange={e => handleChange(field.name, e.target.value)}
                      className="rounded-lg"
                    />
                  ) : field.type === 'project-select' ? (
                    <div>
                      <ProjectSearchSelect
                        value={formData[field.name] || ''}
                        projects={projects}
                        onSelect={(id: string) => handleChange(field.name, id)}
                        placeholder="Search project..."
                      />
                      {formData[field.name] && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {projects.find((p: any) => p.id === formData[field.name])?.projectName || 'Project selected'}
                        </p>
                      )}
                    </div>
                  ) : field.type === 'file' ? (
                    <Input
                      type="file"
                      onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleChange('fileName', file.name)
                          handleChange('fileData', file)
                        }
                      }}
                      className="rounded-lg"
                    />
                  ) : (
                    <Input
                      type={field.type}
                      value={formData[field.name] ?? ''}
                      onChange={e => handleChange(field.name, field.type === 'number' ? Number(e.target.value) || 0 : e.target.value)}
                      className={cn(errors[field.name] ? 'border-destructive' : '', 'rounded-lg')}
                    />
                  )}
                  {errors[field.name] && (
                    <p className="text-xs text-destructive mt-1">{errors[field.name]}</p>
                  )}
                </div>
              )
            })}
          </div>
        </TabsContent>
      ))}
    </TabsRoot>
  )
}
