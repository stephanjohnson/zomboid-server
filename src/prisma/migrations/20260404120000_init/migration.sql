-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MODERATOR', 'PLAYER');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('BACKUP', 'RESTORE', 'RESTART', 'UPDATE', 'WIPE', 'STOP');

-- CreateEnum
CREATE TYPE "TelemetryEventType" AS ENUM ('SESSION_STARTED', 'SESSION_ENDED', 'PLAYER_DIED', 'ZOMBIE_KILL', 'PVP_KILL', 'SKILL_LEVEL_UP', 'ITEM_FOUND', 'BUILD_ACTION');

-- CreateEnum
CREATE TYPE "RewardTriggerType" AS ENUM ('ZOMBIE_KILL', 'PVP_KILL', 'SKILL_LEVEL_UP', 'ITEM_FOUND', 'BUILD_ACTION');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'PLAYER',
    "steam_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "server_profiles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "servername" TEXT NOT NULL DEFAULT 'servertest',
    "game_port" INTEGER NOT NULL DEFAULT 16261,
    "direct_port" INTEGER NOT NULL DEFAULT 16262,
    "rcon_port" INTEGER NOT NULL DEFAULT 27015,
    "map_name" TEXT NOT NULL DEFAULT 'Muldraugh, KY',
    "max_players" INTEGER NOT NULL DEFAULT 16,
    "pvp" BOOLEAN NOT NULL DEFAULT true,
    "difficulty" TEXT NOT NULL DEFAULT 'Normal',
    "server_ini_overrides" JSONB,
    "sandbox_vars_overrides" JSONB,
    "last_game_state" JSONB,
    "last_telemetry_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "server_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_settings" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'string',

    CONSTRAINT "game_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mods" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "workshop_id" TEXT NOT NULL,
    "mod_name" TEXT NOT NULL,
    "display_name" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "backups" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "size_bytes" BIGINT NOT NULL,
    "game_version" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "backups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "type" "JobType" NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "profile_id" TEXT,
    "payload" JSONB,
    "result" JSONB,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "action" TEXT NOT NULL,
    "target" TEXT,
    "details" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whitelist" (
    "id" TEXT NOT NULL,
    "steam_id" TEXT NOT NULL,
    "username" TEXT,
    "added_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whitelist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_tasks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "cron" TEXT NOT NULL,
    "payload" JSONB,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "server_players" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "steam_id" TEXT,
    "display_name" TEXT,
    "is_online" BOOLEAN NOT NULL DEFAULT false,
    "is_dead" BOOLEAN NOT NULL DEFAULT false,
    "is_ghost" BOOLEAN NOT NULL DEFAULT false,
    "x" DOUBLE PRECISION,
    "y" DOUBLE PRECISION,
    "z" INTEGER,
    "zombie_kills" INTEGER NOT NULL DEFAULT 0,
    "player_kills" INTEGER NOT NULL DEFAULT 0,
    "hours_survived" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "profession" TEXT,
    "skills" JSONB,
    "inventory" JSONB,
    "first_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_telemetry_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "server_players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_snapshots" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "captured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_online" BOOLEAN NOT NULL DEFAULT true,
    "is_dead" BOOLEAN NOT NULL DEFAULT false,
    "is_ghost" BOOLEAN NOT NULL DEFAULT false,
    "x" DOUBLE PRECISION,
    "y" DOUBLE PRECISION,
    "z" INTEGER,
    "zombie_kills" INTEGER NOT NULL DEFAULT 0,
    "player_kills" INTEGER NOT NULL DEFAULT 0,
    "hours_survived" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "profession" TEXT,
    "skills" JSONB,
    "inventory" JSONB,
    "raw" JSONB,

    CONSTRAINT "player_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_telemetry_events" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "player_id" TEXT,
    "type" "TelemetryEventType" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'lua_mod',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "player_telemetry_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reward_rules" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger_type" "RewardTriggerType" NOT NULL,
    "reward_amount" INTEGER NOT NULL DEFAULT 0,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "trigger_config" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reward_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_wallets" (
    "id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "total_earned" INTEGER NOT NULL DEFAULT 0,
    "total_spent" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reward_grants" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "rule_id" TEXT,
    "source_event_id" TEXT,
    "unique_key" TEXT,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "metadata" JSONB,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reward_grants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_steam_id_key" ON "users"("steam_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_token_idx" ON "sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "server_profiles_name_key" ON "server_profiles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "game_settings_category_key_key" ON "game_settings"("category", "key");

-- CreateIndex
CREATE UNIQUE INDEX "mods_profile_id_workshop_id_key" ON "mods"("profile_id", "workshop_id");

-- CreateIndex
CREATE INDEX "jobs_status_idx" ON "jobs"("status");

-- CreateIndex
CREATE INDEX "jobs_type_idx" ON "jobs"("type");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "whitelist_steam_id_key" ON "whitelist"("steam_id");

-- CreateIndex
CREATE INDEX "server_players_profile_id_is_online_idx" ON "server_players"("profile_id", "is_online");

-- CreateIndex
CREATE UNIQUE INDEX "server_players_profile_id_username_key" ON "server_players"("profile_id", "username");

-- CreateIndex
CREATE INDEX "player_snapshots_profile_id_captured_at_idx" ON "player_snapshots"("profile_id", "captured_at");

-- CreateIndex
CREATE INDEX "player_snapshots_player_id_captured_at_idx" ON "player_snapshots"("player_id", "captured_at");

-- CreateIndex
CREATE INDEX "player_telemetry_events_profile_id_type_occurred_at_idx" ON "player_telemetry_events"("profile_id", "type", "occurred_at");

-- CreateIndex
CREATE INDEX "player_telemetry_events_player_id_occurred_at_idx" ON "player_telemetry_events"("player_id", "occurred_at");

-- CreateIndex
CREATE INDEX "reward_rules_profile_id_trigger_type_is_enabled_idx" ON "reward_rules"("profile_id", "trigger_type", "is_enabled");

-- CreateIndex
CREATE UNIQUE INDEX "player_wallets_player_id_key" ON "player_wallets"("player_id");

-- CreateIndex
CREATE UNIQUE INDEX "reward_grants_unique_key_key" ON "reward_grants"("unique_key");

-- CreateIndex
CREATE INDEX "reward_grants_profile_id_granted_at_idx" ON "reward_grants"("profile_id", "granted_at");

-- CreateIndex
CREATE INDEX "reward_grants_player_id_granted_at_idx" ON "reward_grants"("player_id", "granted_at");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mods" ADD CONSTRAINT "mods_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "server_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backups" ADD CONSTRAINT "backups_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "server_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "server_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "server_players" ADD CONSTRAINT "server_players_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "server_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_snapshots" ADD CONSTRAINT "player_snapshots_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "server_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_snapshots" ADD CONSTRAINT "player_snapshots_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "server_players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_telemetry_events" ADD CONSTRAINT "player_telemetry_events_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "server_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_telemetry_events" ADD CONSTRAINT "player_telemetry_events_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "server_players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_rules" ADD CONSTRAINT "reward_rules_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "server_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_wallets" ADD CONSTRAINT "player_wallets_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "server_players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_grants" ADD CONSTRAINT "reward_grants_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "server_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_grants" ADD CONSTRAINT "reward_grants_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "server_players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_grants" ADD CONSTRAINT "reward_grants_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "reward_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_grants" ADD CONSTRAINT "reward_grants_source_event_id_fkey" FOREIGN KEY ("source_event_id") REFERENCES "player_telemetry_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;