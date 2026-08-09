# bizforce-crm vs vtiger 8.4.0 — Full Feature & Field Comparison Report

_Generated from source inspection of ~/crm (bizforce-crm) and ~/vtiger (vtigercrm 8.4.0) on 192.168.2.229_

## A. Module Coverage

| Module | bizforce-crm | vtiger | Status |
|---|---|---|---|
| Dashboard / Home | Yes | Yes | Same |
| Accounts | Yes | Yes | Same |
| Contacts | Yes | Yes | Same |
| Leads | Yes | Yes | Same |
| Opportunities (Potentials) | Yes | Yes | CRM adds Forecast page |
| Campaigns | Yes | Yes | Same |
| Products | Yes | Yes | Same |
| Services | Yes | Yes | Same |
| Vendors | Yes | Yes | Same |
| Price Books | Yes | Yes | Same |
| Quotes | Yes | Yes | Same |
| Sales Orders | Yes | Yes | Same |
| Purchase Orders | Yes | Yes | Same |
| Invoices | Yes | Yes | CRM adds Payments |
| Recurring Invoices | Yes | Yes | New in CRM |
| Tickets (HelpDesk) | Yes | Yes | Same |
| FAQ | Yes | Yes | Same |
| Assets | Yes | Yes | Same |
| Service Contracts | Yes | Yes | Same |
| Projects / Tasks / Milestones | Yes | Yes | Same |
| Documents | Yes | Yes | Same |
| Emails | Yes | Yes | Same |
| Email Templates | Yes | Yes | Same |
| Mailboxes (MailManager) | Yes | Yes | New in CRM |
| Phone Calls (PBX) | Yes | Yes | New in CRM |
| SMS Notifier | Yes | Yes | Same |
| Reports | Yes | Yes | New in CRM |
| RSS | Yes | Yes | New in CRM |
| Recycle Bin | Yes | Yes | New in CRM |
| Webforms | Yes | Yes | Same |
| Customer Portal | Yes | Yes | New in CRM |
| Google sync | Yes | Yes | New in CRM |
| REST API + API keys | Yes | Yes | New in CRM |
| Layout editor | Yes | Yes | New in CRM |
| Picklist dependency | Yes | Yes | New in CRM |
| Record comments (ModComments) | Yes | Yes | Same |
| Calendar / Events | Yes | Yes | CRM adds shared + recurring |
| Users | Yes | Yes | Same |
| Merge / Duplicate handling | **No** | Yes | **MISSING** |
| Mobile app | **No** | Yes | **MISSING** |
| Extension Store / Marketplace | **No** | Yes | **MISSING** |
| Tags UI | **No (model only)** | Yes | **MISSING** |
| Menu editor | **No** | Yes | **MISSING** |
| Multi-language packs | **No (i18n scaffold, EN only)** | Yes (15+) | **MISSING** |

## B. Feature Comparison

