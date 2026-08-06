import { LegalPage } from '@/components/LegalPage'

export function CookiePolicyPage() {
  return (
    <LegalPage title="Cookie Policy" updated="August 2, 2026">
      <p>
        This Cookie Policy explains how BizForce.online ("we", "our", "us") uses cookies and similar technologies when you visit
        our website or use our platform.
      </p>
      <h2 className="text-base font-semibold text-slate-900 dark:text-white pt-2">1. What Are Cookies?</h2>
      <p>
        Cookies are small text files stored on your device when you visit a website. They help the website remember your actions
        and preferences over time.
      </p>
      <h2 className="text-base font-semibold text-slate-900 dark:text-white pt-2">2. How We Use Cookies</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li><span className="font-medium">Essential cookies</span> — required for you to log in and use the platform.</li>
        <li><span className="font-medium">Preference cookies</span> — remember your theme and language choices.</li>
        <li><span className="font-medium">Analytics cookies</span> — help us understand how visitors use our site.</li>
      </ul>
      <h2 className="text-base font-semibold text-slate-900 dark:text-white pt-2">3. Managing Cookies</h2>
      <p>
        You can control and delete cookies through your browser settings. Please note that disabling essential cookies may prevent
        you from signing in to the platform.
      </p>
      <h2 className="text-base font-semibold text-slate-900 dark:text-white pt-2">4. Contact Us</h2>
      <p>If you have questions about this Cookie Policy, contact us at sajjad@bizforce-crm.online.</p>
    </LegalPage>
  )
}
