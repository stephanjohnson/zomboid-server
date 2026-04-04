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
# Copy environment file and configure
cp .env.example .env

# Start all services
make up

# Run database migrations
make db-migrate

# Seed initial admin user
make db-seed
```

### Local Development

```bash
cd src
npm install
npm run dev
```

The app will be available at `http://localhost:3000`.

### Commands

```bash
make up              # Start all services
make down            # Stop all services
make restart         # Restart all services
make logs            # View logs
make db-migrate      # Run Prisma migrations
make db-seed         # Seed database
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
