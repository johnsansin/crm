# BizForce Next.js frontend

This is the sole BizForce web frontend. It runs through the Next.js App Router
and contains all CRM pages, components, hooks, client state, and public assets.

Routing is implemented with native `app/` pages and nested layouts. Public,
CRM, super-admin, and support-agent areas each use their own App Router layout;
there is no React Router SPA or catch-all runtime.

## Commands

- `npm run dev --workspace @bizforce/frontend-next` — run on port 3001
- `npm run build --workspace @bizforce/frontend-next` — production build
- `npm run start --workspace @bizforce/frontend-next` — production server

The backend defaults to `http://127.0.0.1:3000`. Set `BACKEND_ORIGIN` when the
API is hosted elsewhere. Browser API requests use the same-origin `/api` proxy
unless `NEXT_PUBLIC_API_BASE` is configured.
