import { LegalPage } from '@/components/LegalPage'

export function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="August 2, 2026">
      <p>
        BizForce.online ("we", "our", "us") is committed to protecting your privacy. This Privacy Policy explains how we collect,
        use, disclose, and safeguard your information when you use our CRM platform and website.
      </p>
      <h2 className="text-base font-semibold text-slate-900 dark:text-white pt-2">1. Information We Collect</h2>
      <p>
        We collect information you provide directly, such as your name, email address, company details, and data you enter into
        the CRM. We also collect usage information such as log files, IP addresses, and browser type to improve our services.
      </p>
      <h2 className="text-base font-semibold text-slate-900 dark:text-white pt-2">2. How We Use Your Information</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>To provide, maintain, and improve our services.</li>
        <li>To create and manage your account and organization.</li>
        <li>To respond to your comments, questions, and requests.</li>
        <li>To send you technical notices, updates, and support messages.</li>
        <li>To monitor and analyze trends, usage, and activities.</li>
      </ul>
      <h2 className="text-base font-semibold text-slate-900 dark:text-white pt-2">3. Data Security</h2>
      <p>
        We use administrative, technical, and physical safeguards to protect your personal information. Access to your data is
        restricted to authorized personnel only.
      </p>
      <h2 className="text-base font-semibold text-slate-900 dark:text-white pt-2">4. Data Sharing</h2>
      <p>
        We do not sell your personal information. We may share data with trusted service providers who assist us in operating our
        platform, subject to confidentiality obligations.
      </p>
      <h2 className="text-base font-semibold text-slate-900 dark:text-white pt-2">5. Your Rights</h2>
      <p>
        You may access, correct, or delete your personal information at any time. Contact us at suhailrao@gmail.com for any
        privacy-related requests.
      </p>
      <h2 className="text-base font-semibold text-slate-900 dark:text-white pt-2">6. Contact Us</h2>
      <p>
        If you have questions about this Privacy Policy, contact us at suhailrao@gmail.com or write to LG_80, Street 1, DRGCC,
        Phase 6, DHA, Lahore, Pakistan.
      </p>
    </LegalPage>
  )
}
