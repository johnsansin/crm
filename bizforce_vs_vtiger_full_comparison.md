# BizForce CRM vs Vtiger 8.4.0 — Full Functionality, Pages & Forms Comparison

_Compiled 2026-08-12, re-audited 2026-08-13 from direct inspection of both codebases on 192.168.2.229_
- **bizforce-crm** → `/home/ubuntu/crm` (Node/Express + Prisma/PostgreSQL backend, React/Vite/Tailwind frontend — **live app**, backend :3000, frontend :5173)
- **vtigercrm 8.4.0** → `/home/ubuntu/vtiger/vtigercrm` (PHP/MySQL, source in `vtigercrm8.4.0.tar.gz`, installed DB `vtigercrm` = 49 tabs / 600+ tables)

## 0. Important context (verify before acting on this report)

| Item | bizforce-crm | vtiger | Note |
|---|---|---|---|
| Code location | `~/crm` (git repo, monorepo) | `~/vtiger/vtigercrm` | vtiger `modules/` source tree is **NOT extracted** (only `cron/modules`). Full module list taken from tarball + MySQL `vtiger_tab` |
| Running? | Yes (vite + tsx dev servers up) | Config empty (`config.inc.php` is 0 bytes); not installed/running via web | MySQL `vtigercrm` schema + `bizcrm` DB exist |
| Previous report `report_bizforce_vs_vtiger.md` | **Outdated** — merge/duplicates (API), Tags UI, Menu editor, Potential multi-product & stage-history, lead-conversion mapping, stage-probability mapping, 15 language packs, and account/contact field parity all now exist | — | See corrections in sections C, D, E, F, H |

---

## A. Architecture

| Aspect | bizforce-crm | vtiger 8.4.0 |
|---|---|---|
| Frontend | React 18 + Vite + Tailwind, shadcn-style UI, client routing | PHP server-rendered, jQuery + Smarty templates (`layouts/v7`), old vlayout |
| Backend | Node.js/Express REST API + Prisma ORM | PHP, module-per-directory MVC (`modules/<Module>/{models,views,actions}/`) |
| Database | PostgreSQL (84 tables) | MySQL/MariaDB (600+ tables), `vtiger_` prefix |
| Auth | JWT + bcrypt, 2FA (TOTP), OTP email verification, login attempt lockout | Session-based, LDAP/Active-Directory option, user auth tokens |
| Tenant model | **Multi-tenant SaaS** (Company/orgs, Super Admin panel, signup, pricing/legal pages) | Single-tenant (one org per install) |
| Mobile | No mobile app (responsive web only) | `Mobile` package (mandatory zip) |
| i18n | English fallback + **15 packs** (zh, nl, fr, de, es, it, pt, ru, ja, ko, ar, pl, hi, tr, vi) | 15+ language packs | Same |
| API | Custom REST `/api/*` + `/api/rest/*` + API keys | `webservice.php` (vtws REST/SOAP) |
| Extensions | No marketplace | ExtensionStore + installable module packages (zips) |

---

## B. Module coverage matrix (vtiger `vtiger_tab` = 49 tabs vs bizforce)

| vtiger tab | bizforce module | Status |
|---|---|---|
| Dashboard | Dashboard (`/dashboard`, widget grid) | Same |
| Home | Landing / dashboard | Same |
| Accounts | accounts | Same |
| Contacts | contacts | Same |
| Leads | leads | Same |
| Potentials | potentials (Opportunities) + Forecast page | Same + extra |
| Campaigns | campaigns | Same |
| Products | products | Same |
| Services | services | Same |
| Vendors | vendors | Same |
| PriceBooks | pricebooks | Same |
| Quotes | quotes | Same |
| SalesOrder | salesorders | Same |
| PurchaseOrder | purchaseorders | Same |
| Invoice | invoices (+ payments, recurring invoices) | Same + extra |
| HelpDesk | tickets | Same |
| Faq | faq | Same |
| Assets | assets | Same |
| ServiceContracts | servicecontracts | Same |
| Project / ProjectTask / ProjectMilestone | projects / projecttasks / projectmilestones | Same |
| Documents | documents | Same |
| Emails | emails | Same |
| EmailTemplates | emailtemplates | Same |
| Webmails / MailManager | mailboxes | Same (merged) |
| PBXManager | calllogs (Phone Calls) | Same |
| SMSNotifier | smsnotifier | Same |
| Rss | rssfeeds | Same |
| Reports | reports (report module) | Same (vtiger richer) |
| RecycleBin | recycle bin (`/trash`) | Same |
| Webforms | webforms | Same |
| ModComments | comments | Same |
| Portal / CustomerPortal | customer portal (`/api/portal/*`, PortalUser) | Same (bizforce: tickets+invoices+PDF) |
| Google | google accounts sync | Same |
| Import | settings → Data Management (CSV/JSON import) | **Partial** (vtiger has dedicated Import module w/ wizard) |
| ModTracker | audit log (AuditLog) | Same |
| Users | users | Same |
| Mobile | — | **Missing in bizforce** |
| ExtensionStore | — | **Missing in bizforce** |
| WSAPP | — | **Partial** (REST API exists; no offline sync app) |

