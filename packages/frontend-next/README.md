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

## Docker deployment

From the repository root:

1. Copy `.env.docker.example` to `.env` and replace all placeholder secrets.
2. Run `docker compose up -d --build`.
3. Open the configured HTTPS domain through Nginx (ports 80/443). Configure the certificate mounts before starting the stack.

The frontend and backend have separate images and dependency installs. The
frontend accesses the API through its HTTP proxy and cannot directly access the
private database network. Rebuild only the frontend with:

```sh
docker compose up -d --build --no-deps frontend
```

See [service isolation](../../docs/service-isolation.md) for backend deployment,
network boundaries, configuration, and optional host monitoring.
