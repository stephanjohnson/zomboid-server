# Zomboid Server Manager

A web-based management dashboard for Project Zomboid dedicated servers, built with **Nuxt 4**, **Nitro/h3**, **PostgreSQL**, and **RabbitMQ**.

## Architecture

| Service | Technology | Purpose |
|---------|-----------|---------|
| **Web App** | Nuxt 4 (Nitro) | Dashboard UI + REST API |
| **Worker** | Node.js + amqplib | Background jobs (backups, updates, restarts) |
| **Database** | PostgreSQL 16 | Persistent application data |
| **Queue** | RabbitMQ | Job queuing with delivery guarantees |
| **Game Server** | SteamCMD | Project Zomboid dedicated server |
| **Reverse Proxy** | Caddy | TLS termination and routing |
| **Docker Proxy** | tecnativa/docker-socket-proxy | Restricted Docker API access |

## Quick Start

### Prerequisites

- Docker and Docker Compose v2
- Node.js 20+ (for local development)
- npm 10+

### Start the Stack

```bash
# Start all services and infrastructure
make up
```

If `.env` does not exist yet, `make up` will create it from `.env.example` automatically.

Then open `http://localhost:3000` and complete the first-run onboarding flow. The app will initialize the database schema, create the first admin account, and seed the default active server profile.

### Local Development

```bash
make dev
```

On a fresh install, `make dev` will also create `.env` from `.env.example` if needed. The first browser visit will redirect into onboarding and handle the one-time database setup there.

Local host-based development uses [src/.env.development](src/.env.development) for localhost service overrides. Prisma CLI now reads its configuration from [src/prisma.config.ts](src/prisma.config.ts), so production-style startup no longer picks up development-only database settings.

The app will be available at `http://localhost:3000`.

### Commands

```bash
make up              # Start all services only
make down            # Stop all services
make restart         # Restart all services
make logs            # View logs
make clean           # Stop services and remove compose-managed volumes
make nuke            # Destroy all Docker project data and remove .env
make db-migrate      # Run Prisma migrations manually
make db-seed         # Seed database manually
make db-studio       # Open Prisma Studio
make build           # Build for production
make test            # Run all tests
make test-unit       # Run unit tests
make test-e2e        # Run E2E tests
```

## Project Structure

```
├── docker-compose.yml      # Service orchestration
├── Makefile                 # Developer commands
├── .env.example             # Environment template
├── .github/workflows/       # CI/CD pipelines
├── game-server/             # PZ game server container
├── worker/                  # Background job processor
├── caddy/                   # Reverse proxy config
├── lua-bridge/              # Lua mod for in-game integration
├── docs/                    # Architecture documentation
└── src/                     # Nuxt 4 application
    ├── nuxt.config.ts
    ├── prisma/              # Database schema & migrations
    ├── app/                 # Frontend (pages, components, composables)
    └── server/              # Nitro API (routes, middleware, utils)
```

## Features

- **Server Lifecycle**: Start, stop, restart with graceful warnings
- **Multi-Profile Support**: Multiple server configurations with isolated data
- **Configuration Editor**: Edit server.ini and SandboxVars.lua via UI
- **Mod Management**: Add, remove, and reorder Steam Workshop mods
- **Backup System**: Automated backups with restore capability
- **Player Management**: RCON-powered kick, ban, teleport, items, XP
- **Real-time Dashboard**: Server status, metrics, and player list
- **Role-based Access**: Admin, moderator, and player roles
- **Audit Logging**: Track all administrative actions
- **Lua Bridge**: In-game economy and telemetry integration

## License

MIT
