# BizForce Next.js frontend

This workspace is the compatibility-first Next.js App Router migration of the
existing Vite frontend. It deliberately imports the existing UI and business
logic so routes, authentication, API calls, styling, and role-based layouts stay
identical during the first migration phase.

## Commands

- `npm run dev --workspace @bizforce/frontend-next` — run on port 3001
- `npm run build --workspace @bizforce/frontend-next` — production build
- `npm run start --workspace @bizforce/frontend-next` — production server

The backend defaults to `http://127.0.0.1:3000`. Set `BACKEND_ORIGIN` if it is
hosted elsewhere. Keep the Vite frontend running in production until the Next.js
build has passed authenticated smoke tests for every role.
