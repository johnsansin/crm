
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  userName: 'userName',
  email: 'email',
  firstName: 'firstName',
  lastName: 'lastName',
  password: 'password',
  phone: 'phone',
  mobile: 'mobile',
  title: 'title',
  department: 'department',
  addressStreet: 'addressStreet',
  addressCity: 'addressCity',
  addressState: 'addressState',
  addressCountry: 'addressCountry',
  addressPostalCode: 'addressPostalCode',
  timezone: 'timezone',
  language: 'language',
  avatar: 'avatar',
  pbxExtension: 'pbxExtension',
  isActive: 'isActive',
  isAdmin: 'isAdmin',
  isAgent: 'isAgent',
  lastLogin: 'lastLogin',
  lastActiveAt: 'lastActiveAt',
  resetToken: 'resetToken',
  resetTokenExpires: 'resetTokenExpires',
  twoFactorSecret: 'twoFactorSecret',
  twoFactorEnabled: 'twoFactorEnabled',
  hasCompletedOnboarding: 'hasCompletedOnboarding',
  hasCompletedQuickStart: 'hasCompletedQuickStart',
  failedLoginAttempts: 'failedLoginAttempts',
  lockedUntil: 'lockedUntil',
  dateFormat: 'dateFormat',
  hourFormat: 'hourFormat',
  startOfWeek: 'startOfWeek',
  defaultModule: 'defaultModule',
  currencyCode: 'currencyCode',
  sidebarColor: 'sidebarColor',
  dashboardEnabled: 'dashboardEnabled',
  dashboardConfig: 'dashboardConfig',
  favoriteModules: 'favoriteModules',
  tokenVersion: 'tokenVersion',
  roleId: 'roleId',
  companyId: 'companyId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RoleScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  parentId: 'parentId',
  companyId: 'companyId',
  isPublic: 'isPublic',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RolePermissionScalarFieldEnum = {
  id: 'id',
  roleId: 'roleId',
  moduleName: 'moduleName',
  view: 'view',
  create: 'create',
  edit: 'edit',
  delete: 'delete',
  import: 'import',
  export: 'export',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserGroupScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  companyId: 'companyId',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserGroupMemberScalarFieldEnum = {
  id: 'id',
  groupId: 'groupId',
  userId: 'userId',
  createdAt: 'createdAt'
};

exports.Prisma.UserProfileScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  isSuperAdmin: 'isSuperAdmin',
  permissions: 'permissions',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ModuleScalarFieldEnum = {
  id: 'id',
  name: 'name',
  label: 'label',
  parent: 'parent',
  sequence: 'sequence',
  isEntity: 'isEntity',
  isActive: 'isActive',
  icon: 'icon',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CurrencyScalarFieldEnum = {
  id: 'id',
  name: 'name',
  code: 'code',
  symbol: 'symbol',
  rate: 'rate',
  isDefault: 'isDefault',
  isActive: 'isActive',
  companyId: 'companyId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CustomViewScalarFieldEnum = {
  id: 'id',
  moduleId: 'moduleId',
  name: 'name',
  isDefault: 'isDefault',
  isPublic: 'isPublic',
  userId: 'userId',
  columns: 'columns',
  conditions: 'conditions',
  orderBy: 'orderBy',
  companyId: 'companyId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AccountScalarFieldEnum = {
  id: 'id',
  accountNo: 'accountNo',
  accountName: 'accountName',
  parentId: 'parentId',
  website: 'website',
  phone: 'phone',
  otherPhone: 'otherPhone',
  fax: 'fax',
  email: 'email',
  email2: 'email2',
  emailOptOut: 'emailOptOut',
  notifyOwner: 'notifyOwner',
  employees: 'employees',
  annualRevenue: 'annualRevenue',
  industry: 'industry',
  accountType: 'accountType',
  ownership: 'ownership',
  rating: 'rating',
  sicCode: 'sicCode',
  tickerSymbol: 'tickerSymbol',
  glAccount: 'glAccount',
  billingStreet: 'billingStreet',
  billingCity: 'billingCity',
  billingState: 'billingState',
  billingCountry: 'billingCountry',
  billingPostalCode: 'billingPostalCode',
  billingPoBox: 'billingPoBox',
  shippingStreet: 'shippingStreet',
  shippingCity: 'shippingCity',
  shippingState: 'shippingState',
  shippingCountry: 'shippingCountry',
  shippingPostalCode: 'shippingPostalCode',
  shippingPoBox: 'shippingPoBox',
  description: 'description',
  companyId: 'companyId',
  isActive: 'isActive',
  createdBy: 'createdBy',
  assignedTo: 'assignedTo',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ContactScalarFieldEnum = {
  id: 'id',
  contactNo: 'contactNo',
  salutation: 'salutation',
  firstName: 'firstName',
  lastName: 'lastName',
  title: 'title',
  department: 'department',
  email: 'email',
  secondaryEmail: 'secondaryEmail',
  phone: 'phone',
  mobile: 'mobile',
  homePhone: 'homePhone',
  otherPhone: 'otherPhone',
  fax: 'fax',
  assistant: 'assistant',
  assistantPhone: 'assistantPhone',
  dob: 'dob',
  reportsTo: 'reportsTo',
  leadSource: 'leadSource',
  contactType: 'contactType',
  contactStatus: 'contactStatus',
  emailOptIn: 'emailOptIn',
  smsOptIn: 'smsOptIn',
  preferredLanguage: 'preferredLanguage',
  platform: 'platform',
  adGroup: 'adGroup',
  timeZone: 'timeZone',
  primaryTwitter: 'primaryTwitter',
  primaryLinkedIn: 'primaryLinkedIn',
  linkedInFollowers: 'linkedInFollowers',
  primaryFacebook: 'primaryFacebook',
  facebookFollowers: 'facebookFollowers',
  doNotCall: 'doNotCall',
  emailOptOut: 'emailOptOut',
  notifyOwner: 'notifyOwner',
  portal: 'portal',
  image: 'image',
  supportStartDate: 'supportStartDate',
  supportEndDate: 'supportEndDate',
  isConvertedFromLead: 'isConvertedFromLead',
  googleContactId: 'googleContactId',
  assignedTo: 'assignedTo',
  companyId: 'companyId',
  isActive: 'isActive',
  description: 'description',
  mailingStreet: 'mailingStreet',
  mailingCity: 'mailingCity',
  mailingState: 'mailingState',
  mailingCountry: 'mailingCountry',
  mailingPostalCode: 'mailingPostalCode',
  mailingPoBox: 'mailingPoBox',
  otherStreet: 'otherStreet',
  otherCity: 'otherCity',
  otherState: 'otherState',
  otherCountry: 'otherCountry',
  otherPostalCode: 'otherPostalCode',
  otherPoBox: 'otherPoBox',
  accountId: 'accountId',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.LeadScalarFieldEnum = {
  id: 'id',
  leadNo: 'leadNo',
  salutation: 'salutation',
  firstName: 'firstName',
  lastName: 'lastName',
  title: 'title',
  company: 'company',
  email: 'email',
  secondaryEmail: 'secondaryEmail',
  phone: 'phone',
  mobile: 'mobile',
  fax: 'fax',
  website: 'website',
  leadSource: 'leadSource',
  leadStatus: 'leadStatus',
  industry: 'industry',
  annualRevenue: 'annualRevenue',
  noOfEmployees: 'noOfEmployees',
  rating: 'rating',
  emailOptOut: 'emailOptOut',
  interest: 'interest',
  leadScore: 'leadScore',
  nextFollowUp: 'nextFollowUp',
  isConverted: 'isConverted',
  convertedAccountId: 'convertedAccountId',
  convertedContactId: 'convertedContactId',
  convertedPotentialId: 'convertedPotentialId',
  description: 'description',
  companyId: 'companyId',
  isActive: 'isActive',
  assignedTo: 'assignedTo',
  street: 'street',
  city: 'city',
  state: 'state',
  country: 'country',
  postalCode: 'postalCode',
  poBox: 'poBox',
  createdBy: 'createdBy',
  campaignId: 'campaignId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PotentialScalarFieldEnum = {
  id: 'id',
  potentialNo: 'potentialNo',
  potentialName: 'potentialName',
  amount: 'amount',
  closingDate: 'closingDate',
  currency: 'currency',
  type: 'type',
  stage: 'stage',
  probability: 'probability',
  leadSource: 'leadSource',
  forecastAmount: 'forecastAmount',
  forecastCategory: 'forecastCategory',
  outcomeAnalysis: 'outcomeAnalysis',
  nextStep: 'nextStep',
  description: 'description',
  companyId: 'companyId',
  isActive: 'isActive',
  assignedTo: 'assignedTo',
  campaignId: 'campaignId',
  accountId: 'accountId',
  contactId: 'contactId',
  productId: 'productId',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  lossReason: 'lossReason',
  nextFollowUp: 'nextFollowUp',
  sourceCampaign: 'sourceCampaign',
  contactRole: 'contactRole',
  decisionMaker: 'decisionMaker'
};

exports.Prisma.PotentialProductScalarFieldEnum = {
  id: 'id',
  potentialId: 'potentialId',
  productId: 'productId',
  qty: 'qty',
  listPrice: 'listPrice',
  companyId: 'companyId',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PotentialStageHistoryScalarFieldEnum = {
  id: 'id',
  potentialId: 'potentialId',
  stage: 'stage',
  changedBy: 'changedBy',
  companyId: 'companyId',
  createdAt: 'createdAt'
};

exports.Prisma.CampaignScalarFieldEnum = {
  id: 'id',
  campaignNo: 'campaignNo',
  campaignName: 'campaignName',
  campaignType: 'campaignType',
  status: 'status',
  startDate: 'startDate',
  endDate: 'endDate',
  closingDate: 'closingDate',
  expectedRevenue: 'expectedRevenue',
  budget: 'budget',
  actualCost: 'actualCost',
  expectedResponse: 'expectedResponse',
  targetSize: 'targetSize',
  sponsor: 'sponsor',
  targetAudience: 'targetAudience',
  expectedROI: 'expectedROI',
  actualROI: 'actualROI',
  expectedResponseCount: 'expectedResponseCount',
  expectedSalesCount: 'expectedSalesCount',
  actualResponseCount: 'actualResponseCount',
  actualSalesCount: 'actualSalesCount',
  description: 'description',
  companyId: 'companyId',
  isActive: 'isActive',
  assignedTo: 'assignedTo',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ProductScalarFieldEnum = {
  id: 'id',
  productNo: 'productNo',
  productName: 'productName',
  partNumber: 'partNumber',
  productCategory: 'productCategory',
  productType: 'productType',
  manufacturer: 'manufacturer',
  website: 'website',
  unitPrice: 'unitPrice',
  costPrice: 'costPrice',
  commissionRate: 'commissionRate',
  commissionPercentage: 'commissionPercentage',
  commissionMethod: 'commissionMethod',
  weight: 'weight',
  packSize: 'packSize',
  qtyInStock: 'qtyInStock',
  qtyOnOrder: 'qtyOnOrder',
  qtyInDemand: 'qtyInDemand',
  reorderLevel: 'reorderLevel',
  qtyPerUnit: 'qtyPerUnit',
  usageUnit: 'usageUnit',
  salesStartDate: 'salesStartDate',
  salesEndDate: 'salesEndDate',
  startDate: 'startDate',
  expiryDate: 'expiryDate',
  supportStartDate: 'supportStartDate',
  supportEndDate: 'supportEndDate',
  discontinued: 'discontinued',
  vat: 'vat',
  isService: 'isService',
  isSales: 'isSales',
  vatPercentage: 'vatPercentage',
  servicePercentage: 'servicePercentage',
  salesPercentage: 'salesPercentage',
  pricingFormula: 'pricingFormula',
  markupPercent: 'markupPercent',
  serialNo: 'serialNo',
  mfrPartNo: 'mfrPartNo',
  vendorPartNo: 'vendorPartNo',
  productSheet: 'productSheet',
  glAccount: 'glAccount',
  taxClass: 'taxClass',
  description: 'description',
  companyId: 'companyId',
  isActive: 'isActive',
  isDeleted: 'isDeleted',
  image: 'image',
  vendorId: 'vendorId',
  assignedTo: 'assignedTo',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  minimumOrderQty: 'minimumOrderQty',
  maximumOrderQty: 'maximumOrderQty',
  qtyDiscountEnabled: 'qtyDiscountEnabled',
  hsnCode: 'hsnCode',
  sacCode: 'sacCode',
  warrantyMonths: 'warrantyMonths'
};

exports.Prisma.ProductImageScalarFieldEnum = {
  id: 'id',
  productId: 'productId',
  imageUrl: 'imageUrl',
  isDefault: 'isDefault',
  sortOrder: 'sortOrder',
  createdAt: 'createdAt'
};

exports.Prisma.LeadProductScalarFieldEnum = {
  id: 'id',
  leadId: 'leadId',
  productId: 'productId',
  qty: 'qty',
  listPrice: 'listPrice',
  companyId: 'companyId',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.LeadServiceScalarFieldEnum = {
  id: 'id',
  leadId: 'leadId',
  serviceId: 'serviceId',
  qty: 'qty',
  listPrice: 'listPrice',
  companyId: 'companyId',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ServiceScalarFieldEnum = {
  id: 'id',
  serviceNo: 'serviceNo',
  serviceName: 'serviceName',
  serviceCategory: 'serviceCategory',
  unitPrice: 'unitPrice',
  costPrice: 'costPrice',
  commissionRate: 'commissionRate',
  commissionMethod: 'commissionMethod',
  qtyPerUnit: 'qtyPerUnit',
  usageUnit: 'usageUnit',
  taxClass: 'taxClass',
  reorderLevel: 'reorderLevel',
  qtyInStock: 'qtyInStock',
  qtyInDemand: 'qtyInDemand',
  website: 'website',
  serialNo: 'serialNo',
  glAccount: 'glAccount',
  discontinued: 'discontinued',
  image: 'image',
  description: 'description',
  vendorId: 'vendorId',
  companyId: 'companyId',
  isActive: 'isActive',
  isDeleted: 'isDeleted',
  assignedTo: 'assignedTo',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  status: 'status',
  billingCycle: 'billingCycle',
  slaResponseHours: 'slaResponseHours',
  slaResolutionHours: 'slaResolutionHours',
  setupFee: 'setupFee',
  minContractMonths: 'minContractMonths',
  trialAvailable: 'trialAvailable',
  version: 'version'
};

exports.Prisma.VendorScalarFieldEnum = {
  id: 'id',
  vendorNo: 'vendorNo',
  vendorName: 'vendorName',
  email: 'email',
  phone: 'phone',
  mobile: 'mobile',
  website: 'website',
  category: 'category',
  glAccount: 'glAccount',
  street: 'street',
  city: 'city',
  state: 'state',
  country: 'country',
  postalCode: 'postalCode',
  description: 'description',
  companyId: 'companyId',
  isActive: 'isActive',
  assignedTo: 'assignedTo',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  rating: 'rating',
  taxId: 'taxId',
  paymentTerms: 'paymentTerms',
  annualRevenue: 'annualRevenue',
  employees: 'employees',
  yearEstablished: 'yearEstablished',
  logo: 'logo',
  linkedin: 'linkedin',
  contactPerson: 'contactPerson',
  contactEmail: 'contactEmail',
  contactPhone: 'contactPhone'
};

exports.Prisma.PriceBookScalarFieldEnum = {
  id: 'id',
  priceBookNo: 'priceBookNo',
  priceBookName: 'priceBookName',
  active: 'active',
  companyId: 'companyId',
  isActive: 'isActive',
  description: 'description',
  assignedTo: 'assignedTo',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  currency: 'currency',
  conversionRate: 'conversionRate',
  discountAllowed: 'discountAllowed',
  maxDiscountPercent: 'maxDiscountPercent',
  validFrom: 'validFrom',
  validUntil: 'validUntil',
  targetSegment: 'targetSegment'
};

exports.Prisma.PriceBookProductScalarFieldEnum = {
  id: 'id',
  priceBookId: 'priceBookId',
  productId: 'productId',
  listPrice: 'listPrice',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.QuoteScalarFieldEnum = {
  id: 'id',
  quoteNo: 'quoteNo',
  subject: 'subject',
  validUntil: 'validUntil',
  total: 'total',
  subTotal: 'subTotal',
  discount: 'discount',
  discountPercent: 'discountPercent',
  adjustment: 'adjustment',
  shipping: 'shipping',
  shippingHandling: 'shippingHandling',
  taxAmount: 'taxAmount',
  taxType: 'taxType',
  grandTotal: 'grandTotal',
  carrier: 'carrier',
  inventoryManager: 'inventoryManager',
  quoteStage: 'quoteStage',
  currency: 'currency',
  conversionRate: 'conversionRate',
  terms: 'terms',
  description: 'description',
  companyId: 'companyId',
  isActive: 'isActive',
  accountId: 'accountId',
  contactId: 'contactId',
  potentialId: 'potentialId',
  billingStreet: 'billingStreet',
  billingCity: 'billingCity',
  billingState: 'billingState',
  billingCountry: 'billingCountry',
  billingPostalCode: 'billingPostalCode',
  billingPoBox: 'billingPoBox',
  shippingStreet: 'shippingStreet',
  shippingCity: 'shippingCity',
  shippingState: 'shippingState',
  shippingCountry: 'shippingCountry',
  shippingPostalCode: 'shippingPostalCode',
  shippingPoBox: 'shippingPoBox',
  assignedTo: 'assignedTo',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  approvalStatus: 'approvalStatus',
  approvedBy: 'approvedBy',
  approvedAt: 'approvedAt',
  rejectionReason: 'rejectionReason',
  quoteType: 'quoteType',
  paymentTerms: 'paymentTerms',
  deliveryTerms: 'deliveryTerms'
};

exports.Prisma.QuoteLineItemScalarFieldEnum = {
  id: 'id',
  quoteId: 'quoteId',
  productId: 'productId',
  serviceId: 'serviceId',
  itemName: 'itemName',
  qty: 'qty',
  listPrice: 'listPrice',
  unitPrice: 'unitPrice',
  discount: 'discount',
  discountPercent: 'discountPercent',
  tax: 'tax',
  taxPercent: 'taxPercent',
  netPrice: 'netPrice',
  lineTotal: 'lineTotal',
  sequence: 'sequence',
  description: 'description',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.QuoteStageHistoryScalarFieldEnum = {
  id: 'id',
  quoteId: 'quoteId',
  stage: 'stage',
  changedBy: 'changedBy',
  createdAt: 'createdAt'
};

exports.Prisma.SalesOrderScalarFieldEnum = {
  id: 'id',
  salesOrderNo: 'salesOrderNo',
  subject: 'subject',
  validUntil: 'validUntil',
  total: 'total',
  subTotal: 'subTotal',
  discount: 'discount',
  discountPercent: 'discountPercent',
  adjustment: 'adjustment',
  shipping: 'shipping',
  shippingHandling: 'shippingHandling',
  taxAmount: 'taxAmount',
  taxType: 'taxType',
  grandTotal: 'grandTotal',
  carrier: 'carrier',
  soStatus: 'soStatus',
  customerNo: 'customerNo',
  purchaseOrderNo: 'purchaseOrderNo',
  salesCommission: 'salesCommission',
  exciseDuty: 'exciseDuty',
  pending: 'pending',
  enableRecurring: 'enableRecurring',
  recurringFrequency: 'recurringFrequency',
  startPeriod: 'startPeriod',
  endPeriod: 'endPeriod',
  currency: 'currency',
  conversionRate: 'conversionRate',
  terms: 'terms',
  description: 'description',
  companyId: 'companyId',
  isActive: 'isActive',
  accountId: 'accountId',
  contactId: 'contactId',
  potentialId: 'potentialId',
  quoteId: 'quoteId',
  vendorId: 'vendorId',
  billingStreet: 'billingStreet',
  billingCity: 'billingCity',
  billingState: 'billingState',
  billingCountry: 'billingCountry',
  billingPostalCode: 'billingPostalCode',
  billingPoBox: 'billingPoBox',
  shippingStreet: 'shippingStreet',
  shippingCity: 'shippingCity',
  shippingState: 'shippingState',
  shippingCountry: 'shippingCountry',
  shippingPostalCode: 'shippingPostalCode',
  shippingPoBox: 'shippingPoBox',
  assignedTo: 'assignedTo',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SalesOrderLineItemScalarFieldEnum = {
  id: 'id',
  salesOrderId: 'salesOrderId',
  productId: 'productId',
  serviceId: 'serviceId',
  itemName: 'itemName',
  qty: 'qty',
  listPrice: 'listPrice',
  unitPrice: 'unitPrice',
  discount: 'discount',
  discountPercent: 'discountPercent',
  tax: 'tax',
  taxPercent: 'taxPercent',
  netPrice: 'netPrice',
  lineTotal: 'lineTotal',
  sequence: 'sequence',
  description: 'description',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PurchaseOrderScalarFieldEnum = {
  id: 'id',
  purchaseOrderNo: 'purchaseOrderNo',
  subject: 'subject',
  validUntil: 'validUntil',
  total: 'total',
  subTotal: 'subTotal',
  discount: 'discount',
  discountPercent: 'discountPercent',
  adjustment: 'adjustment',
  shipping: 'shipping',
  shippingHandling: 'shippingHandling',
  taxAmount: 'taxAmount',
  taxType: 'taxType',
  grandTotal: 'grandTotal',
  carrier: 'carrier',
  salesCommission: 'salesCommission',
  exciseDuty: 'exciseDuty',
  poStatus: 'poStatus',
  paidAmount: 'paidAmount',
  currency: 'currency',
  conversionRate: 'conversionRate',
  terms: 'terms',
  description: 'description',
  companyId: 'companyId',
  isActive: 'isActive',
  vendorId: 'vendorId',
  contactId: 'contactId',
  billingStreet: 'billingStreet',
  billingCity: 'billingCity',
  billingState: 'billingState',
  billingCountry: 'billingCountry',
  billingPostalCode: 'billingPostalCode',
  billingPoBox: 'billingPoBox',
  shippingStreet: 'shippingStreet',
  shippingCity: 'shippingCity',
  shippingState: 'shippingState',
  shippingCountry: 'shippingCountry',
  shippingPostalCode: 'shippingPostalCode',
  shippingPoBox: 'shippingPoBox',
  assignedTo: 'assignedTo',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PurchaseOrderLineItemScalarFieldEnum = {
  id: 'id',
  purchaseOrderId: 'purchaseOrderId',
  productId: 'productId',
  serviceId: 'serviceId',
  itemName: 'itemName',
  qty: 'qty',
  listPrice: 'listPrice',
  unitPrice: 'unitPrice',
  discount: 'discount',
  discountPercent: 'discountPercent',
  tax: 'tax',
  taxPercent: 'taxPercent',
  netPrice: 'netPrice',
  lineTotal: 'lineTotal',
  sequence: 'sequence',
  description: 'description',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.InvoiceScalarFieldEnum = {
  id: 'id',
  invoiceNo: 'invoiceNo',
  subject: 'subject',
  invoiceDate: 'invoiceDate',
  dueDate: 'dueDate',
  total: 'total',
  subTotal: 'subTotal',
  discount: 'discount',
  discountPercent: 'discountPercent',
  adjustment: 'adjustment',
  shipping: 'shipping',
  shippingHandling: 'shippingHandling',
  taxAmount: 'taxAmount',
  taxType: 'taxType',
  grandTotal: 'grandTotal',
  customerNo: 'customerNo',
  purchaseOrderNo: 'purchaseOrderNo',
  salesCommission: 'salesCommission',
  exciseDuty: 'exciseDuty',
  invoiceStatus: 'invoiceStatus',
  paidAmount: 'paidAmount',
  currency: 'currency',
  conversionRate: 'conversionRate',
  terms: 'terms',
  notes: 'notes',
  description: 'description',
  companyId: 'companyId',
  isActive: 'isActive',
  accountId: 'accountId',
  contactId: 'contactId',
  salesOrderId: 'salesOrderId',
  quoteId: 'quoteId',
  billingStreet: 'billingStreet',
  billingCity: 'billingCity',
  billingState: 'billingState',
  billingCountry: 'billingCountry',
  billingPostalCode: 'billingPostalCode',
  billingPoBox: 'billingPoBox',
  shippingStreet: 'shippingStreet',
  shippingCity: 'shippingCity',
  shippingState: 'shippingState',
  shippingCountry: 'shippingCountry',
  shippingPostalCode: 'shippingPostalCode',
  shippingPoBox: 'shippingPoBox',
  assignedTo: 'assignedTo',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  paymentTerms: 'paymentTerms',
  lateFeePercent: 'lateFeePercent',
  discountDays: 'discountDays',
  reminderSentAt: 'reminderSentAt',
  lastReminderAt: 'lastReminderAt',
  collectionStatus: 'collectionStatus'
};

exports.Prisma.InvoiceLineItemScalarFieldEnum = {
  id: 'id',
  invoiceId: 'invoiceId',
  productId: 'productId',
  serviceId: 'serviceId',
  itemName: 'itemName',
  qty: 'qty',
  listPrice: 'listPrice',
  unitPrice: 'unitPrice',
  discount: 'discount',
  discountPercent: 'discountPercent',
  tax: 'tax',
  taxPercent: 'taxPercent',
  netPrice: 'netPrice',
  lineTotal: 'lineTotal',
  sequence: 'sequence',
  description: 'description',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TicketScalarFieldEnum = {
  id: 'id',
  ticketNo: 'ticketNo',
  title: 'title',
  description: 'description',
  solution: 'solution',
  updateLog: 'updateLog',
  status: 'status',
  priority: 'priority',
  severity: 'severity',
  category: 'category',
  hours: 'hours',
  days: 'days',
  fromMail: 'fromMail',
  versionId: 'versionId',
  companyId: 'companyId',
  isActive: 'isActive',
  contactId: 'contactId',
  accountId: 'accountId',
  productId: 'productId',
  serviceContractId: 'serviceContractId',
  assignedTo: 'assignedTo',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  slaDeadline: 'slaDeadline',
  firstResponseAt: 'firstResponseAt',
  resolutionTime: 'resolutionTime',
  escalationLevel: 'escalationLevel',
  parentTicketId: 'parentTicketId',
  satisfactionRating: 'satisfactionRating',
  satisfactionComment: 'satisfactionComment',
  autoAssigned: 'autoAssigned',
  tags: 'tags'
};

exports.Prisma.FaqScalarFieldEnum = {
  id: 'id',
  faqNo: 'faqNo',
  title: 'title',
  description: 'description',
  answer: 'answer',
  category: 'category',
  status: 'status',
  companyId: 'companyId',
  isActive: 'isActive',
  assignedTo: 'assignedTo',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DocumentScalarFieldEnum = {
  id: 'id',
  documentNo: 'documentNo',
  title: 'title',
  fileName: 'fileName',
  fileType: 'fileType',
  fileSize: 'fileSize',
  filePath: 'filePath',
  fileLocationType: 'fileLocationType',
  fileDownloadCount: 'fileDownloadCount',
  fileStatus: 'fileStatus',
  fileVersion: 'fileVersion',
  noteContent: 'noteContent',
  folderId: 'folderId',
  parentModule: 'parentModule',
  parentId: 'parentId',
  companyId: 'companyId',
  isActive: 'isActive',
  assignedTo: 'assignedTo',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.EmailScalarFieldEnum = {
  id: 'id',
  dateSent: 'dateSent',
  subject: 'subject',
  body: 'body',
  fromEmail: 'fromEmail',
  toEmails: 'toEmails',
  ccEmails: 'ccEmails',
  bccEmails: 'bccEmails',
  emailFlag: 'emailFlag',
  mailboxId: 'mailboxId',
  isRead: 'isRead',
  messageId: 'messageId',
  parentId: 'parentId',
  parentModule: 'parentModule',
  attachments: 'attachments',
  companyId: 'companyId',
  isActive: 'isActive',
  assignedTo: 'assignedTo',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.EmailTemplateScalarFieldEnum = {
  id: 'id',
  templateNo: 'templateNo',
  templateName: 'templateName',
  subject: 'subject',
  body: 'body',
  module: 'module',
  folderName: 'folderName',
  companyId: 'companyId',
  isActive: 'isActive',
  assignedTo: 'assignedTo',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ProjectScalarFieldEnum = {
  id: 'id',
  projectNo: 'projectNo',
  projectName: 'projectName',
  projectType: 'projectType',
  description: 'description',
  status: 'status',
  priority: 'priority',
  progress: 'progress',
  startDate: 'startDate',
  endDate: 'endDate',
  actualEndDate: 'actualEndDate',
  targetBudget: 'targetBudget',
  actualBudget: 'actualBudget',
  url: 'url',
  companyId: 'companyId',
  isActive: 'isActive',
  contactId: 'contactId',
  accountId: 'accountId',
  assignedTo: 'assignedTo',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  estimatedHours: 'estimatedHours',
  actualHours: 'actualHours',
  budgetType: 'budgetType',
  billingRate: 'billingRate',
  resourceCount: 'resourceCount',
  healthStatus: 'healthStatus',
  department: 'department',
  tags: 'tags'
};

exports.Prisma.ProjectTaskScalarFieldEnum = {
  id: 'id',
  projectTaskNo: 'projectTaskNo',
  title: 'title',
  description: 'description',
  status: 'status',
  priority: 'priority',
  projectTaskType: 'projectTaskType',
  progress: 'progress',
  startDate: 'startDate',
  endDate: 'endDate',
  hours: 'hours',
  companyId: 'companyId',
  isActive: 'isActive',
  projectId: 'projectId',
  milestoneId: 'milestoneId',
  assignedTo: 'assignedTo',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  estimatedHours: 'estimatedHours',
  loggedHours: 'loggedHours',
  completedAt: 'completedAt',
  blockedBy: 'blockedBy',
  tags: 'tags'
};

exports.Prisma.ProjectMilestoneScalarFieldEnum = {
  id: 'id',
  milestoneNo: 'milestoneNo',
  title: 'title',
  description: 'description',
  status: 'status',
  progress: 'progress',
  milestoneDate: 'milestoneDate',
  milestoneType: 'milestoneType',
  plannedHours: 'plannedHours',
  actualHours: 'actualHours',
  sequence: 'sequence',
  startDate: 'startDate',
  endDate: 'endDate',
  companyId: 'companyId',
  isActive: 'isActive',
  projectId: 'projectId',
  assignedTo: 'assignedTo',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AssetScalarFieldEnum = {
  id: 'id',
  assetNo: 'assetNo',
  assetName: 'assetName',
  serialNo: 'serialNo',
  tagNumber: 'tagNumber',
  datesInService: 'datesInService',
  dateOutOfService: 'dateOutOfService',
  dateSold: 'dateSold',
  status: 'status',
  shippingMethod: 'shippingMethod',
  shippingTrackingNumber: 'shippingTrackingNumber',
  description: 'description',
  companyId: 'companyId',
  isActive: 'isActive',
  accountId: 'accountId',
  contactId: 'contactId',
  productId: 'productId',
  invoiceId: 'invoiceId',
  serviceContractId: 'serviceContractId',
  assignedTo: 'assignedTo',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  purchaseDate: 'purchaseDate',
  purchasePrice: 'purchasePrice',
  warrantyEndDate: 'warrantyEndDate',
  warrantyType: 'warrantyType',
  condition: 'condition',
  location: 'location',
  department: 'department',
  lastMaintenanceDate: 'lastMaintenanceDate',
  nextMaintenanceDate: 'nextMaintenanceDate',
  vendorId: 'vendorId',
  costCenter: 'costCenter',
  depreciationMethod: 'depreciationMethod',
  salvageValue: 'salvageValue'
};

exports.Prisma.ServiceContractScalarFieldEnum = {
  id: 'id',
  contractNo: 'contractNo',
  contractName: 'contractName',
  contractType: 'contractType',
  status: 'status',
  priority: 'priority',
  startDate: 'startDate',
  endDate: 'endDate',
  dueDate: 'dueDate',
  renewalDate: 'renewalDate',
  progress: 'progress',
  trackingUnit: 'trackingUnit',
  totalUnits: 'totalUnits',
  usedUnits: 'usedUnits',
  unitPrice: 'unitPrice',
  costPrice: 'costPrice',
  currency: 'currency',
  relatedTo: 'relatedTo',
  relatedModule: 'relatedModule',
  description: 'description',
  companyId: 'companyId',
  isActive: 'isActive',
  accountId: 'accountId',
  contactId: 'contactId',
  assignedTo: 'assignedTo',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SmsNotifierScalarFieldEnum = {
  id: 'id',
  fromNumber: 'fromNumber',
  toNumber: 'toNumber',
  message: 'message',
  status: 'status',
  companyId: 'companyId',
  isActive: 'isActive',
  assignedTo: 'assignedTo',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CommentScalarFieldEnum = {
  id: 'id',
  moduleName: 'moduleName',
  recordId: 'recordId',
  comment: 'comment',
  userId: 'userId',
  isPrivate: 'isPrivate',
  companyId: 'companyId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TagScalarFieldEnum = {
  id: 'id',
  name: 'name',
  color: 'color',
  isPrivate: 'isPrivate',
  parentTagId: 'parentTagId',
  module: 'module',
  recordId: 'recordId',
  userId: 'userId',
  companyId: 'companyId',
  createdAt: 'createdAt'
};

exports.Prisma.AttachmentScalarFieldEnum = {
  id: 'id',
  fileName: 'fileName',
  filePath: 'filePath',
  fileType: 'fileType',
  fileSize: 'fileSize',
  moduleName: 'moduleName',
  recordId: 'recordId',
  userId: 'userId',
  companyId: 'companyId',
  createdAt: 'createdAt'
};

exports.Prisma.AuditLogScalarFieldEnum = {
  id: 'id',
  moduleName: 'moduleName',
  recordId: 'recordId',
  action: 'action',
  fieldName: 'fieldName',
  oldValue: 'oldValue',
  newValue: 'newValue',
  userId: 'userId',
  ipAddress: 'ipAddress',
  companyId: 'companyId',
  createdAt: 'createdAt'
};

exports.Prisma.RelatedListScalarFieldEnum = {
  id: 'id',
  moduleName: 'moduleName',
  relatedModule: 'relatedModule',
  label: 'label',
  sequence: 'sequence',
  isActive: 'isActive',
  companyId: 'companyId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CurrencyInfoScalarFieldEnum = {
  id: 'id',
  currencyId: 'currencyId',
  relatedId: 'relatedId',
  relatedModule: 'relatedModule',
  conversionRate: 'conversionRate',
  createdAt: 'createdAt'
};

exports.Prisma.TaxInfoScalarFieldEnum = {
  id: 'id',
  taxName: 'taxName',
  taxRate: 'taxRate',
  isDefault: 'isDefault',
  isActive: 'isActive',
  companyId: 'companyId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ChatConversationScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  createdById: 'createdById',
  type: 'type',
  name: 'name',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  lastMessageAt: 'lastMessageAt'
};

exports.Prisma.ChatParticipantScalarFieldEnum = {
  id: 'id',
  conversationId: 'conversationId',
  userId: 'userId',
  unreadCount: 'unreadCount',
  lastReadAt: 'lastReadAt',
  joinedAt: 'joinedAt'
};

exports.Prisma.ChatMessageScalarFieldEnum = {
  id: 'id',
  conversationId: 'conversationId',
  senderId: 'senderId',
  body: 'body',
  attachments: 'attachments',
  createdAt: 'createdAt'
};

exports.Prisma.SupportConversationScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  createdByUserId: 'createdByUserId',
  assignedAgentId: 'assignedAgentId',
  departmentId: 'departmentId',
  status: 'status',
  priority: 'priority',
  subject: 'subject',
  channel: 'channel',
  aiEnabled: 'aiEnabled',
  humanRequested: 'humanRequested',
  customerLastReadAt: 'customerLastReadAt',
  agentLastReadAt: 'agentLastReadAt',
  firstAgentResponseAt: 'firstAgentResponseAt',
  lastMessageAt: 'lastMessageAt',
  resolvedAt: 'resolvedAt',
  closedAt: 'closedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SupportMessageScalarFieldEnum = {
  id: 'id',
  conversationId: 'conversationId',
  senderType: 'senderType',
  senderId: 'senderId',
  messageType: 'messageType',
  content: 'content',
  metadata: 'metadata',
  clientMessageId: 'clientMessageId',
  createdAt: 'createdAt'
};

exports.Prisma.SupportAuditEventScalarFieldEnum = {
  id: 'id',
  conversationId: 'conversationId',
  companyId: 'companyId',
  actorUserId: 'actorUserId',
  action: 'action',
  metadata: 'metadata',
  createdAt: 'createdAt'
};

exports.Prisma.CompanyScalarFieldEnum = {
  id: 'id',
  name: 'name',
  email: 'email',
  phone: 'phone',
  website: 'website',
  addressStreet: 'addressStreet',
  addressCity: 'addressCity',
  addressState: 'addressState',
  addressCountry: 'addressCountry',
  addressPostalCode: 'addressPostalCode',
  taxId: 'taxId',
  logo: 'logo',
  defaultCurrency: 'defaultCurrency',
  timezone: 'timezone',
  dateFormat: 'dateFormat',
  facebook: 'facebook',
  twitter: 'twitter',
  linkedin: 'linkedin',
  instagram: 'instagram',
  youtube: 'youtube',
  isActive: 'isActive',
  subscriptionPlan: 'subscriptionPlan',
  subscriptionModelId: 'subscriptionModelId',
  subscriptionStatus: 'subscriptionStatus',
  userLimit: 'userLimit',
  contactLimit: 'contactLimit',
  trialStartsAt: 'trialStartsAt',
  trialEndsAt: 'trialEndsAt',
  subscriptionStartsAt: 'subscriptionStartsAt',
  subscriptionEndsAt: 'subscriptionEndsAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SubscriptionModelScalarFieldEnum = {
  id: 'id',
  code: 'code',
  name: 'name',
  description: 'description',
  price: 'price',
  billingCycle: 'billingCycle',
  userLimit: 'userLimit',
  contactLimit: 'contactLimit',
  features: 'features',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.LoginLogScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  email: 'email',
  userName: 'userName',
  ipAddress: 'ipAddress',
  publicIp: 'publicIp',
  userAgent: 'userAgent',
  status: 'status',
  companyId: 'companyId',
  createdAt: 'createdAt'
};

exports.Prisma.PendingRegistrationScalarFieldEnum = {
  id: 'id',
  email: 'email',
  payload: 'payload',
  codeHash: 'codeHash',
  expiresAt: 'expiresAt',
  attempts: 'attempts',
  createdAt: 'createdAt'
};

exports.Prisma.SequenceNumberScalarFieldEnum = {
  id: 'id',
  moduleName: 'moduleName',
  prefix: 'prefix',
  suffix: 'suffix',
  currentNo: 'currentNo',
  digitWidth: 'digitWidth',
  companyId: 'companyId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.OrgSettingScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  key: 'key',
  value: 'value',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.GlobalSettingScalarFieldEnum = {
  id: 'id',
  key: 'key',
  value: 'value',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CustomFieldScalarFieldEnum = {
  id: 'id',
  moduleName: 'moduleName',
  label: 'label',
  fieldName: 'fieldName',
  type: 'type',
  options: 'options',
  isRequired: 'isRequired',
  isActive: 'isActive',
  sequence: 'sequence',
  companyId: 'companyId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CustomFieldValueScalarFieldEnum = {
  id: 'id',
  moduleName: 'moduleName',
  recordId: 'recordId',
  companyId: 'companyId',
  values: 'values',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PicklistOptionScalarFieldEnum = {
  id: 'id',
  moduleName: 'moduleName',
  fieldName: 'fieldName',
  label: 'label',
  sequence: 'sequence',
  isActive: 'isActive',
  companyId: 'companyId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SharingRuleScalarFieldEnum = {
  id: 'id',
  moduleName: 'moduleName',
  accessType: 'accessType',
  roleIds: 'roleIds',
  companyId: 'companyId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PermissionProfileScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  isActive: 'isActive',
  companyId: 'companyId',
  roleIds: 'roleIds',
  permissions: 'permissions',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.WorkflowScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  moduleName: 'moduleName',
  triggerType: 'triggerType',
  conditions: 'conditions',
  actions: 'actions',
  isActive: 'isActive',
  runCount: 'runCount',
  lastRunAt: 'lastRunAt',
  lastError: 'lastError',
  companyId: 'companyId',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ScheduledTaskScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  moduleName: 'moduleName',
  frequency: 'frequency',
  actions: 'actions',
  isActive: 'isActive',
  lastRun: 'lastRun',
  nextRun: 'nextRun',
  lastError: 'lastError',
  runCount: 'runCount',
  companyId: 'companyId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.WebformScalarFieldEnum = {
  id: 'id',
  name: 'name',
  moduleName: 'moduleName',
  fields: 'fields',
  successMessage: 'successMessage',
  redirectUrl: 'redirectUrl',
  isActive: 'isActive',
  token: 'token',
  companyId: 'companyId',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.NotificationScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  title: 'title',
  message: 'message',
  link: 'link',
  isRead: 'isRead',
  companyId: 'companyId',
  createdAt: 'createdAt'
};

exports.Prisma.AnnouncementScalarFieldEnum = {
  id: 'id',
  title: 'title',
  message: 'message',
  startsAt: 'startsAt',
  expiresAt: 'expiresAt',
  isActive: 'isActive',
  companyId: 'companyId',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.HolidayScalarFieldEnum = {
  id: 'id',
  title: 'title',
  date: 'date',
  description: 'description',
  companyId: 'companyId',
  createdAt: 'createdAt'
};

exports.Prisma.ActivityScalarFieldEnum = {
  id: 'id',
  subject: 'subject',
  description: 'description',
  activityType: 'activityType',
  status: 'status',
  priority: 'priority',
  location: 'location',
  startAt: 'startAt',
  endAt: 'endAt',
  dueAt: 'dueAt',
  reminderAt: 'reminderAt',
  reminderSentAt: 'reminderSentAt',
  parentModule: 'parentModule',
  parentId: 'parentId',
  recurrence: 'recurrence',
  shared: 'shared',
  googleEventId: 'googleEventId',
  companyId: 'companyId',
  isActive: 'isActive',
  assignedTo: 'assignedTo',
  assignedGroupId: 'assignedGroupId',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.FollowScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  moduleName: 'moduleName',
  recordId: 'recordId',
  companyId: 'companyId',
  createdAt: 'createdAt'
};

exports.Prisma.ReceiptScalarFieldEnum = {
  id: 'id',
  invoiceId: 'invoiceId',
  amount: 'amount',
  paymentDate: 'paymentDate',
  method: 'method',
  reference: 'reference',
  notes: 'notes',
  isActive: 'isActive',
  companyId: 'companyId',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PaymentScalarFieldEnum = {
  id: 'id',
  purchaseOrderId: 'purchaseOrderId',
  amount: 'amount',
  paymentDate: 'paymentDate',
  method: 'method',
  reference: 'reference',
  notes: 'notes',
  isActive: 'isActive',
  companyId: 'companyId',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RecurringInvoiceScalarFieldEnum = {
  id: 'id',
  invoiceId: 'invoiceId',
  frequency: 'frequency',
  interval: 'interval',
  dayOfMonth: 'dayOfMonth',
  startDate: 'startDate',
  endDate: 'endDate',
  nextRun: 'nextRun',
  lastRun: 'lastRun',
  isActive: 'isActive',
  companyId: 'companyId',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PortalUserScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  contactId: 'contactId',
  email: 'email',
  password: 'password',
  name: 'name',
  company: 'company',
  phone: 'phone',
  isActive: 'isActive',
  lastLogin: 'lastLogin',
  companyId: 'companyId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AiPromptScalarFieldEnum = {
  id: 'id',
  name: 'name',
  prompt: 'prompt',
  module: 'module',
  isActive: 'isActive',
  companyId: 'companyId',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AiLogScalarFieldEnum = {
  id: 'id',
  promptId: 'promptId',
  moduleName: 'moduleName',
  recordId: 'recordId',
  input: 'input',
  output: 'output',
  model: 'model',
  tokens: 'tokens',
  duration: 'duration',
  companyId: 'companyId',
  userId: 'userId',
  createdAt: 'createdAt'
};

exports.Prisma.TranslationScalarFieldEnum = {
  id: 'id',
  locale: 'locale',
  key: 'key',
  value: 'value',
  namespace: 'namespace',
  companyId: 'companyId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MailboxScalarFieldEnum = {
  id: 'id',
  name: 'name',
  host: 'host',
  port: 'port',
  secure: 'secure',
  user: 'user',
  pass: 'pass',
  folder: 'folder',
  lastSyncAt: 'lastSyncAt',
  isActive: 'isActive',
  companyId: 'companyId',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.EmailToTicketRuleScalarFieldEnum = {
  id: 'id',
  mailboxId: 'mailboxId',
  defaultStatus: 'defaultStatus',
  defaultPriority: 'defaultPriority',
  defaultAssignedTo: 'defaultAssignedTo',
  createContactIfMissing: 'createContactIfMissing',
  isActive: 'isActive',
  companyId: 'companyId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CallLogScalarFieldEnum = {
  id: 'id',
  sourceUuid: 'sourceUuid',
  direction: 'direction',
  fromNumber: 'fromNumber',
  toNumber: 'toNumber',
  callTime: 'callTime',
  startTime: 'startTime',
  endTime: 'endTime',
  duration: 'duration',
  totalDuration: 'totalDuration',
  billDuration: 'billDuration',
  status: 'status',
  recordingUrl: 'recordingUrl',
  customerNumber: 'customerNumber',
  customerType: 'customerType',
  customerId: 'customerId',
  notes: 'notes',
  relatedToModule: 'relatedToModule',
  relatedToId: 'relatedToId',
  companyId: 'companyId',
  isActive: 'isActive',
  assignedTo: 'assignedTo',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.GoogleAccountScalarFieldEnum = {
  id: 'id',
  email: 'email',
  accessToken: 'accessToken',
  refreshToken: 'refreshToken',
  scopes: 'scopes',
  lastSyncedAt: 'lastSyncedAt',
  syncCalendar: 'syncCalendar',
  syncContacts: 'syncContacts',
  isActive: 'isActive',
  companyId: 'companyId',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ReportScalarFieldEnum = {
  id: 'id',
  name: 'name',
  moduleName: 'moduleName',
  reportType: 'reportType',
  chartType: 'chartType',
  folder: 'folder',
  columns: 'columns',
  grouping: 'grouping',
  filters: 'filters',
  sort: 'sort',
  schedule: 'schedule',
  lastRunAt: 'lastRunAt',
  isActive: 'isActive',
  companyId: 'companyId',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RssFeedScalarFieldEnum = {
  id: 'id',
  name: 'name',
  url: 'url',
  category: 'category',
  lastFetchedAt: 'lastFetchedAt',
  isActive: 'isActive',
  companyId: 'companyId',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RssEntryScalarFieldEnum = {
  id: 'id',
  feedId: 'feedId',
  title: 'title',
  link: 'link',
  description: 'description',
  author: 'author',
  pubDate: 'pubDate',
  isRead: 'isRead',
  createdAt: 'createdAt'
};

exports.Prisma.ModuleLayoutScalarFieldEnum = {
  id: 'id',
  moduleName: 'moduleName',
  tabName: 'tabName',
  fieldOrder: 'fieldOrder',
  fieldVisibility: 'fieldVisibility',
  isActive: 'isActive',
  companyId: 'companyId',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PicklistDependencyScalarFieldEnum = {
  id: 'id',
  moduleName: 'moduleName',
  parentField: 'parentField',
  childField: 'childField',
  mappings: 'mappings',
  isActive: 'isActive',
  companyId: 'companyId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ApiKeyScalarFieldEnum = {
  id: 'id',
  name: 'name',
  keyPrefix: 'keyPrefix',
  keyHash: 'keyHash',
  scopes: 'scopes',
  expiresAt: 'expiresAt',
  lastUsedAt: 'lastUsedAt',
  isActive: 'isActive',
  companyId: 'companyId',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CompetitorScalarFieldEnum = {
  id: 'id',
  competitorName: 'competitorName',
  website: 'website',
  strengths: 'strengths',
  weaknesses: 'weaknesses',
  products: 'products',
  marketShare: 'marketShare',
  rating: 'rating',
  description: 'description',
  companyId: 'companyId',
  isActive: 'isActive',
  assignedTo: 'assignedTo',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PotentialCompetitorScalarFieldEnum = {
  id: 'id',
  potentialId: 'potentialId',
  competitorId: 'competitorId',
  threatLevel: 'threatLevel',
  notes: 'notes',
  companyId: 'companyId',
  createdAt: 'createdAt'
};

exports.Prisma.TimeEntryScalarFieldEnum = {
  id: 'id',
  projectId: 'projectId',
  taskId: 'taskId',
  userId: 'userId',
  date: 'date',
  hours: 'hours',
  description: 'description',
  billable: 'billable',
  approved: 'approved',
  approvedBy: 'approvedBy',
  companyId: 'companyId',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.StageProbabilityScalarFieldEnum = {
  id: 'id',
  stageName: 'stageName',
  probability: 'probability',
  sequence: 'sequence',
  color: 'color',
  isActive: 'isActive',
  companyId: 'companyId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.QuantityDiscountScalarFieldEnum = {
  id: 'id',
  productId: 'productId',
  minQty: 'minQty',
  maxQty: 'maxQty',
  discountPercent: 'discountPercent',
  companyId: 'companyId',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TicketCommentScalarFieldEnum = {
  id: 'id',
  ticketId: 'ticketId',
  userId: 'userId',
  comment: 'comment',
  isInternal: 'isInternal',
  isSystem: 'isSystem',
  timeSpent: 'timeSpent',
  companyId: 'companyId',
  createdAt: 'createdAt'
};

exports.Prisma.EscalationHistoryScalarFieldEnum = {
  id: 'id',
  ticketId: 'ticketId',
  fromLevel: 'fromLevel',
  toLevel: 'toLevel',
  reason: 'reason',
  escalatedBy: 'escalatedBy',
  companyId: 'companyId',
  createdAt: 'createdAt'
};

exports.Prisma.ProjectResourceScalarFieldEnum = {
  id: 'id',
  projectId: 'projectId',
  userId: 'userId',
  role: 'role',
  allocationPercent: 'allocationPercent',
  hourlyRate: 'hourlyRate',
  startDate: 'startDate',
  endDate: 'endDate',
  isActive: 'isActive',
  companyId: 'companyId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.WorkflowLogScalarFieldEnum = {
  id: 'id',
  workflowId: 'workflowId',
  workflowName: 'workflowName',
  moduleName: 'moduleName',
  recordId: 'recordId',
  triggerType: 'triggerType',
  conditionsMet: 'conditionsMet',
  actionsExecuted: 'actionsExecuted',
  error: 'error',
  duration: 'duration',
  companyId: 'companyId',
  createdAt: 'createdAt'
};

exports.Prisma.DashboardWidgetScalarFieldEnum = {
  id: 'id',
  widgetName: 'widgetName',
  widgetType: 'widgetType',
  moduleName: 'moduleName',
  config: 'config',
  position: 'position',
  size: 'size',
  isActive: 'isActive',
  companyId: 'companyId',
  userId: 'userId',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ReportScheduleScalarFieldEnum = {
  id: 'id',
  reportId: 'reportId',
  reportName: 'reportName',
  moduleName: 'moduleName',
  reportType: 'reportType',
  config: 'config',
  frequency: 'frequency',
  recipients: 'recipients',
  lastRun: 'lastRun',
  nextRun: 'nextRun',
  isActive: 'isActive',
  companyId: 'companyId',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ScorecardScalarFieldEnum = {
  id: 'id',
  name: 'name',
  moduleName: 'moduleName',
  metrics: 'metrics',
  period: 'period',
  target: 'target',
  actual: 'actual',
  status: 'status',
  companyId: 'companyId',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.EmailCampaignScalarFieldEnum = {
  id: 'id',
  campaignName: 'campaignName',
  subject: 'subject',
  body: 'body',
  plainBody: 'plainBody',
  fromEmail: 'fromEmail',
  fromName: 'fromName',
  replyTo: 'replyTo',
  status: 'status',
  scheduledAt: 'scheduledAt',
  sentAt: 'sentAt',
  recipientCount: 'recipientCount',
  openCount: 'openCount',
  clickCount: 'clickCount',
  bounceCount: 'bounceCount',
  unsubscribeCount: 'unsubscribeCount',
  recipientType: 'recipientType',
  recipientFilter: 'recipientFilter',
  templateId: 'templateId',
  companyId: 'companyId',
  isActive: 'isActive',
  assignedTo: 'assignedTo',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.EmailCampaignRecipientScalarFieldEnum = {
  id: 'id',
  campaignId: 'campaignId',
  email: 'email',
  contactId: 'contactId',
  name: 'name',
  status: 'status',
  sentAt: 'sentAt',
  openedAt: 'openedAt',
  clickedAt: 'clickedAt',
  bouncedAt: 'bouncedAt',
  bounceReason: 'bounceReason',
  unsubscribedAt: 'unsubscribedAt',
  companyId: 'companyId',
  createdAt: 'createdAt'
};

exports.Prisma.SmsTemplateScalarFieldEnum = {
  id: 'id',
  name: 'name',
  body: 'body',
  module: 'module',
  variables: 'variables',
  isActive: 'isActive',
  companyId: 'companyId',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ChatWidgetScalarFieldEnum = {
  id: 'id',
  name: 'name',
  color: 'color',
  welcomeMsg: 'welcomeMsg',
  offlineMsg: 'offlineMsg',
  position: 'position',
  isActive: 'isActive',
  companyId: 'companyId',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ChatSessionScalarFieldEnum = {
  id: 'id',
  widgetId: 'widgetId',
  visitorToken: 'visitorToken',
  visitorName: 'visitorName',
  visitorEmail: 'visitorEmail',
  visitorIp: 'visitorIp',
  userAgent: 'userAgent',
  status: 'status',
  assignedTo: 'assignedTo',
  startedAt: 'startedAt',
  endedAt: 'endedAt',
  companyId: 'companyId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ChatSessionMessageScalarFieldEnum = {
  id: 'id',
  sessionId: 'sessionId',
  senderType: 'senderType',
  senderId: 'senderId',
  body: 'body',
  createdAt: 'createdAt'
};

exports.Prisma.LandingPageScalarFieldEnum = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  title: 'title',
  subtitle: 'subtitle',
  description: 'description',
  content: 'content',
  formConfig: 'formConfig',
  theme: 'theme',
  primaryColor: 'primaryColor',
  imageUrl: 'imageUrl',
  faviconUrl: 'faviconUrl',
  metaTitle: 'metaTitle',
  metaDescription: 'metaDescription',
  thankYouMsg: 'thankYouMsg',
  redirectUrl: 'redirectUrl',
  submitAction: 'submitAction',
  isActive: 'isActive',
  isPublished: 'isPublished',
  viewCount: 'viewCount',
  submitCount: 'submitCount',
  campaignId: 'campaignId',
  companyId: 'companyId',
  assignedTo: 'assignedTo',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.LandingPageSubmissionScalarFieldEnum = {
  id: 'id',
  pageId: 'pageId',
  formData: 'formData',
  contactId: 'contactId',
  leadId: 'leadId',
  ipAddress: 'ipAddress',
  userAgent: 'userAgent',
  referrer: 'referrer',
  utmSource: 'utmSource',
  utmMedium: 'utmMedium',
  utmCampaign: 'utmCampaign',
  companyId: 'companyId',
  createdAt: 'createdAt'
};

exports.Prisma.SocialMediaProfileScalarFieldEnum = {
  id: 'id',
  platform: 'platform',
  profileId: 'profileId',
  profileName: 'profileName',
  profileUrl: 'profileUrl',
  accessToken: 'accessToken',
  refreshToken: 'refreshToken',
  tokenExpiresAt: 'tokenExpiresAt',
  isActive: 'isActive',
  companyId: 'companyId',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SocialMediaPostScalarFieldEnum = {
  id: 'id',
  profileId: 'profileId',
  content: 'content',
  mediaUrls: 'mediaUrls',
  platformPostId: 'platformPostId',
  status: 'status',
  scheduledAt: 'scheduledAt',
  publishedAt: 'publishedAt',
  likes: 'likes',
  comments: 'comments',
  shares: 'shares',
  reach: 'reach',
  impressions: 'impressions',
  campaignId: 'campaignId',
  companyId: 'companyId',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.WebhookEndpointScalarFieldEnum = {
  id: 'id',
  name: 'name',
  url: 'url',
  secret: 'secret',
  events: 'events',
  headers: 'headers',
  isActive: 'isActive',
  lastTriggeredAt: 'lastTriggeredAt',
  failureCount: 'failureCount',
  companyId: 'companyId',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.WebhookLogScalarFieldEnum = {
  id: 'id',
  endpointId: 'endpointId',
  event: 'event',
  payload: 'payload',
  responseStatus: 'responseStatus',
  responseBody: 'responseBody',
  duration: 'duration',
  success: 'success',
  error: 'error',
  companyId: 'companyId',
  createdAt: 'createdAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};
exports.SupportConversationStatus = exports.$Enums.SupportConversationStatus = {
  AI_ACTIVE: 'AI_ACTIVE',
  WAITING_FOR_AGENT: 'WAITING_FOR_AGENT',
  AGENT_ASSIGNED: 'AGENT_ASSIGNED',
  AGENT_ACTIVE: 'AGENT_ACTIVE',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED'
};

exports.SupportPriority = exports.$Enums.SupportPriority = {
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  URGENT: 'URGENT'
};

exports.SupportSenderType = exports.$Enums.SupportSenderType = {
  CUSTOMER: 'CUSTOMER',
  AI: 'AI',
  AGENT: 'AGENT',
  SYSTEM: 'SYSTEM'
};

exports.SupportMessageType = exports.$Enums.SupportMessageType = {
  TEXT: 'TEXT',
  SYSTEM: 'SYSTEM',
  FILE: 'FILE',
  IMAGE: 'IMAGE'
};

exports.Prisma.ModelName = {
  User: 'User',
  Role: 'Role',
  RolePermission: 'RolePermission',
  UserGroup: 'UserGroup',
  UserGroupMember: 'UserGroupMember',
  UserProfile: 'UserProfile',
  Module: 'Module',
  Currency: 'Currency',
  CustomView: 'CustomView',
  Account: 'Account',
  Contact: 'Contact',
  Lead: 'Lead',
  Potential: 'Potential',
  PotentialProduct: 'PotentialProduct',
  PotentialStageHistory: 'PotentialStageHistory',
  Campaign: 'Campaign',
  Product: 'Product',
  ProductImage: 'ProductImage',
  LeadProduct: 'LeadProduct',
  LeadService: 'LeadService',
  Service: 'Service',
  Vendor: 'Vendor',
  PriceBook: 'PriceBook',
  PriceBookProduct: 'PriceBookProduct',
  Quote: 'Quote',
  QuoteLineItem: 'QuoteLineItem',
  QuoteStageHistory: 'QuoteStageHistory',
  SalesOrder: 'SalesOrder',
  SalesOrderLineItem: 'SalesOrderLineItem',
  PurchaseOrder: 'PurchaseOrder',
  PurchaseOrderLineItem: 'PurchaseOrderLineItem',
  Invoice: 'Invoice',
  InvoiceLineItem: 'InvoiceLineItem',
  Ticket: 'Ticket',
  Faq: 'Faq',
  Document: 'Document',
  Email: 'Email',
  EmailTemplate: 'EmailTemplate',
  Project: 'Project',
  ProjectTask: 'ProjectTask',
  ProjectMilestone: 'ProjectMilestone',
  Asset: 'Asset',
  ServiceContract: 'ServiceContract',
  SmsNotifier: 'SmsNotifier',
  Comment: 'Comment',
  Tag: 'Tag',
  Attachment: 'Attachment',
  AuditLog: 'AuditLog',
  RelatedList: 'RelatedList',
  CurrencyInfo: 'CurrencyInfo',
  TaxInfo: 'TaxInfo',
  ChatConversation: 'ChatConversation',
  ChatParticipant: 'ChatParticipant',
  ChatMessage: 'ChatMessage',
  SupportConversation: 'SupportConversation',
  SupportMessage: 'SupportMessage',
  SupportAuditEvent: 'SupportAuditEvent',
  Company: 'Company',
  SubscriptionModel: 'SubscriptionModel',
  LoginLog: 'LoginLog',
  PendingRegistration: 'PendingRegistration',
  SequenceNumber: 'SequenceNumber',
  OrgSetting: 'OrgSetting',
  GlobalSetting: 'GlobalSetting',
  CustomField: 'CustomField',
  CustomFieldValue: 'CustomFieldValue',
  PicklistOption: 'PicklistOption',
  SharingRule: 'SharingRule',
  PermissionProfile: 'PermissionProfile',
  Workflow: 'Workflow',
  ScheduledTask: 'ScheduledTask',
  Webform: 'Webform',
  Notification: 'Notification',
  Announcement: 'Announcement',
  Holiday: 'Holiday',
  Activity: 'Activity',
  Follow: 'Follow',
  Receipt: 'Receipt',
  Payment: 'Payment',
  RecurringInvoice: 'RecurringInvoice',
  PortalUser: 'PortalUser',
  AiPrompt: 'AiPrompt',
  AiLog: 'AiLog',
  Translation: 'Translation',
  Mailbox: 'Mailbox',
  EmailToTicketRule: 'EmailToTicketRule',
  CallLog: 'CallLog',
  GoogleAccount: 'GoogleAccount',
  Report: 'Report',
  RssFeed: 'RssFeed',
  RssEntry: 'RssEntry',
  ModuleLayout: 'ModuleLayout',
  PicklistDependency: 'PicklistDependency',
  ApiKey: 'ApiKey',
  Competitor: 'Competitor',
  PotentialCompetitor: 'PotentialCompetitor',
  TimeEntry: 'TimeEntry',
  StageProbability: 'StageProbability',
  QuantityDiscount: 'QuantityDiscount',
  TicketComment: 'TicketComment',
  EscalationHistory: 'EscalationHistory',
  ProjectResource: 'ProjectResource',
  WorkflowLog: 'WorkflowLog',
  DashboardWidget: 'DashboardWidget',
  ReportSchedule: 'ReportSchedule',
  Scorecard: 'Scorecard',
  EmailCampaign: 'EmailCampaign',
  EmailCampaignRecipient: 'EmailCampaignRecipient',
  SmsTemplate: 'SmsTemplate',
  ChatWidget: 'ChatWidget',
  ChatSession: 'ChatSession',
  ChatSessionMessage: 'ChatSessionMessage',
  LandingPage: 'LandingPage',
  LandingPageSubmission: 'LandingPageSubmission',
  SocialMediaProfile: 'SocialMediaProfile',
  SocialMediaPost: 'SocialMediaPost',
  WebhookEndpoint: 'WebhookEndpoint',
  WebhookLog: 'WebhookLog'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
