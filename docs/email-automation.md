# Email Automation & Lead Follow-Up

## Runtime

The module is available in the CRM as `Lead Email Sequences`.

Backend routes:

- `GET/POST /api/email-automation/sequences`
- `GET/PUT/DELETE /api/email-automation/sequences/:id`
- `POST /api/email-automation/sequences/:id/activate`
- `POST /api/email-automation/sequences/:id/pause`
- `POST /api/email-automation/sequences/:id/enroll`
- `GET /api/email-automation/leads/:id`
- `GET /api/email-automation/leads/:id/emails`
- `POST /api/email-automation/leads/:leadId/sequences/:enrollmentId/:action`
- `POST /api/email-automation/emails/send`
- `POST /api/webhooks/email/:provider`

## Environment

Existing SMTP, Gmail, and Resend settings are reused through `src/lib/mailer.ts`.

Optional webhook validation:

```text
EMAIL_WEBHOOK_SECRET=
EMAIL_WEBHOOK_SENDGRID_SECRET=
EMAIL_WEBHOOK_MAILGUN_SECRET=
EMAIL_WEBHOOK_POSTMARK_SECRET=
```

Provider-specific secrets override the generic secret. Webhooks send an HMAC SHA-256 hex digest in `x-email-signature` or `x-webhook-signature` over the JSON request body.

## Scheduler

The existing backend cron loop calls `processDueEmailSequences(100)` once per minute. Due work is read in batches from `LeadSequenceEnrollment` where:

```text
status = ACTIVE
nextActionAt <= now
```

The scheduler runs a final database stop-condition check immediately before sending each email.

## Idempotency

Each automated message uses:

```text
companyId + enrollmentId + sequenceStepId
```

as `EmailMessage.idempotencyKey`. A unique database index on `(companyId, idempotencyKey)` prevents duplicate sends for the same enrollment step.

## Tenant Isolation

All feature records include `companyId`. Authenticated API queries scope every read and mutation to `req.user.companyId`; webhook payloads must include `companyId`, `tenant_id`, or `organization_id` to map events to one organization.

## Indexes

The migration creates indexes for scheduler and high-frequency reads:

- `Lead(companyId, emailStatus)`
- `Lead(companyId, nextFollowUp)`
- `EmailSequence(companyId, status)`
- `LeadSequenceEnrollment(companyId, status, nextActionAt)`
- `EmailMessage(companyId, leadId)`
- `EmailMessage(companyId, providerMessageId)`
- `EmailMessage(companyId, messageId)`
- `EmailEvent(companyId, provider, providerEventId)`
- `EmailReply(companyId, leadId)`
- `EmailSuppression(companyId, email)`

## Failure Handling

Permanent failures stop automation:

- replies
- hard bounces
- delivery failures
- unsubscribes
- manual stops

Unsubscribes and hard bounces are written to `EmailSuppression`, and suppressed addresses are skipped before every automated send.
