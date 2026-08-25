'use client'

import { LegalPage } from '@/components/LegalPage'

export function RefundPolicyPage() {
  return (
    <LegalPage title="Refund Policy" updated="August 2, 2026">
      <p>
        This Refund Policy explains the terms under which BizForce.online ("we", "our", "us") issues refunds for paid
        subscriptions to our CRM platform.
      </p>
      <h2 className="text-base font-semibold text-slate-900 dark:text-white pt-2">1. Subscription Billing</h2>
      <p>
        Paid plans are billed in advance on a recurring monthly basis. You will be charged at the start of each billing period
        until you cancel your subscription.
      </p>
      <h2 className="text-base font-semibold text-slate-900 dark:text-white pt-2">2. 14-Day Money-Back Guarantee</h2>
      <p>
        If you are not satisfied with the Service, you may request a full refund within 14 days of your initial purchase. To
        qualify, contact our support team at sajjad@bizforce-crm.online with your account details and reason for the request.
      </p>
      <h2 className="text-base font-semibold text-slate-900 dark:text-white pt-2">3. Refunds After 14 Days</h2>
      <p>
        After the 14-day guarantee period, refunds are issued on a pro-rata basis for any unused portion of the current billing
        period, at our sole discretion and in cases of service failure or billing error.
      </p>
      <h2 className="text-base font-semibold text-slate-900 dark:text-white pt-2">4. Processing Time</h2>
      <p>
        Approved refunds are processed within 7–10 business days and returned to the original payment method used for the
        purchase.
      </p>
      <h2 className="text-base font-semibold text-slate-900 dark:text-white pt-2">5. Contact Us</h2>
      <p>
        For any questions about this Refund Policy, contact us at sajjad@bizforce-crm.online or call +92-345-4452741.
      </p>
    </LegalPage>
  )
}
