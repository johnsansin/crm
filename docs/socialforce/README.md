# SocialForce AI inside BizForce CRM

## Release scope

This is an incremental **foundation release and interactive demo**, not the complete production SaaS described in the product specification.

- CRM module: `/social-media` (existing CRM login and organization required).
- Public demonstration: `/socialforce-demo` (fictional data, in-memory state, no backend writes, social calls or AI requests).
- API namespace: `/api/socialforce`.
- Existing CRM authentication, organization lifecycle, and `social` module permissions are reused.
- No existing CRM customer data is seeded, renamed or migrated into SocialForce.

### Working now

Organization-scoped PostgreSQL drafts, master content and independently editable platform variants; optimistic version checks; editorial calendar; administrator review with separation of author and reviewer; brand settings; transactional audit events; responsive content studio with light/dark theme; local image previews; explicit integration readiness; request validation/rate limits; tenant isolation tests.

The public demo includes a prepared product-launch example and a partial-publication **UI simulation**. Neither is evidence of a working AI model or publishing worker. Its changes reset on reload.

### Not yet implemented

OAuth adapters and callback handling, actual connected accounts, encrypted token storage, live AI generation/chat/moderation, secure persistent media storage, publishing workers/scheduler, durable target/attempt tables, notifications delivery, campaigns/templates, provider analytics, social subscription quotas/billing, fine-grained social owner/manager/creator/approver roles, multi-organization membership/switching, database RLS, and full production hardening.

The CRM currently associates a user with one company. Do not advertise multi-organization membership or independently verified isolation of the rest of the CRM. Existing organization management remains available, but is not a replacement for the full social administration scope.

## Architecture and database

```text
CRM authentication → current active Company → social module permissions
  → /api/socialforce → validation + services → PostgreSQL
  → transactional SocialForceEvent audit record
```

New tables:

| Table | Ownership and purpose |
| --- | --- |
| SocialForcePost | Required Company FK; master content; bounded validated JSON platform variants; planned time as UTC; IANA display zone; state; version; author/reviewer |
| SocialForceBrand | Company primary key/FK; brand description, tone, audience, language, guidelines, approval policy |
| SocialForceEvent | Required Company FK; actor, action, resource ID and timestamp; no content or tokens in event metadata |

The migration is additive: `packages/backend/prisma/migrations/20260906090000_socialforce_foundation/migration.sql`. Existing legacy social rows remain available through sanitized read-only endpoints. Legacy writes are retired because the old code accepted tokens directly and marked posts published without provider receipts. Legacy records are not shown as verified connected accounts or published results in the new module.

Organization ownership is mandatory in the database. Tenant visibility is enforced by authenticated backend scoping, not PostgreSQL RLS in this release. Every repository query supplies the authenticated Company ID; superadmins without company context are denied. No organization ID is accepted from request payloads. Updates include the company, ID and expected version. Adding RLS with transaction-local tenant context and testing it under a non-owner database role is a production milestone.

## API contracts

All requests require the CRM Bearer session and active organization; module permissions follow HTTP actions. GET=view, POST=create, PUT=edit, DELETE=delete. Brand management and reviews additionally require administrator privileges.

| Method | Endpoint | Behavior |
| --- | --- | --- |
| GET | /api/socialforce/workspace | Current company, brand, latest 200 posts, latest 30 activity records, readiness; no credentials |
| POST | /api/socialforce/posts | Create DRAFT; strict title/content/variants/plannedAt/timezone validation |
| PUT | /api/socialforce/posts/:id | Edit an editable post using expected version; resets any prior approval |
| POST | /api/socialforce/posts/:id/submit | Submit DRAFT or CHANGES_REQUESTED for administrator review |
| POST | /api/socialforce/posts/:id/review | APPROVED or CHANGES_REQUESTED; requires version; author cannot self-approve |
| DELETE | /api/socialforce/posts/:id | Delete draft or changes-requested post within current company |
| PUT | /api/socialforce/brand | Save the current organization's brand profile |
| POST | /api/socialforce/providers/:provider/connect | 503 until official OAuth adapter is implemented |
| POST | /api/socialforce/posts/:id/publish | 503; cannot fabricate a publication |
| POST | /api/socialforce/posts/:id/schedule | 503; plannedAt is only an editorial reminder |
| POST | /api/socialforce/ai/generate | 503 until real AI service is implemented |

No tenant IDs, publication state, reviewer IDs, credentials or external post IDs can be set in post payloads. Dates must be offset-qualified timestamps. Platform names come from a registry, but provider-specific capabilities are not fabricated. The preview character count is informational, not provider compliance certification.

## Provider and worker roadmap

`src/socialforce/domain.ts` introduces contracts for SocialProvider, AIProvider and PublishingJob, plus tested status aggregation and retry policy. These are contracts/policies, not running integrations.

Next incremental milestones:

