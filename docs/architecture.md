# Architecture

## Overview

The Zomboid Server Manager is a full-stack web application for managing Project Zomboid dedicated servers. It provides a dashboard UI, REST API, background job processing, and in-game integration via a custom Lua mod.

## Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Internet                              │
└──────────┬──────────────────────────┬───────────────────────┘
           │                          │
    ┌──────▼──────┐          ┌────────▼────────┐
    │    Caddy    │          │  Game Server    │
    │  (TLS/443) │          │  (UDP 16261-2)  │
    └──────┬──────┘          └────────┬────────┘
           │                          │
    ┌──────▼──────────────────────────▼────────┐
    │              zomboid-net                   │
    │                                           │
    │  ┌────────────┐      ┌──────────────┐    │
    │  │  Nitro App │◄────►│  Game Server │    │
    │  │  (Port 3000)│ RCON │  (Container) │    │
    │  └──────┬─────┘      └──────────────┘    │
    └─────────┼────────────────────────────────┘
              │
    ┌─────────▼────────────────────────────────┐
    │              backend-net (internal)        │
    │                                           │
    │  ┌──────────┐  ┌───────────┐  ┌───────┐ │
    │  │ PostgreSQL│  │ RabbitMQ  │  │Docker │ │
    │  │  (5432)   │  │  (5672)   │  │Proxy  │ │
    │  └──────────┘  └─────┬─────┘  └───────┘ │
    │                       │                   │
    │                ┌──────▼──────┐            │
    │                │   Worker    │            │
    │                │  (Consumer) │            │
    │                └─────────────┘            │
    └───────────────────────────────────────────┘
```

## Data Flow

### API Request Flow
1. Client → Caddy (TLS termination) → Nitro App
2. Nitro validates JWT from cookie/header
3. Route handler processes request
4. Database queries via Prisma ORM
5. Response returned to client

### Server Control Flow
1. Dashboard sends POST to `/api/zomboid/start|stop|restart`
2. Nitro uses Docker Socket Proxy to manage game container
3. RCON commands sent for graceful operations (save, broadcast)
4. Audit log written to database

### Background Job Flow
1. API publishes job to RabbitMQ queue
2. Worker consumes message, updates job status in DB
3. Worker executes task (backup, restore, update)
4. Job status updated to COMPLETED or FAILED
5. Message acknowledged

### Lua Bridge Flow
1. Lua mod writes telemetry JSON to `lua-bridge/<profile>/inbox/`
2. Nitro periodically reads inbox files
3. Nitro writes command JSON to `lua-bridge/<profile>/outbox/`
4. Lua mod reads and executes commands, writes acknowledgements

## Database Schema

### Core Tables
- **users** — Authentication and authorization
- **sessions** — JWT session tracking
- **server_profiles** — Multiple server configurations
- **game_settings** — Key-value game settings
- **mods** — Workshop mod management per profile
- **backups** — Backup file records
- **jobs** — Background job tracking
- **audit_logs** — Administrative action logging
- **whitelist** — Player access control
- **scheduled_tasks** — Cron-based automated tasks

## API Endpoints

### Authentication
- `POST /api/auth/login` — Login with username/password
- `POST /api/auth/logout` — Clear session
- `GET /api/auth/me` — Current user info

### Server Control
- `GET /api/zomboid/status` — Container + RCON status
- `POST /api/zomboid/start` — Start game server
- `POST /api/zomboid/stop` — Stop (with optional countdown)
- `POST /api/zomboid/restart` — Restart (with optional countdown)
- `GET /api/zomboid/logs` — Container logs
- `POST /api/zomboid/broadcast` — Send in-game message

### Profiles
- `GET /api/profiles` — List all profiles
- `POST /api/profiles` — Create profile
- `GET /api/profiles/:profileId` — Get profile details
- `PUT /api/profiles/:profileId` — Update profile
- `DELETE /api/profiles/:profileId` — Delete profile

### Configuration
- `GET /api/config/server-ini` — Read server.ini
- `PUT /api/config/server-ini` — Update server.ini
- `GET /api/config/sandbox-vars` — Read SandboxVars.lua
- `PUT /api/config/sandbox-vars` — Update SandboxVars.lua

### Mods
- `GET /api/mods` — List mods
- `POST /api/mods` — Add mod
- `DELETE /api/mods/:modId` — Remove mod
- `PUT /api/mods/reorder` — Reorder mods

### Backups
- `GET /api/backups` — List backups
- `POST /api/backups/create` — Queue backup job
- `POST /api/backups/:backupId/restore` — Queue restore job

### Players
- `GET /api/players` — List online players (RCON)
- `POST /api/players/:playerId/kick` — Kick player
- `POST /api/players/:playerId/ban` — Ban player
- `POST /api/players/:playerId/teleport` — Teleport player
- `POST /api/players/:playerId/items` — Give item to player

### System
- `GET /api/health` — Health check
- `GET /api/onboarding/status` — Setup status
- `POST /api/onboarding/complete` — First-run setup and schema initialization

## Security

- **JWT authentication** via httpOnly cookies (7-day expiry)
- **Role-based access control**: Admin, Moderator, Player
- **RCON isolated** to Docker network only (not published to host)
- **Docker Socket Proxy** restricts API to container management only
- **Audit logging** on all admin actions
- **Backend network** is internal (DB, queue, proxy never exposed)
- **Input validation** via Valibot schemas on all endpoints

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20 |
| Framework | Nuxt 4 / Nitro |
| Frontend | Vue 3, Tailwind CSS, shadcn-vue |
| Database | PostgreSQL 16 |
| ORM | Prisma |
| Queue | RabbitMQ 3.13 |
| Auth | JWT via jose |
| Validation | Valibot |
| Game Control | RCON (rcon-client), Docker (dockerode) |
| Logging | Pino |
| Testing | Vitest, Playwright |
| CI/CD | GitHub Actions |
