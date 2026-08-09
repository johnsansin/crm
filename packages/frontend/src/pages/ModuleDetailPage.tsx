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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { getFieldTabs, getFieldLabel, formatFieldValue } from '@/lib/field-utils'
import { useOrgSettings } from '@/lib/org-format'
import { ProjectSearchSelect } from '@/components/project-search-select'
import { UserRoleSelect, userDisplayName } from '@/components/user-role-select'
import { SearchSelect } from '@/components/search-select'
import { VendorSearchSelect } from '@/components/vendor-search-select'
import { ArrowLeft, Save, Loader2, Trash2, Pencil, ChevronRight, Asterisk, ImagePlus, Plus, Package, History } from 'lucide-react'

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
  products: { productCategory: ['--None--','Hardware','Software','Services','Consulting','Training','Other'], manufacturer: ['--None--','ACME Corp','Alpha Manufacturing','Beta Industries','Delta Tech','ElectroWorks','Global Parts','Mega Machines','Omega Systems','Precision Tools','Vertex Inc.'], glAccount: ['--None--','2204 - Inventory','2204 - Inventory Assets','4100 - Sales','5100 - Cost of Goods Sold','6100 - Product Purchases'], taxClass: ['--None--','Taxable','Exempt','Zero Rated','Reduced Rate'], usageUnit: ['--None--','Each','Hour','Day','Month','Year','Box','Dozen','Kg','Lb','Set'], commissionMethod: ['--None--','Fixed','Percentage'] },
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
    { name: 'productNo', type: 'text' },
    { name: 'productName', type: 'text', required: true },
    { name: 'image', type: 'image' },
    { name: 'productCategory', type: 'search-select' },
    { name: 'manufacturer', type: 'search-select' },
    { name: 'glAccount', type: 'search-select' },
    { name: 'usageUnit', type: 'search-select' },
    { name: 'taxClass', type: 'search-select' },
    { name: 'isActive', type: 'checkbox' },
    { name: 'vat', type: 'checkbox' },
    { name: 'isService', type: 'checkbox' },
    { name: 'isSales', type: 'checkbox' },
    { name: 'serialNo', type: 'text' },
    { name: 'mfrPartNo', type: 'text' },
    { name: 'vendorPartNo', type: 'text' },
    { name: 'productSheet', type: 'text' },
    { name: 'qtyPerUnit', type: 'text' },
    { name: 'website', type: 'text' },
    { name: 'unitPrice', type: 'number' },
    { name: 'costPrice', type: 'number' },
    { name: 'commissionRate', type: 'number' },
    { name: 'commissionMethod', type: 'search-select' },
    { name: 'qtyInStock', type: 'number' },
    { name: 'reorderLevel', type: 'number' },
    { name: 'qtyOnOrder', type: 'number' },
    { name: 'qtyInDemand', type: 'number' },
    { name: 'weight', type: 'number' },
    { name: 'packSize', type: 'number' },
    { name: 'vendorId', type: 'vendor-select' },
    { name: 'assignedTo', type: 'user-select' },
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
    { name: 'vendorId', type: 'vendor-select' },
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
  if (type === 'checkbox') return value ? 'Yes' : 'No'
  return formatFieldValue(value, name || '')
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

  const { data: relatedTasks } = useQuery({
    queryKey: ['projects', id, 'tasks'],
    queryFn: () => api.listAll('projecttasks', { filter: JSON.stringify({ projectId: id }) }),
    enabled: mod === 'projects' && !isNew,
  })
  const { data: relatedMilestones } = useQuery({
    queryKey: ['projects', id, 'milestones'],
    queryFn: () => api.listAll('projectmilestones', { filter: JSON.stringify({ projectId: id }) }),
    enabled: mod === 'projects' && !isNew,
  })
  const relatedTaskList = relatedTasks?.data || []
  const relatedMilestoneList = relatedMilestones?.data || []

  const needsUsers = (fieldConfigs[mod] || []).some((f: any) => f.type === 'user-select')
  const { data: usersData } = useQuery({
    queryKey: ['module-users', mod],
    queryFn: () => api.request<any>(`/${mod}/users`),
    enabled: needsUsers,
  })
  const users = usersData?.data || []
  const roles = usersData?.roles || []

  const needsVendors = mod === 'products' || mod === 'purchaseorders'
  const { data: vendorsData } = useQuery({
    queryKey: ['module-vendors', mod],
    queryFn: () => api.listAll('vendors'),
    enabled: needsVendors,
  })
  const vendors = vendorsData?.data || []

  const [vendorModalOpen, setVendorModalOpen] = useState(false)
  const [vendorForm, setVendorForm] = useState<Record<string, string>>({})
  const [savingVendor, setSavingVendor] = useState(false)
  const addVendorMutation = useMutation({
    mutationFn: (data: any) => api.create('vendors', data),
    onSuccess: (created: any) => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
      addToast({ title: 'Vendor created', variant: 'success' })
      handleChange('vendorId', created.id || '')
      setVendorModalOpen(false)
      setVendorForm({})
    },
    onError: (err: Error) => addToast({ title: 'Error', description: err.message, variant: 'destructive' }),
  })

  const [uploadingImage, setUploadingImage] = useState(false)

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
      const preseed: Record<string, any> = {}
      if (searchParams.get('projectId')) preseed.projectId = searchParams.get('projectId')
      setFormData(preseed)
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
      } else if (field.type === 'checkbox') {
        payload[field.name] = !!val
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
                  <button type="button" onClick={() => navigate(`/${mod}`)} className="transition-colors hover:text-foreground">
                    {label}
                  </button>{' '}
                  <ChevronRight size={12} /> Details
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
                          {field.name === 'image' && record?.image ? (
                            <img src={record.image} alt={record.productName || 'Product'} className="mt-1.5 h-20 w-20 rounded-lg border object-cover" />
                          ) : (
                          <p className="text-sm mt-1.5 font-medium text-foreground">
                            {field.name === 'projectId'
                              ? (projects.find(p => p.id === record?.projectId)?.projectName || '-')
                              : field.name === 'assignedTo'
                                ? ((() => {
                                    const assignedId = record?.assignedTo
                                    if (assignedId) {
                                      const u: any = users.find((x: any) => x.id === assignedId)
                                      if (u) return userDisplayName(u)
                                      const r: any = roles.find((x: any) => x.id === assignedId)
                                      if (r) return r.name
                                    }
                                    return record?.ownerName || '-'
                                  })())
                                : field.name === 'vendorId'
                                  ? (vendors.find((v: any) => v.id === record?.vendorId)?.vendorName || record?.vendorName || formatDisplayValue(record?.vendorId, field.type, field.name))
                                  : formatDisplayValue(field.name.startsWith('cf_') ? record?.customFields?.[field.name] : record?.[field.name], field.type, field.name)}
                          </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </TabsContent>
              ))}
            </TabsRoot>
          </CardContent>
        </Card>
        {mod === 'potentials' && !isNew && <PotentialExtras potentialId={id!} />}
        {mod === 'projects' && !isNew && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">Related Tasks</h3>
                  <button type="button" onClick={() => navigate(`/projecttasks/new?projectId=${id}`)} className="text-xs font-medium text-primary hover:underline">
                    + Add Task
                  </button>
                </div>
                {relatedTaskList.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tasks yet.</p>
                ) : (
                  <div className="space-y-2">
                    {relatedTaskList.map((t: any) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => navigate(`/projecttasks/${t.id}`)}
                        className="flex w-full items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2 text-left text-sm transition-colors hover:bg-accent/40"
                      >
                        <span className="truncate font-medium">{t.title}</span>
                        <span className="flex shrink-0 items-center gap-2">
                          {t.status && <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{t.status}</span>}
                          {t.progress != null && <span className="text-xs text-muted-foreground">{t.progress}%</span>}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">Related Milestones</h3>
                  <button type="button" onClick={() => navigate(`/projectmilestones/new?projectId=${id}`)} className="text-xs font-medium text-primary hover:underline">
                    + Add Milestone
                  </button>
                </div>
                {relatedMilestoneList.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No milestones yet.</p>
                ) : (
                  <div className="space-y-2">
                    {relatedMilestoneList.map((m: any) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => navigate(`/projectmilestones/${m.id}`)}
                        className="flex w-full items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2 text-left text-sm transition-colors hover:bg-accent/40"
                      >
                        <span className="truncate font-medium">{m.title}</span>
                        <span className="flex shrink-0 items-center gap-2">
                          {m.status && <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{m.status}</span>}
                          {m.progress != null && <span className="text-xs text-muted-foreground">{m.progress}%</span>}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
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
                <button type="button" onClick={() => navigate(`/${mod}`)} className="transition-colors hover:text-foreground">
                  {label}
                </button>{' '}
                <ChevronRight size={12} /> {isNew ? 'New Record' : 'Edit Record'}
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
              roles={roles}
              vendors={vendors}
              uploadingImage={uploadingImage}
              onUploadImage={async (file: File) => {
                setUploadingImage(true)
                try {
                  const res = await api.uploadFile(file)
                  handleChange('image', res.path)
                } catch (e: any) {
                  addToast({ title: 'Upload failed', description: e.message, variant: 'destructive' })
                } finally {
                  setUploadingImage(false)
                }
              }}
              onAddVendor={() => setVendorModalOpen(true)}
              onOpenVendorFullForm={() => navigate('/vendors/new')}
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

      <Dialog open={vendorModalOpen} onOpenChange={setVendorModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Vendor</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">Vendor Name *</label>
              <Input value={vendorForm.vendorName || ''} onChange={e => setVendorForm(f => ({ ...f, vendorName: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">Email</label>
              <Input type="email" value={vendorForm.email || ''} onChange={e => setVendorForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">Phone</label>
              <Input value={vendorForm.phone || ''} onChange={e => setVendorForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">Website</label>
              <Input value={vendorForm.website || ''} onChange={e => setVendorForm(f => ({ ...f, website: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">Category</label>
              <Input value={vendorForm.category || ''} onChange={e => setVendorForm(f => ({ ...f, category: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={() => setVendorModalOpen(false)}>Cancel</Button>
            <Button
              type="button"
              disabled={!vendorForm.vendorName || savingVendor}
              onClick={() => {
                setSavingVendor(true)
                addVendorMutation.mutate(vendorForm, { onSettled: () => setSavingVendor(false) })
              }}
            >
              {savingVendor ? <Loader2 size={15} className="mr-2 animate-spin" /> : <Plus size={15} className="mr-2" />}
              Create Vendor
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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

function FormTabs({ module, fields, formData, errors, handleChange, SELECT_OPTIONS: options, projects, users = [], roles = [], vendors = [], uploadingImage = false, onUploadImage, onAddVendor, onOpenVendorFullForm, customFields = [] }: {
  module: string; fields: any[]; formData: any; errors: any; handleChange: any; SELECT_OPTIONS: any; projects: any[]; users?: any[]; roles?: any[]; vendors?: any[]; uploadingImage?: boolean; onUploadImage?: (file: File) => void; onAddVendor?: () => void; onOpenVendorFullForm?: () => void; customFields?: any[]
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
                    <UserRoleSelect
                      value={formData[field.name] || ''}
                      users={users}
                      roles={roles}
                      onSelect={v => handleChange(field.name, v)}
                    />
                  ) : field.type === 'vendor-select' ? (
                    <VendorSearchSelect
                      value={formData[field.name] || ''}
                      vendors={vendors}
                      onSelect={v => handleChange(field.name, v)}
                      onAddNew={onAddVendor || (() => {})}
                      onOpenFullForm={onOpenVendorFullForm || (() => {})}
                    />
                  ) : field.type === 'search-select' && selOptions ? (
                    <SearchSelect
                      value={formData[field.name] || ''}
                      options={selOptions}
                      onSelect={v => handleChange(field.name, v === '--None--' ? '' : v)}
                    />
                  ) : field.type === 'image' ? (
                    <div className="flex items-center gap-3">
                      {formData[field.name] ? (
                        <img
                          src={formData[field.name]}
                          alt="Product"
                          className="h-16 w-16 rounded-lg border object-cover"
                        />
                      ) : (
                        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-lg border border-dashed bg-muted/30 text-muted-foreground">
                          <ImagePlus size={18} />
                        </div>
                      )}
                      <label className="relative cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          disabled={uploadingImage}
                          onChange={async e => {
                            const file = e.target.files?.[0]
                            if (file && onUploadImage) await onUploadImage(file)
                            e.target.value = ''
                          }}
                        />
                        <span className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-input bg-background px-3 text-sm shadow-sm transition-colors hover:bg-muted">
                          {uploadingImage ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
                          {formData[field.name] ? 'Change image' : 'Upload image'}
                        </span>
                      </label>
                      {formData[field.name] && (
                        <Button type="button" size="sm" variant="ghost" onClick={() => handleChange(field.name, '')} className="h-9 px-2 text-xs">
                          Remove
                        </Button>
                      )}
                    </div>
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

function PotentialExtras({ potentialId }: { potentialId: string }) {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  const { data: rec, isLoading } = useQuery({
    queryKey: ['potentials', potentialId],
    queryFn: () => api.get('potentials', potentialId!),
  })

  const { data: productsData } = useQuery({
    queryKey: ['products-all'],
    queryFn: () => api.listAll('products', { limit: '500' }),
  })
  const allProducts = productsData?.data || []

  const initialItems = (rec?.products || []).map((pp: any) => ({
    productId: pp.productId,
    productName: pp.product?.productName || pp.productId,
    qty: Number(pp.qty || 1),
    listPrice: pp.listPrice != null ? Number(pp.listPrice) : (pp.product?.unitPrice != null ? Number(pp.product.unitPrice) : 0),
  }))

  const [items, setItems] = useState<any[]>([])
  const [dirty, setDirty] = useState(false)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (rec) {
      setItems(initialItems)
      setDirty(false)
    }
  }, [rec])

  const saveMutation = useMutation({
    mutationFn: () => api.update('potentials', potentialId, {
      products: items.map(i => ({ productId: i.productId, qty: i.qty, listPrice: i.listPrice })),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['potentials', potentialId] })
      setDirty(false)
      setEditing(false)
      addToast({ title: 'Products updated', variant: 'success' })
    },
    onError: (e: Error) => addToast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>

  const lineTotal = (i: any) => Number(i.qty || 0) * Number(i.listPrice || 0)
  const grandTotal = items.reduce((s, i) => s + lineTotal(i), 0)
  const stageHistory = rec?.stageHistory || []

  const addRow = () => {
    const first = allProducts.find((p: any) => !items.some(i => i.productId === p.id))
    setItems([...items, { productId: first?.id || '', productName: first?.productName || '', qty: 1, listPrice: first ? Number(first.unitPrice || 0) : 0 }])
    setDirty(true)
    setEditing(true)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-1.5"><Package size={15} className="text-primary" /> Products &amp; Pricing</h3>
            {!editing ? (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}><Pencil size={13} className="mr-1.5" /> Edit</Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setItems(initialItems); setDirty(false); setEditing(false) }}>Cancel</Button>
                <Button size="sm" onClick={() => saveMutation.mutate()} disabled={!dirty || saveMutation.isPending}>
                  {saveMutation.isPending && <Loader2 size={13} className="mr-1.5 animate-spin" />}
                  Save
                </Button>
              </div>
            )}
          </div>

          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No products linked yet.</p>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 px-2 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                <span className="col-span-5">Product</span>
                <span className="col-span-2">Qty</span>
                <span className="col-span-2">List Price</span>
                <span className="col-span-2 text-right">Total</span>
                <span className="col-span-1" />
              </div>
              {items.map((i, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  {editing ? (
                    <>
                      <select
                        className="col-span-5 h-9 rounded-md border border-input bg-background px-2 text-sm"
                        value={i.productId}
                        onChange={e => {
                          const p = allProducts.find((x: any) => x.id === e.target.value)
                          setItems(items.map((x, k) => k === idx ? { ...x, productId: e.target.value, productName: p?.productName || '', listPrice: p ? Number(p.unitPrice || 0) : x.listPrice } : x))
                          setDirty(true)
                        }}
                      >
                        <option value="">Select product…</option>
                        {allProducts.map((p: any) => <option key={p.id} value={p.id}>{p.productName}</option>)}
                      </select>
                      <Input type="number" min={1} className="col-span-2 h-9" value={i.qty} onChange={e => { setItems(items.map((x, k) => k === idx ? { ...x, qty: Number(e.target.value) || 0 } : x)); setDirty(true) }} />
                      <Input type="number" className="col-span-2 h-9" value={i.listPrice} onChange={e => { setItems(items.map((x, k) => k === idx ? { ...x, listPrice: Number(e.target.value) || 0 } : x)); setDirty(true) }} />
                    </>
                  ) : (
                    <>
                      <span className="col-span-5 text-sm truncate">{i.productName}</span>
                      <span className="col-span-2 text-sm">{i.qty}</span>
                      <span className="col-span-2 text-sm">{(i.listPrice ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </>
                  )}
                  <span className="col-span-2 text-right text-sm font-medium">{lineTotal(i).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  {editing && (
                    <button type="button" className="col-span-1 text-muted-foreground hover:text-destructive" onClick={() => { setItems(items.filter((_, k) => k !== idx)); setDirty(true) }}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              <div className="flex items-center justify-between border-t pt-2 px-2">
                <span className="text-sm font-semibold">Grand Total</span>
                <span className="text-sm font-semibold">{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          )}
          {editing && (
            <Button variant="outline" size="sm" className="mt-3" onClick={addRow}><Plus size={13} className="mr-1.5" /> Add Product</Button>
          )}
          {!editing && items.length === 0 && (
            <Button variant="outline" size="sm" className="mt-3" onClick={addRow}><Plus size={13} className="mr-1.5" /> Link Product</Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-4"><History size={15} className="text-primary" /> Sales Stage History</h3>
          {stageHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">No stage changes recorded yet.</p>
          ) : (
            <ol className="relative border-l-2 border-muted ml-2 space-y-4">
              {stageHistory.map((h: any, idx: number) => (
                <li key={h.id} className="ml-4">
                  <span className={`absolute -left-[7px] mt-1 h-3 w-3 rounded-full border-2 border-background ${idx === stageHistory.length - 1 ? 'bg-emerald-500' : 'bg-primary'}`} />
                  <p className="text-sm font-medium">{h.stage}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(h.createdAt).toLocaleString()}
                    {h.changedByUser ? ` · by ${h.changedByUser.firstName} ${h.changedByUser.lastName}` : ''}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
