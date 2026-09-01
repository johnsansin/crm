import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/leads', '/contacts', '/potentials', '/tickets',
        '/accounts', '/campaigns', '/reports', '/settings', '/admin',
        '/calendar', '/chat', '/products', '/invoices', '/quotes',
        '/mailboxes', '/sms', '/tags', '/forecast', '/social',
        '/portal', '/superadmin', '/support-agent', '/profile',
        '/salesorders', '/purchaseorders', '/recurringinvoices',
        '/escalationhistory', '/rssfeeds', '/webhooks', '/org'],
    },
    sitemap: 'https://bizforce-crm.online/sitemap.xml',
  }
}
