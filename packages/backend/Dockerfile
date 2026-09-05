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
    && apt-get install -y --no-install-recommends gnupg ca-certificates curl \
    && install -d /usr/share/postgresql-common/pgdg \
    && curl -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc --fail --silent --show-error https://www.postgresql.org/media/keys/ACCC4CF8.asc \
    && sh -c 'echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt bookworm-pgdg main" > /etc/apt/sources.list.d/pgdg.list' \
    && apt-get update \
    && apt-get install -y --no-install-recommends postgresql-client-16 \
    && rm -rf /var/lib/apt/lists/* \
    && pg_dump --version

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

