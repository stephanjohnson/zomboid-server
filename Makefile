.PHONY: up down restart logs build test test-unit test-e2e db-migrate db-seed db-studio clean nuke

COMPOSE := docker compose
DEV_COMPOSE := docker compose -f docker-compose.yml -f docker-compose.dev.yml
VOLUMES := pzm-server-files pzm-data pzm-postgres pzm-rabbitmq pzm-backups pzm-lua-bridge pzm-caddy-data pzm-caddy-config

ensure-env:
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "Created .env from .env.example"; \
	fi

# ---------------------------------------------------------------------------
# Docker Compose
# ---------------------------------------------------------------------------
up: ensure-env
	$(COMPOSE) up -d

down:
	$(COMPOSE) down

restart:
	$(COMPOSE) restart

logs:
	$(COMPOSE) logs -f

build: ensure-env
	$(COMPOSE) build

# ---------------------------------------------------------------------------
# Database (Prisma)
# ---------------------------------------------------------------------------
db-migrate:
	$(COMPOSE) exec nitro-app npx prisma migrate deploy

db-seed:
	$(COMPOSE) exec nitro-app npx prisma db seed

db-studio:
	cd src && npx prisma studio

db-generate:
	cd src && npx prisma generate

db-push:
	cd src && npx prisma db push

# ---------------------------------------------------------------------------
# Development
# ---------------------------------------------------------------------------
dev-infra: ensure-env
	$(DEV_COMPOSE) up -d --wait db rabbitmq docker-socket-proxy

dev-infra-down:
	$(DEV_COMPOSE) down

dev: dev-infra
	cd src && npm run db:migrate && npm run db:generate && \
	( while ! curl -s -o /dev/null http://localhost:3000; do sleep 1; done && xdg-open http://localhost:3000 & ) && \
	npm run dev

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
	$(COMPOSE) down -v --remove-orphans

nuke:
	@echo "WARNING: This will destroy all Docker-managed project data and remove the local .env file."
	@echo "This includes the database, backups, RabbitMQ state, Caddy data, server data, and bridge data."
	@echo "Type NUKE_ALL and press Enter to continue:"
	@read confirm; \
	if [ "$$confirm" != "NUKE_ALL" ]; then \
		echo "Cancelled."; \
		exit 1; \
	fi
	$(DEV_COMPOSE) down -v --remove-orphans 2>/dev/null || true
	$(COMPOSE) down -v --remove-orphans
	@for vol in $(VOLUMES); do \
		docker volume rm $$vol 2>/dev/null || true; \
	done
	@REMAINING=$$(docker volume ls -q --filter name='^pzm-' 2>/dev/null); \
	if [ -n "$$REMAINING" ]; then \
		echo "Removing leftover volumes: $$REMAINING"; \
		echo "$$REMAINING" | xargs docker volume rm 2>/dev/null || true; \
	fi
	@rm -f .env
	@echo "Nuke complete. Run 'make up' or 'make dev' to start fresh."
