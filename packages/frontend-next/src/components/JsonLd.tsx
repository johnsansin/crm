interface JsonLdProps {
  data: Record<string, any>
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export function OrganizationJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'BizForce CRM',
    url: 'https://bizforce-crm.online',
    logo: 'https://bizforce-crm.online/bizforce-logo.svg',
    description: 'All-in-one CRM platform for growing businesses. Manage contacts, track sales, automate workflows, and grow your business.',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+92-345-4452741',
      contactType: 'customer service',
      email: 'sajjad@bizforce-crm.online',
      availableLanguage: 'English',
    },
    sameAs: [],
    address: {
      '@type': 'PostalAddress',
      streetAddress: '125-F1, Johar Town',
      addressLocality: 'Lahore',
      addressRegion: 'Punjab',
      postalCode: '54782',
      addressCountry: 'PK',
    },
    founder: {
      '@type': 'Person',
      name: 'Sajjad Hussain',
    },
    foundingDate: '2024',
    numberOfEmployees: {
      '@type': 'QuantitativeValue',
      minValue: 1,
      maxValue: 50,
    },
  }
  return <JsonLd data={data} />
}

export function WebsiteJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'BizForce CRM',
    url: 'https://bizforce-crm.online',
    description: 'All-in-one CRM platform for growing businesses with 24+ modules, AI assistant, and workflow automation.',
    publisher: {
      '@type': 'Organization',
      name: 'BizForce CRM',
      logo: 'https://bizforce-crm.online/bizforce-logo.svg',
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://bizforce-crm.online/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  }
  return <JsonLd data={data} />
}

export function ProductJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'BizForce CRM',
    operatingSystem: 'Web',
    applicationCategory: 'BusinessApplication',
    url: 'https://bizforce-crm.online',
    screenshot: 'https://bizforce-crm.online/og-image.png',
    description: 'All-in-one CRM platform with 24+ modules including sales pipeline, AI assistant, workflow automation, email campaigns, live chat, and real-time analytics.',
    featureList: [
      'AI Assistant',
      'Sales Pipeline Management',
      'Custom Dashboards',
      'Workflow Automation',
      'Email Campaigns',
      'Live Chat',
      'Calendar & Events',
      'SMS & Calls',
      'Documents & Quotes',
      'Reports & Analytics',
    ],
    offers: [
      {
        '@type': 'Offer',
        name: 'Starter',
        price: '0',
        priceCurrency: 'USD',
        description: 'For small teams getting started with CRM. Up to 3 users, 2,000 contacts.',
        availability: 'https://schema.org/InStock',
      },
      {
        '@type': 'Offer',
        name: 'Growth',
        price: '29',
        priceCurrency: 'USD',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '29',
          priceCurrency: 'USD',
          billingDuration: 'P1M',
        },
        description: 'For growing teams. Up to 20 users, 50,000 contacts, all CRM modules.',
        availability: 'https://schema.org/InStock',
      },
      {
        '@type': 'Offer',
        name: 'Enterprise',
        price: '0',
        priceCurrency: 'USD',
        description: 'Custom pricing for large organizations. Unlimited users and contacts.',
        availability: 'https://schema.org/InStock',
      },
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '150',
      bestRating: '5',
    },
    review: [
      {
        '@type': 'Review',
        reviewRating: { '@type': 'Rating', ratingValue: '5' },
        author: { '@type': 'Person', name: 'Sarah Mitchell' },
        reviewBody: 'BizForce transformed how our sales team operates. We closed 40% more deals in the first quarter.',
      },
      {
        '@type': 'Review',
        reviewRating: { '@type': 'Rating', ratingValue: '5' },
        author: { '@type': 'Person', name: 'James Rodriguez' },
        reviewBody: 'The automation features alone saved us 20 hours per week. Our team finally works on what matters.',
      },
      {
        '@type': 'Review',
        reviewRating: { '@type': 'Rating', ratingValue: '5' },
        author: { '@type': 'Person', name: 'Emily Chen' },
        reviewBody: 'Best CRM we have used. The multi-organization feature lets us manage all our subsidiaries from one place.',
      },
    ],
  }
  return <JsonLd data={data} />
}

export function LocalBusinessJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'BizForce CRM',
    image: 'https://bizforce-crm.online/bizforce-logo.svg',
    url: 'https://bizforce-crm.online',
    telephone: '+92-345-4452741',
    email: 'sajjad@bizforce-crm.online',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '125-F1, Johar Town',
      addressLocality: 'Lahore',
      addressRegion: 'Punjab',
      postalCode: '54782',
      addressCountry: 'PK',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 31.5204,
      longitude: 74.3587,
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '18:00',
    },
    priceRange: '$$',
    sameAs: [],
  }
  return <JsonLd data={data} />
}

export function FAQJsonLd({ faqs }: { faqs: Array<{ q: string; a: string }> }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  }
  return <JsonLd data={data} />
}

export function ContactPageJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contact BizForce CRM',
    url: 'https://bizforce-crm.online/contact',
    mainEntity: {
      '@type': 'Organization',
      name: 'BizForce CRM',
      email: 'sajjad@bizforce-crm.online',
      telephone: '+92-345-4452741',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '125-F1, Johar Town',
        addressLocality: 'Lahore',
        addressRegion: 'Punjab',
        postalCode: '54782',
        addressCountry: 'PK',
      },
    },
  }
  return <JsonLd data={data} />
}

export function BreadcrumbJsonLd({ items }: { items: Array<{ name: string; url: string }> }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }
  return <JsonLd data={data} />
}

export function WebPageJsonLd({ title, url, dateModified }: { title: string; url: string; dateModified: string }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    url,
    dateModified,
    isPartOf: {
      '@type': 'WebSite',
      name: 'BizForce CRM',
      url: 'https://bizforce-crm.online',
    },
  }
  return <JsonLd data={data} />
}

export function ArticleJsonLd({
  title,
  excerpt,
  date,
  author,
  authorRole,
  url,
  image,
}: {
  title: string
  excerpt: string
  date: string
  author: string
  authorRole: string
  url: string
  image?: string
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: excerpt,
    datePublished: date,
    dateModified: date,
    author: {
      '@type': 'Person',
      name: author,
      jobTitle: authorRole,
    },
    publisher: {
      '@type': 'Organization',
      name: 'BizForce CRM',
      url: 'https://bizforce-crm.online',
      logo: {
        '@type': 'ImageObject',
        url: 'https://bizforce-crm.online/bizforce-logo.svg',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    ...(image
      ? {
          image: {
            '@type': 'ImageObject',
            url: `https://bizforce-crm.online${image}`,
          },
        }
      : {}),
  }
  return <JsonLd data={data} />
}

export function ServiceJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'CRM Software',
    provider: {
      '@type': 'Organization',
      name: 'BizForce CRM',
      url: 'https://bizforce-crm.online',
    },
    areaServed: {
      '@type': 'Place',
      name: 'Worldwide',
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'BizForce CRM Plans',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Starter Plan',
            description: 'Free CRM for small teams. Up to 3 users.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Growth Plan',
            description: 'CRM for growing teams. Up to 20 users, all modules.',
          },
        },
      ],
    },
  }
  return <JsonLd data={data} />
}