1. Add account/credential/OAuth-state models, server-side OAuth authorization code flow with state and PKCE where applicable, app review, per-account capabilities and multiple account selection. Encrypt tokens using a managed key strategy and never return them in API JSON.
2. Add tenant-bound media records and object storage, signatures, MIME sniffing, file size/type limits, image sanitization and scanning. Local preview images are not uploaded or attached to saved drafts in the current release.
3. Implement provider-independent AI orchestration with tenant-only brand context, quota reservation, token/cost accounting, validated outputs and reviewable moderation. AI cannot change security or approval state.
4. Add durable publishing targets, immutable variant versions, job outbox and attempts; composite company/account/post constraints; Redis/BullMQ workers. A worker reloads tenant/account/post state, checks permissions/subscription/approval, and only then calls an official provider.
5. Use target-level idempotency and external receipts. Reconcile uncertain network outcomes before retrying to avoid duplicate posts. Retry transient failures using bounded exponential backoff and provider Retry-After. Authentication/permission/invalid-content failures require user correction. Retry only failed targets, preserving successful targets.
6. Implement automatic scheduling in UTC with IANA presentation, cancellation and approval invalidation, notifications, campaigns, analytics capabilities, configurable social plan limits, organization membership switching and production tests.

Official sources checked September 6, 2026:

- X user authorization: https://docs.x.com/fundamentals/authentication/oauth-2-0/user-access-token
- LinkedIn Community Management: https://learn.microsoft.com/en-us/linkedin/marketing/community-management/community-management-overview
- Meta-maintained Instagram API collection: https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api
- OAuth security BCP: https://www.rfc-editor.org/rfc/rfc9700

Provider requirements vary by app/account/product/version. Verify official documentation during adapter implementation; do not treat marketing previews as proof of API capability.

## Development and deployment

Use the existing workspace and Docker services; no second auth/database stack is introduced.

```bash
npm ci
npm run db:generate -w packages/backend
npm run typecheck
npm run test
npm run build
```

For a database whose migration history is current, apply reviewed migrations with `npx prisma migrate deploy` from `packages/backend`. Do not run unrelated pending migrations blindly on a drifted live CRM. Back up production and review the additive SQL first. A fresh Docker environment still requires the existing CRM migration/bootstrap procedure; this release does not claim a new turnkey seeded SaaS deployment.

`socialforce.env.example` documents future integration inputs. They are placeholders for later phases and are not currently consumed by adapters. Never paste real credentials into documentation or public demo forms.

The current deployment uses existing PM2 services `crm-backend` and `crm-frontend-next`. Build backend/frontend and restart those services after applying the reviewed additive migration. `/api/socialforce/workspace` without authentication must return 401. The public demo must return 200 and issue no SocialForce API writes.

## Validation

Unit tests in `src/lib/socialforce.test.ts` cover mandatory tenant context, strict payload validation, independent human review, partial status aggregation, permanent/transient retry policy and fail-closed provider readiness.

An opt-in integration test at `src/socialforce/isolation.integration.ts` exercises real PostgreSQL records and authenticated HTTP routes using temporary organizations, users and roles. It cleans up only those generated fixtures. Run with `RUN_SOCIALFORCE_INTEGRATION=1 npx tsx src/socialforce/isolation.integration.ts` from the backend directory against an approved database after migration. It is separate from default unit tests to avoid unexpected database writes.

## Demo access and verified release results

- Self-contained demonstration: open `demo.html` from this directory in a browser. It bundles React and the current studio with no external assets; CRM API access is replaced with a disabled offline adapter. It contains only fictional example content.
- Verified server address: `http://127.0.0.1:3001/socialforce-demo`.
- CRM module on the server: `http://127.0.0.1:3001/social-media`.
- `https://bizforce-crm.online/socialforce-demo` served a different CRM deployment during verification. Do not share it as a working demo until the domain/deployment mapping is corrected.
- Six SocialForce unit tests passed, both TypeScript checks passed, backend and frontend builds passed, and more than 30 authenticated database-backed integration assertions passed. Temporary database fixtures were cleaned up.
- Chromium exercised sample loading, draft saving, platform preview, calendar, brand saving and success/partial-failure simulations. Desktop (1440px) and mobile (390px) layouts had no horizontal overflow or runtime exceptions; the demo made no SocialForce API requests.
- The three-table SocialForce migration was applied and recorded individually because older CRM migration history is drifted. Existing unrelated migrations were not replayed.
- Both existing CRM PM2 services were restarted. Backend health returned 200; unauthenticated SocialForce workspace returned 401.

Rebuild the standalone demo with `node scripts/package-socialforce-demo.cjs` from the repository root after changing the studio. It resolves React from the Next.js workspace to avoid mixing the monorepo's React versions. Offline links to CRM pages are intercepted; use the server module URL for real saved content.

Browser workflow regression: launch a local Chromium CDP instance on port 9230, then run `node scripts/socialforce-browser-test.cjs`. Override `SOCIALFORCE_CDP_ORIGIN` and `SOCIALFORCE_DEMO_URL` when needed; the latter also accepts the absolute `file://` URL of `demo.html`. Screenshots are written to `/tmp/socialforce-*.png`. The standalone file passed this workflow independently.
