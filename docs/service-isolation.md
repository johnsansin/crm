# Frontend and backend isolation

Both applications remain in this repository, with separate packages, dependencies,
builds, processes, and Docker images. They communicate over HTTP; the frontend
has no database credentials, backend source code, or access to backend volumes.

| Application | Source | Build | Start |
| --- | --- | --- | --- |
| Frontend | `packages/frontend-next` | `npm run build:frontend` | `npm run start:frontend` |
| Backend | `packages/backend` | `npm run build:backend` | `npm run start:backend` |

Use Node.js 22 or newer. Local workspace development can use one root `npm ci`.
The Dockerfiles install only the selected application's workspace dependencies
with `--include-workspace-root=false`. The shared lockfile keeps versions reproducible.

The frontend uses `BACKEND_ORIGIN` when building to configure its `/api` and
`/uploads` proxy. On different servers, set that to the backend's reachable URL,
rebuild the frontend, and restrict backend ingress to the proxy/frontend hosts.
Browser traffic stays on the frontend origin. Database URLs, JWT signing secrets,
and mail credentials belong only in backend configuration.

Compose networks:

- `web`: Nginx, frontend, and certificate renewal.
- `api`: Nginx, frontend, and backend.
- `database`: backend and PostgreSQL only; this network is internal.

Only Nginx publishes host ports (80 and 443). The frontend can start without a
running backend; public pages remain available, while API operations require the
backend. PostgreSQL and uploaded/private files use backend-owned volumes.

After the initial stack setup, rebuild/recreate either application independently:

```sh
docker compose up -d --build --no-deps frontend
docker compose up -d --build --no-deps backend
```

The backend's existing entrypoint synchronizes the database schema on startup.
Review schema changes and backups before restarting it. These commands do not
recreate PostgreSQL or delete volumes.

Host filesystem, host process, and Docker socket mounts are excluded by default.
System Health therefore reports container-visible metrics. Existing host-wide
monitoring is available through an explicit override, which weakens isolation:

```sh
docker compose -f compose.yaml -f deploy/compose.host-monitoring.yaml up -d
```

Set `DOCKER_SOCKET_GID` to the host's Docker socket group if enabling that override.
A read-only socket mount does not make Docker API access read-only.

These definitions must be applied on a Docker host to change runtime networks.
The current PM2 services are separate processes running as the same OS user;
editing Compose does not make those processes container-isolated.

References: [npm workspace installs](https://docs.npmjs.com/cli/v10/commands/npm-ci/),
[Docker Compose networking](https://docs.docker.com/compose/how-tos/networking/).
