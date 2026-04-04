.PHONY: up down restart logs build test test-unit test-e2e db-migrate db-seed db-studio clean

# ---------------------------------------------------------------------------
# Docker Compose
# ---------------------------------------------------------------------------
up:
	docker compose up -d

down:
	docker compose down

restart:
	docker compose restart

logs:
	docker compose logs -f

build:
	docker compose build

# ---------------------------------------------------------------------------
# Database (Prisma)
# ---------------------------------------------------------------------------
db-migrate:
	docker compose exec nitro-app npx prisma migrate deploy

db-seed:
	docker compose exec nitro-app npx prisma db seed

db-studio:
	cd src && npx prisma studio

db-generate:
	cd src && npx prisma generate

db-push:
	cd src && npx prisma db push

# ---------------------------------------------------------------------------
# Development
# ---------------------------------------------------------------------------
dev:
	cd src && npm run dev

install:
	cd src && npm install
	cd worker && npm install

lint:
	cd src && npm run lint

# ---------------------------------------------------------------------------
# Testing
# ---------------------------------------------------------------------------
test: test-unit test-e2e

test-unit:
	cd src && npm test

test-e2e:
	cd src && npm run test:e2e

# ---------------------------------------------------------------------------
# Worker
# ---------------------------------------------------------------------------
worker-dev:
	cd worker && npm run dev

# ---------------------------------------------------------------------------
# Cleanup
# ---------------------------------------------------------------------------
clean:
	docker compose down -v --remove-orphans
