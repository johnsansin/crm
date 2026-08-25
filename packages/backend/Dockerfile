FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/backend/package.json packages/backend/package.json
COPY packages/frontend-next/package.json packages/frontend-next/package.json
RUN npm ci

COPY packages/backend packages/backend
RUN npm run db:generate --workspace @bizforce/backend \
    && npm run build --workspace @bizforce/backend

FROM node:22-bookworm-slim AS runner

ENV NODE_ENV=production \
    PORT=3000

RUN apt-get update \
    && apt-get install -y --no-install-recommends postgresql-client \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/packages/backend ./packages/backend

WORKDIR /app/packages/backend
RUN chmod +x docker-entrypoint.sh \
    && mkdir -p uploads private/backups \
    && chown -R node:node /app

USER node
EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]