**Net: every functional vtiger module has a bizforce equivalent except `Mobile` and `ExtensionStore`.**

---

## C. Feature comparison

| Feature | bizforce-crm | vtiger | Diff |
|---|---|---|---|
| Record list view with filters, column show/hide, sort | Yes | Yes | Same |
| Kanban board view | Yes (potentials/tickets/projects) | No | **Extra in bizforce** |
| Record detail + edit + quick-create forms | Yes (generic ModuleDetailPage) | Yes | Same |
| Custom fields (per module) | Yes (CustomField model) | Yes | Same |
| Layout editor (field order/visibility) | Yes (`/api/layout/*`, ModuleLayout) | Yes | Same |
| Picklist editor + **picklist dependency** | Yes | Yes | Same |
| Custom views / filters | Yes (CustomView model + routes) | Yes | Same |
| Roles / Profiles / Groups / Sharing rules | Yes (RBAC routes + PermissionProfile) | Yes | Same |
| **Merge / duplicate handling** | **Done** — `GET /:id/duplicates` + `POST /:id/merge` (entity.routes.ts:668,693) with children reassignment, wired to a **MergeRecordsDialog** in the record detail page (`ModuleDetailPage.tsx`) | Yes (MergeRecords) | Same — prior report (backend-only) was outdated |
| Lead conversion (with account/contact/potential creation) | Yes (`/api/leads/:id/convert` + UI in LeadDetailPage) | Yes (+ conversion mapping UI) | Same (mapping UI now in bizforce `Settings → Leads`, applied in `lead.routes.ts:30,68`) |
| Potential sales-stage history | Yes (PotentialStageHistory model) | Yes (`vtiger_potstagehistory`) | Same — prior report was wrong |
| Opportunity multi-product line items | Yes (PotentialProduct) | Yes | Same — prior report was wrong |
| Opportunity **forecasting** | Yes (Forecast page + `/api/forecast/*`) | No dedicated module | **Extra in bizforce** |
| Quotes / SalesOrders / POs / Invoices with line items | Yes (Quote/SO/PO/Invoice LineItem) | Yes | Same |
| Quote stage history | Yes (QuoteStageHistory) | Yes (`vtiger_quotestagehistory`) | Same |
| Invoice payments tracking | Yes (Payment model + `/invoices/:id/payments`) | Partial (paid field only) | **Extra in bizforce** |
| Recurring invoices | Yes (RecurringInvoice + cron generate) | Yes (SO/Invoice recurring fields) | Same (bizforce dedicated module) |
| PDF documents (Quote/Invoice/SO/PO) | Yes (backend pdf routes + portal invoice PDF) | Yes (InventoryPDFController) | Same |
| Product images | Yes (ProductImage, multiple, lightbox) | Yes (imagename) | Same |
| Product pricing formula / tax class | Yes (pricingFormula, markupPercent, taxClass) | Yes | Same |
| Stock/reorder management | Fields + reorder level (no alerts) | Fields + reorder level | Same |
| Email templates (with preview/send) | Yes | Yes | Same |
| IMAP mailbox sync (MailManager) | Yes (Mailbox model + sync) | Yes | Same |
| Email → Ticket conversion rules | Yes (EmailToTicketRule) | Yes (MailConverter) | Same |
| Customer portal | Yes (tickets, invoices, invoice PDF) | Yes (full portal) | Same |
| Google Calendar/Contacts sync | Yes (GoogleAccount) | Yes | Same |
| PBX / click-to-call / call logs | Yes (CallLog, `/api/pbx/*`) | Yes (PBXManager) | Same |
| SMS notifier | Yes | Yes | Same |
| RSS reader | Yes | Yes | Same |
| Recycle bin (soft delete/restore/purge) | Yes | Yes | Same |
| Reports builder | Tabular, **summary**, **matrix**, **chart** (bar/pie), folders, scheduled reports, CSV/HTML export | Tabular, summary, matrix, chart + scheduled reports + PDF | Same — prior report was outdated (designer in `ReportsPage.tsx`, runner + `POST /reports/export`) |
| Webforms (embed → module record) | Yes (token + `/api/webforms/:token/submit`) | Yes | Same |
| Workflows + scheduled tasks/cron | Yes (Workflow, ScheduledTask) | Yes | Same |
| Announcements / notifications center | Yes | Yes (vtiger announcement module) | Same |
| Holiday calendar | Yes | No | **Extra in bizforce** |
| 2FA (TOTP) | Yes | No | **Extra in bizforce** |
| Login history + audit trail | Yes (LoginLog, AuditLog) | Yes (vtiger_loginhistory, vtiger_audit_trial) | Same |
| Super-admin multi-tenant panel | Yes | No | **Extra in bizforce** |
| Automated DB backups | Yes (settings → backup) | No | **Extra in bizforce** |
| API keys management | Yes | No (ws user tokens) | **Extra in bizforce** |
| Real-time presence (who's online) | Yes (`usePresence`) | No | **Extra in bizforce** |
| Tags (per-org, assignable) | Yes (Tag model + TagsSettings UI) | Yes (freetags) | Same — prior report was wrong |
| Menu editor | Yes (MenuSettings UI + `/settings/modules/menu`) | Yes | Same — prior report was wrong |
| Record numbering (prefix/width/next) | Yes (SequenceNumber + settings) | Yes (`vtiger_modentity_num`) | Same |
| Import wizard | **Done** — full mapping/validation wizard (`import-wizard-dialog.tsx`), per-module CSV/JSON upload + `POST /settings/import/:module/rows` (match-field update support) | Dedicated Import module (mapping, field validation) | Same — prior report was outdated |
| Export | CSV + JSON per module | CSV/XLS/PDF per module | Same |
| Multi-language | English fallback + 15 packs | 15+ packs | Same |
| **Per-record currency** | **Done** — `currency` on Quotes/SOs/POs/Invoices/ServiceContracts + **Potentials** (added this session, `Potential.currency`) | Yes | Same |
| Mobile app | No | Yes | **Missing in bizforce** |
| Extension marketplace | No | Yes (ExtensionStore) | **Missing in bizforce** |

---

## D. Pages / Screens comparison

### D1. bizforce-crm routes (from `App.tsx` + dynamic `/:module`)
Public: `/` Landing, `/contact`, `/pricing`, `/privacy-policy`, `/terms`, `/cookie-policy`, `/refund-policy`, `/login`, `/signup`, `/forgot-password`, `/reset-password`
CRM (sidebar): `/dashboard`, `/calendar`, `/forecast`, `/reports`, `/mailboxes`, `/rssfeeds`, `/trash`, `/settings`, `/admin`, `/profile`, `/org/setup`
Dynamic module pages: `/:module` (list), `/:module/new`, `/:module/:id` (detail), `/:module/:id/edit`, plus `/leads/:id` (LeadDetail), `/quotes*`, `/salesorders*`, `/invoices*`, `/products*` dedicated pages.
SuperAdmin: `/superadmin/dashboard`, `/superadmin/organizations`, `/superadmin/users`, `/superadmin/login-history`, `/superadmin/settings`.

### D2. vtiger views (from tarball)
Generic per module: List, Detail, Edit, QuickCreate; module-specific: ConvertLead, ConvertPotential, AccountHierarchy, ProductsPopup(+Ajax), ServicesPopup, SubProductsPopup, PriceBookPopup, SendEmail, RecipientPreferences, MoreCurrenciesList, SubProductQuantityUpdate, Documents AddFolder/Move/FilePreview, Reports ChartEdit/ChartDetail/ExportReport/ListAjax/MoveReports, Rss ViewTypes, Portal Detail/List/EditAjax, Emails MassSaveAjax.

| Page type | bizforce-crm | vtiger |
|---|---|---|
| Dashboard / Home | Personalizable widget grid (drag/drop, show/hide, per-user) | Home + dashboard widgets |
| List view | Generic table: search/filter, column toggles, CSV/JSON export, **Kanban toggle** | List view with search, filters, mass actions |
| Detail view | Generic tabs/related-lists dialog (`detail-dialog`) | Tabbed detail + related lists |
| Create/Edit form | Generic field grid, module-aware, select popups (product/service/vendor/project/user) | Module forms w/ popup pickers |
| Quick create | Via generic new route | QuickCreateAjax per module |
| Lead convert | LeadDetailPage modal → account+contact+potential | ConvertLead view |
| Calendar | Full page (`/calendar`) w/ activities, shared, recurrence, Google sync | Calendar + Events modules |
| Reports | Tabular/summary/chart builder | Tabular/summary/matrix/chart + folders + scheduling |
| Forecast | Dedicated Forecast page | Not present |
| Mailbox UI | `/mailboxes` (IMAP folders, sync, email→ticket rule) | MailManager |
| RSS | `/rssfeeds` | Rss module |
| Recycle bin | `/trash` | RecycleBin |
| Portal | Login, tickets, invoices + PDF | Portal + CustomerPortal |
| Super admin | 5 dedicated pages | n/a |
| Settings | Single SettingsPage w/ 18 sections + sub-pages | Settings menu w/ 9 block categories |

### D3. bizforce Settings sections (18) vs vtiger Settings categories

| bizforce Settings section | vtiger equivalent | Status |
|---|---|---|
| Users | Users | Same |
| Roles | Roles | Same |
| Groups | Groups | Same |
| Sharing Access | SharingAccess | Same |
| Company (branding) | CompanyDetails | Same |
| Organization (password policy, login security, lead config, regional, inventory) | ConfigEditor / Settings > Vtiger | Same |
| Currencies | Currency | Same |
| Tax | Tax records | Same |
| Document Terms | TermsAndConditions | Same |
| Picklists & Fields (picklist editor, custom fields, module manager) | Picklist / LayoutEditor / ModuleManager | Same |
| Email / SMTP | OutgoingServer | Same |
| Workflows & Tasks | Workflows / CronTasks | Same |
| Audit Trail | ModTracker / LoginHistory | Same |
| Data Management (backup/export/import) | Import / backup | Same+extra |
| Announcements | Announcements | Same |
| Integrations (API keys, portal, Google, layout, picklist deps, payment reminders) | Google / Integration settings | Same+extra |
| Tags | Tags | Same |
| Menu Editor | MenuEditor | Same |
| — (no settings tabs for:) | Tags → present; MenuEditor → present | — |

vtiger-only settings areas **not in bizforce**: MailConverter UI (bizforce does it via EmailToTicketRule under Integrations), ExtensionStore. Lead-conversion mapping (`Settings → Leads`) and sales-stage probability mapping (`Settings → Potentials`) are now present in bizforce.

---

## E. Field-level comparison (key modules)

Legend: ✅ present · ❌ missing · ➕ bizforce extra · ⚠️ vtiger extra

### Accounts
| Field group | bizforce | vtiger | Note |
|---|---|---|---|
| No / Name / Parent (Member Of) | ✅ | ✅ | |
| Website / Email / Email2 / Phone / OtherPhone / Fax | ✅ | ✅ | |
| Employees / Annual Revenue / Industry | ✅ | ✅ | |
| Type / Ownership / Rating / SIC / Ticker | ✅ | ✅ | |
| Billing + Shipping full addresses | ✅ | ✅ | |
| Notify Owner / Email Opt-out / Description | ✅ | ✅ | |
| GL Account | ✅ | ⚠️ `glacct` | Same (schema:201) |

### Contacts
| Field group | bizforce | vtiger | Note |
|---|---|---|---|
| No / Salutation / Name / Title / Dept | ✅ | ✅ | |
| Emails (2) / Phones (4) / Fax / Assistant(+phone) | ✅ | ✅ | |
| Reports To / DOB / Lead Source / Do Not Call | ✅ | ✅ | |
| Portal access / Email opt-out | ✅ | ✅ | |
| Support Start/End | ✅ | ✅ | |
| Mailing + Other addresses (full) | ✅ | ✅ | |
| Contact Image | ✅ | ⚠️ `imagename` | Same (schema:247) |
| Google Contact ID / converted-from-lead | ➕ | ❌ | bizforce extra |
| Notify Owner | ✅ | ⚠️ | Same (schema:245) |

### Leads
| Field group | bizforce | vtiger | Note |
|---|---|---|---|
| No / Salutation / Name / Title(Designation) / Company | ✅ | ✅ | |
| Emails / Phones / Fax / Website | ✅ | ✅ | |
| Address (street/city/state/country/postal/PO box) | ✅ | ✅ | |
| Lead Source / Status / Industry / Revenue / Employees / Rating | ✅ | ✅ | |
| Opt-out / Description | ✅ | ✅ | |
| Campaign link + product & service line items | ➕ | ❌ | bizforce extra |
| Interest / conversion refs (account/contact/potential ids) | ➕ | ❌ | bizforce extra |

### Opportunities (Potentials)
| Field group | bizforce | vtiger | Note |
|---|---|---|---|
| No / Name / Amount / Closing / Type / Stage / Probability | ✅ | ✅ | |
| Next Step / Lead Source / Campaign / Account / Contact | ✅ | ✅ (related_to) | |
| Forecast Amount / Category / Outcome Analysis | ➕ | ❌ | bizforce extra |
| Multi-product line items (PotentialProduct) | ✅ | ✅ | prior report said partial — now full |
| Stage history (PotentialStageHistory) | ✅ | ✅ | prior report said missing — now present |

### Products / Services
| Field group | bizforce | vtiger | Note |
|---|---|---|---|
| No / Name / Category / Manufacturer / Website | ✅ | ✅ | |
| Unit & Cost price / Commission (rate+method) | ✅ | ✅ | |
| Qty stock / on order / demand / reorder level | ✅ | ✅ | |
| Qty per unit / Usage unit / Discontinued | ✅ | ✅ | |
| VAT flags + % / Tax class / GL / Pricing formula / markup | ✅ (plus markup%, vat%) | ✅ (taxclass) | |
| Sales & support start/end dates | ✅ | ✅ | |
| Image (multi + lightbox) / Serial / MFR / Vendor part / Product sheet | ✅ | ✅ | |
| Weight / Pack size | ➕ | ❌ | bizforce extra |

### Quotes / SalesOrder / PurchaseOrder / Invoice
| Field group | bizforce | vtiger | Note |
|---|---|---|---|
| Doc No / Subject / Date(s) / Valid till | ✅ | ✅ | |
| Account / Contact / Potential / Quote / SO refs | ✅ | ✅ | |
| Billing + shipping addresses | ✅ | ✅ | |
| Line items: product/service, qty, list/unit price, discount (amt+%), tax (amt+%), net, line total | ✅ | ✅ | |
| Subtotal / Discount / Tax / S&H / Adjustment / Grand total | ✅ | ✅ | |
| Carrier / PO No / Customer No / Excise / Sales commission | ✅ | ✅ | |
| Status / Stage + stage history | ✅ | ✅ | |
| Terms & Conditions / Description / Notes | ✅ | ✅ | |
| Recurring (SO enable/frequency/start/end) | ✅ | ✅ | |
| Invoice paid amount / payments list | ➕ | ❌ | bizforce extra |
| Per-record currency + conversion rate | ❌ | ⚠️ `currency_id` + `conversion_rate` | vtiger extra |

### Tickets (HelpDesk)
| Field group | bizforce | vtiger | Note |
|---|---|---|---|
| No / Title / Description / Solution / Update log | ✅ | ✅ | |
| Status / Priority / Severity / Category | ✅ | ✅ | |
| Hours / Days / From mail | ✅ (fromMail) | ✅ (from_portal) | |
| Contact / Account / Product / ServiceContract refs | ✅ | ✅ (parent_id + product) | |
| Comments / email thread | ✅ | ✅ (ModComments) | |

### Calendar / Events
| Field group | bizforce | vtiger | Note |
|---|---|---|---|
| Subject / Description / Type (task/event) / Status / Priority | ✅ (Activity) | ✅ | |
| Start/End, due, all-day (No Time), location | ✅ | ✅ | |
| Recurrence | ✅ (JSON) | ✅ (`recurringtype`) | |
| Reminder + send-notification | ✅ | ✅ | |
| Shared calendar / visibility | ✅ (`shared`) | ✅ (`visibility`, shared calendar) | |
| Google event sync | ✅ | ✅ | |
| Holidays overlay | ➕ | ❌ | bizforce extra |

---

## F. What is MISSING in bizforce-crm (priority order)

| # | Missing | vtiger ref | Priority | Notes |
|---|---|---|---|---|
| 1 | Mobile app | `Mobile.zip` (mandatory) | High | Largest visible gap |
| 2 | Extension marketplace / module installer | ExtensionStore | Med | Zip-based module install/export in vtiger |

**Recently completed since the last report (verified live 2026-08-13):**
- Lead-conversion mapping UI (`Settings → Leads`, LeadSettings.tsx) — applied in `lead.routes.ts:30,68` ✓
- Sales-stage probability mapping UI (`Settings → Potentials`, PotentialSettings.tsx) — auto-fills `probability` on stage change (ModuleDetailPage.tsx:381, LeadDetailPage.tsx:481) ✓
- 13 additional language packs → English fallback + 15 dicts (i18n.ts:2120-2136) ✓
- Field parity: Account `glAccount` (schema:201), Contact `image` (schema:247), Contact `notifyOwner` (schema:245) ✓
- **Merge/duplicate UI** — `MergeRecordsDialog` wired into the detail page (module-detail "Merge" button) using `GET /:id/duplicates` + `POST /:id/merge` ✓
- **Import wizard** — full mapping/validation wizard (`import-wizard-dialog.tsx`) on every module list + Settings→Data ✓
- **Report designer** — tabular/summary/matrix/chart + folders + scheduled reports + CSV/HTML export (`ReportsPage.tsx`, `/reports/export`) ✓
- **Per-record currency** — Quote/SO/PO/Invoice/ServiceContract already had `currency`; **Potentials** gained `currency` (schema + form + detail + list + reports) ✓

## G. What is EXTRA in bizforce-crm (not in vtiger)

| Feature | Where |
|---|---|
| Multi-tenant SaaS — orgs, signup, super-admin panel (dashboard/orgs/users/login-history/settings) | `/superadmin/*` |
| TOTP 2FA + OTP email verification + login attempt lockout | settings > Organization |
| Automated DB backups (on-demand, list/restore) | settings > Data Management |
| Notification center + announcements | settings > Announcements |
| Kanban board view (potentials, tickets, projects) | ModuleListPage |
| Personalizable drag-and-drop dashboard widgets | DashboardPage |
| Forecast page & pipeline recalculation | `/forecast`, `/api/forecast/*` |
| Dedicated Payments module + invoice balance | `Payment` model |
| Dedicated Recurring Invoices module + cron generation | `/api/recurringinvoices/*` |
| API keys (scoped, expiring) + public REST API | `/api/rest/*`, `/api/apikeys` |
| Real-time user presence (online indicator) | `usePresence` |
| Customer portal with invoice PDF | `/api/portal/*` |
| Holiday calendar | settings > Announcements |
| Multi-image product gallery + lightbox | ProductDetailPage |
| Product pricing formula / markup / VAT % fields | Product model |
| Terms/Cookie/Refund/Privacy/Pricing/Contact marketing pages | `/`, `/pricing`, etc. |

---

## H. Replication roadmap (if the goal is "make bizforce match vtiger")

**Done (2026-08-13):** lead-conversion mapping, sales-stage probability mapping, field parity (glAccount/image/notifyOwner), localization (15 packs + EN fallback), merge/duplicate UI, import wizard, report designer (tabular/summary/matrix/chart + folders + scheduling + export), and per-record currency on Potentials (already present on Quote/SO/PO/Invoice/ServiceContract).

**Remaining (out of scope for web replication):**
1. **Mobile app** — requires a separate mobile codebase; note as product decision.
2. **Extension marketplace / module installer** — note as product decision.