| Feature | bizforce-crm | vtiger |
|---|---|---|
| Lead conversion | Yes | Yes |
| Opportunity forecasting | Yes | Yes |
| Merge records / duplicate detection | **No** | Yes |
| Recurring invoices | Yes | Yes |
| Invoice payment tracking | Yes | Yes |
| Product images | Yes | Yes |
| Product commission | Partial (fields + SO-level) | Yes (per-item) |
| Pricing formula / tax class | Partial (compute-price endpoint) | Yes (full formulas) |
| Stock/reorder management | Partial (fields only, no alerts) | Yes |
| Email inbox (IMAP client) | Yes (Mailboxes) | Yes (MailManager) |
| Email -> ticket converter | Yes (EmailToTicketRule) | Yes (MailConverter) |
| Customer portal | Yes (tickets/invoices) | Yes (full) |
| PBX / click-to-call | Yes (CallLog) | Yes (PBXManager) |
| Google OAuth sync | Yes | Yes |
| Ad-hoc report builder | Partial (tabular/summary, client-side) | Yes (tabular/summary/matrix/chart) |
| Recurring + shared calendar | Yes | Yes |
| Dedicated recycle bin | Yes | Yes |
| Webforms | Yes | Yes |
| Mobile app | **No** | Yes |
| Extension/marketplace | **No** | Yes |
| Multi-language | **No** | Yes |
| External REST API | Yes (/rest/* + API keys) | Yes (webservice.php) |
| Layout editor (field order/visibility) | Yes | Yes |
| Picklist dependency | Yes | Yes |
| 2FA | Yes | No |
| Multi-tenant SaaS (super-admin, orgs) | Yes | No |
| Automated backups | Yes | No |
| Notification center + announcements | Yes | No |
| Kanban board | Yes | No |
| Personalizable dashboard | Yes | No |
| PDF quote/invoice/order documents | Yes | Yes |
| Sales stage history (Potentials) | **No** | Yes |
| Lead conversion mapping UI | **No** | Yes |
| Tags UI | **No** | Yes |
| Menu editor | **No** | Yes |

## C. Field-Level Comparison (key modules)

### Accounts
| Field | bizforce-crm | vtiger |
|---|---|---|
| Account No / Name / Parent | Yes | Yes |
| Website / Email / Email2 / Phone / Fax | Yes | Yes |
| Employees / Annual Revenue / Industry | Yes | Yes |
| Type / Ownership / Rating / SIC / Ticker | Yes | Yes |
| Billing + Shipping addresses (full) | Yes | Yes |
| Notify Owner / Email Opt-out / Description | Yes | Yes |
| Portal flag | **No** | Yes |
| GL Account | Partial | Yes |

### Contacts
| Field | bizforce-crm | vtiger |
|---|---|---|
| Contact No / Salutation / Name / Title / Dept | Yes | Yes |
| All phones / emails / fax / assistant | Yes | Yes |
| Reports To / DOB / Lead Source / Do Not Call | Yes | Yes |
| Portal access | Yes (flag) | Yes |
| Support Start/End | Yes | Yes |
| Mailing + Other addresses | Yes | Yes |
| Google Contact ID | Yes | Yes |

### Leads
| Field | bizforce-crm | vtiger |
|---|---|---|
| All identity/contact fields | Yes | Yes |
| Source / Status / Industry / Revenue / Employees | Yes | Yes |
| Rating / Interest / Opt-out | Yes | Yes |
| Conversion + converted refs | Yes | Yes |
| Campaign link / line products+services | Yes | Yes |

### Opportunities (Potentials)
| Field | bizforce-crm | vtiger |
|---|---|---|
| No / Name / Amount / Closing / Type / Stage / Probability | Yes | Yes |
| Next Step / Lead Source / Campaign / Account / Contact | Yes | Yes |
| Forecast Amount / Category / Outcome Analysis | Yes | Yes |
| Multiple products | Partial (single productId) | Yes |
| Sales stage history | **No** | Yes |

### Products
| Field | bizforce-crm | vtiger |
|---|---|---|
| No / Name / Category / Manufacturer / Website | Yes | Yes |
| Unit/Cost Price / Commission / Weight / Pack | Yes | Yes |
| Qty stock/order/demand / Reorder level | Yes | Yes |
| Qty per unit / Usage unit / Discontinued | Yes | Yes |
| VAT / Tax class | Yes | Yes |
| Pricing formula / markup | Yes | Yes |
| Image / Serial / MFR / Vendor Part / GL | Yes | Yes |

### Invoices
| Field | bizforce-crm | vtiger |
|---|---|---|
| No / Subject / Date / Due Date | Yes | Yes |
| Subtotal / Discount / Tax / Shipping / Grand Total | Yes | Yes |
| Carrier / PO / Customer No / Excise / Commission | Yes | Yes |
| Status / Paid amount / Payments | Yes | Yes |
| Recurring profile | Yes | Yes |
| Line items (product/service, qty, price, discount, tax) | Yes | Yes |
| Terms / Notes | Yes | Yes |
| Per-item commission | Partial | Yes |

### Tickets
| Field | bizforce-crm | vtiger |
|---|---|---|
| No / Title / Description / Solution / Update Log | Yes | Yes |
| Status / Priority / Severity / Category | Yes | Yes |
| Hours / Days / From Mail | Yes | Yes |
| Contact / Account / Product / Contract | Yes | Yes |
| Email thread / comments | Yes | Yes |

## D. Settings / Admin Comparison

| Setting | bizforce-crm | vtiger |
|---|---|---|
| Roles / Profiles / Groups / Sharing | Yes | Yes |
| Custom fields + custom views | Yes | Yes |
| Layout editor | Yes | Yes |
| Picklist + dependency | Yes | Yes |
| Workflows + cron tasks | Yes | Yes |
| Email templates | Yes | Yes |
| SMTP settings + test | Yes | Yes |
| Mail converter rules | Yes | Yes |
| Currency / Tax | Yes | Yes |
| Record numbering | Yes | Yes |
| Login history / Audit log | Yes | Yes |
| Cron task manager | Yes | Yes |
| Module manager (enable/disable) | Yes | Yes |
| Tags settings | **No** | Yes |
| Menu editor | **No** | Yes |
| Lead conversion mapping | **No** | Yes |
| Sales stage probability mapping | Partial | Yes |
| Announcements / Notifications / Holidays | Yes | No |
| Super-admin (orgs/users/history/settings) | Yes | No |
| Backups / API keys | Yes | No |
| Integration settings (Google/PBX) | Yes | No |
| Extension store | **No** | Yes |
| Language packs | **No** | Yes |

## E. Missing in bizforce-crm (priority-ordered)

| # | Missing | vtiger reference | Priority |
|---|---|---|---|
| 1 | Mobile app | Mobile package | High |
| 2 | Merge / duplicate handling | MergeRecords | High |
| 3 | Multi-language packs | languages/ | Medium |
| 4 | Extension / marketplace store | ExtensionStore | Medium |
| 5 | Menu editor | Settings > MenuEditor | Medium |
| 6 | Full report designer (matrix/chart/scheduled/PDF) | Reports | Medium |
| 7 | Tags UI | Settings > Tags | Low |
| 8 | Sales stage history (Potentials) | Potentials | Low |
| 9 | Lead conversion mapping UI | Settings > Leads | Low |
| 10 | Potential multi-product | Potentials | Low |

## F. In bizforce-crm but NOT in vtiger

| Feature | Notes |
|---|---|
| 2FA authentication | Yes |
| Multi-tenant SaaS (super-admin, orgs, signup, pricing/legal pages) | Yes |
| Automated database backups | Yes |
| Notification center + announcements | Yes |
| Kanban board | Yes |
| Personalizable dashboard widgets | Yes |
| API keys management | Yes |
| PDF document generator for quotes/invoices/SO | Yes |
| Holiday calendar | Yes |
| Login attempt locking + 2FA | Yes |
