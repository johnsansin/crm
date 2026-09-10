# Content Security Policy

The Next.js proxy generates a cryptographically random nonce for each page response and passes the same policy into server rendering. Production script-src has no same-origin fallback; scripts require that nonce or trust from an already authorized script (`strict-dynamic`). Script attributes, inline style attributes, plugins, and base tags are blocked. Form submissions are limited to the same origin. Development alone permits `unsafe-eval` for Next.js tooling.

The root layout renders dynamically. HTML and RSC responses must not be shared through a CDN cache; the service worker also excludes them. This trades static page caching and offline HTML for fresh response nonces. Keep immutable static asset caching enabled.

Next.js applies nonces to its framework scripts. JSON-LD receives the nonce explicitly and escapes `<`. Analytics initialization runs in the application bundle. Radix's style injector receives the document nonce through `get-nonce`. Existing client-rendered React style properties use CSSOM assignments, which CSP permits; new server-rendered styles should use CSS classes, and new style elements require a nonce.

Deploy the frontend build and updated `deploy/nginx-ssl.conf` together. Nginx must forward the application's CSP without adding a second static policy. Do not use `proxy_hide_header Content-Security-Policy`. Remove the old permissive CSP from any active Nginx or CDN header rule, and purge previously cached HTML if applicable. The local host's active Nginx configuration already forwards the application header; the public domain was observed serving a separate deployment with the old policy.

Validation:

```sh
npm run typecheck -w packages/frontend-next
npm run build -w packages/frontend-next
node scripts/check-csp.mjs http://127.0.0.1:3001
```

Also inspect browser CSP errors on public pages and authenticated workflows when deploying. Verify parser-inserted scripts without a nonce, `eval()`, and injected style attributes are blocked. Scripts deliberately created by trusted application JavaScript can load under `strict-dynamic`.

Reference: https://nextjs.org/docs/app/guides/content-security-policy

Public contact email references were replaced with the existing contact form, including JSON-LD, metadata, the footer, and policy pages. Backend mail delivery and authenticated CRM contact emails are unchanged. The robots file remains public by design and now discourages crawling API and upload paths; it does not authorize access. The public contacts API returned 401 without authentication during verification. Cloudflare adds its own managed crawler rules at the public domain.
