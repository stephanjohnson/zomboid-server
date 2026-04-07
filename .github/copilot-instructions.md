# Copilot Instructions

## Project Overview

A full-stack TypeScript web dashboard for managing Project Zomboid dedicated servers. Provides a Vue 3 frontend, Nitro API backend, background job worker, and in-game Lua integration for server lifecycle management, mod management, backups, and economy/telemetry tracking.

## Commands

```bash
# Development
make dev              # Start infra (Docker) + Nuxt dev server on port 8000
make up               # Start all services via Docker Compose
make down             # Stop all services
make worker-dev       # Run worker in watch mode (tsx watch)

# Testing
make test             # Run all tests (unit + E2E)
make test-unit        # Run Vitest unit tests
make test-e2e         # Run Playwright E2E tests
cd src && npm test -- <filename>        # Run a single unit test file
cd src && npm run test:e2e -- <filename> # Run a single E2E test

# Code quality
make lint             # ESLint on src/
cd src && npm run lint:fix

# Database
make db-migrate       # Deploy Prisma migrations
make db-seed          # Seed database
make db-studio        # Open Prisma Studio GUI

# Build
make build            # Production build (Nuxt)
make install          # npm install for src/ and worker/
```

## Architecture

```
Internet → Caddy (TLS) → Nitro App (port 3000)
                              ↕ RCON
                         Game Server (PZ)
                              ↕
              PostgreSQL    RabbitMQ
                              ↓
                           Worker (job consumer)
```

**Components:**

| Directory | Tech | Role |
|-----------|------|------|
| `src/` | Nuxt 4 / Nitro / Vue 3 | Dashboard frontend + REST API |
| `worker/` | Node.js / amqplib | Background job processor (backups, restarts, updates) |
| `game-server/` | SteamCMD container | Project Zomboid dedicated server |
| `lua-bridge/` | Lua | In-game mod for telemetry & command I/O |
| `caddy/` | Caddy v2 | Reverse proxy + TLS termination |

**Infrastructure:** PostgreSQL 16, RabbitMQ 3.13, Docker Socket Proxy (tecnativa)

**Docker networks:** `zomboid-net` (public: game + app) / `backend-net` (internal: db, queue, proxy)

## src/ Structure

```
src/
├── app/
│   ├── pages/           # Auto-routed pages
│   ├── components/
│   │   ├── ui/          # shadcn-vue wrappers (do not import reka-ui directly)
│   │   └── ...          # Feature components (mods/, store/, telemetry-studio/)
│   ├── composables/     # useXxx() Vue composables
│   ├── layouts/
│   └── middleware/      # Client-side route guards
├── server/
│   ├── api/             # Nitro API routes (file = route, method suffix: .get.ts, .post.ts)
│   ├── middleware/       # API auth + logging middleware
│   └── utils/           # db, queue, docker, rcon, logger, error-handler
├── shared/              # Types shared between client and server
├── prisma/              # Schema + migrations
└── tests/
    ├── unit/            # Vitest tests
    └── e2e/             # Playwright tests
```

## Key Conventions

### API Routes
- File name = route path; HTTP method is the file suffix: `server-status.get.ts`, `login.post.ts`
- Validate request bodies with Valibot: `readValidatedBody(event, v.parser(Schema))`
- Use `createError()` from h3 for error responses; centralized handler in `server/utils/error-handler.ts`
- Auth is enforced via `server/middleware/` — public routes must be explicitly listed

### Environment / Runtime Config
- All env vars are accessed through Nuxt runtime config via `useRuntimeConfig()`
- Config reads `NUXT_${NAME}` then `${NAME}` then a fallback — defined in `nuxt.config.ts`
- Server-only secrets go in `runtimeConfig` (private); client-safe values in `runtimeConfig.public`

### Background Jobs (Worker)
- API publishes a job message to RabbitMQ; worker consumes with `prefetch: 1` (one at a time)
- Job status flow: `QUEUED → RUNNING → COMPLETED | FAILED` (tracked in `Job` DB model)
- Each job type has its own file in `worker/src/jobs/`

### Lua Bridge (lua-bridge/)
- File-based IPC: the in-game mod writes telemetry JSON to an `inbox/` directory; the app reads it and writes commands to `outbox/`
- Non-blocking / poll-based on both sides

### UI Components
- Use shadcn-vue wrappers from `app/components/ui/` — **never import from reka-ui directly** (enforced by ESLint)
- Icons via `@nuxt/icon` (Lucide set)
- Notifications via `vue-sonner` toast

### Database
- ORM: Prisma v6 — always run `make db-migrate` after schema changes
- Enums: `UserRole` (ADMIN, MODERATOR, PLAYER), `JobStatus` (QUEUED, RUNNING, COMPLETED, FAILED)
- The app container runs migrations automatically on startup (via `entrypoint.sh`)

### Auth
- JWT stored in httpOnly cookie (7-day expiry) via `nuxt-auth-utils`
- Role-based access: ADMIN > MODERATOR > PLAYER
- `/admin/**` routes are CSR-only (see `nuxt.config.ts` route rules)

### TypeScript
- Strict mode enabled globally
- Validation: Valibot for API route bodies; Zod + vee-validate for forms
- Worker shares `prisma/schema.prisma` from `src/` (copied at build time)
