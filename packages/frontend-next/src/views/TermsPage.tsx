'use client'

import { LegalPage } from '@/components/LegalPage'

export function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="August 2, 2026">
      <p>
        These Terms of Service ("Terms") govern your access to and use of the BizForce.online CRM platform and website
        ("Service"). By creating an account or using the Service, you agree to be bound by these Terms.
      </p>
      <h2 className="text-base font-semibold text-slate-900 dark:text-white pt-2">1. Account Registration</h2>
      <p>
        You must provide accurate and complete information when creating an account. You are responsible for maintaining the
        confidentiality of your credentials and for all activity that occurs under your account.
      </p>
      <h2 className="text-base font-semibold text-slate-900 dark:text-white pt-2">2. Acceptable Use</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>You may not use the Service for any unlawful purpose.</li>
        <li>You may not attempt to gain unauthorized access to the Service or its systems.</li>
        <li>You may not upload malicious code or content.</li>
        <li>You may not infringe on the rights of others.</li>
      </ul>
      <h2 className="text-base font-semibold text-slate-900 dark:text-white pt-2">3. Subscriptions & Billing</h2>
      <p>
        Paid plans are billed in advance on a recurring basis. You may cancel your subscription at any time, and access continues
        until the end of the current billing period.
      </p>
      <h2 className="text-base font-semibold text-slate-900 dark:text-white pt-2">4. Intellectual Property</h2>
      <p>
        The Service, including its software, design, and content, is owned by BizForce and protected by intellectual property
        laws. You may not copy, modify, or distribute any part of the Service without our written consent.
      </p>
      <h2 className="text-base font-semibold text-slate-900 dark:text-white pt-2">5. Termination</h2>
      <p>
        We may suspend or terminate your access if you violate these Terms. You may delete your account at any time by contacting
        our support team.
      </p>
      <h2 className="text-base font-semibold text-slate-900 dark:text-white pt-2">6. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by law, BizForce shall not be liable for any indirect, incidental, special, or
        consequential damages arising from your use of the Service.
      </p>
      <h2 className="text-base font-semibold text-slate-900 dark:text-white pt-2">7. Contact Us</h2>
      <p>Questions about these Terms? Contact us at sajjad@bizforce-crm.online.</p>
    </LegalPage>
  )
}
