FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/backend/package.json packages/backend/package.json
COPY packages/frontend-next/package.json packages/frontend-next/package.json
RUN npm ci

COPY packages/frontend-next packages/frontend-next

ARG BACKEND_ORIGIN=http://backend:3000
ARG NEXT_PUBLIC_GA4_MEASUREMENT_ID=
ENV BACKEND_ORIGIN=$BACKEND_ORIGIN \
    NEXT_PUBLIC_GA4_MEASUREMENT_ID=$NEXT_PUBLIC_GA4_MEASUREMENT_ID \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build --workspace @bizforce/frontend-next

FROM node:22-bookworm-slim AS runner

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3001

WORKDIR /app

RUN chown node:node /app
COPY --from=builder --chown=node:node /app/packages/frontend-next/.next/standalone ./
COPY --from=builder --chown=node:node /app/packages/frontend-next/.next/static ./packages/frontend-next/.next/static
COPY --from=builder --chown=node:node /app/packages/frontend-next/public ./packages/frontend-next/public

USER node
EXPOSE 3001

CMD ["node", "packages/frontend-next/server.js"]

