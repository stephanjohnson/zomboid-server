-- CreateEnum
CREATE TYPE "TriggerSourceKind" AS ENUM ('EVENT', 'WORKFLOW');

-- CreateEnum
CREATE TYPE "WorkflowRunStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'EXPIRED');

-- AlterTable
ALTER TABLE "player_telemetry_events" ADD COLUMN "event_key" TEXT;

UPDATE "player_telemetry_events"
SET "event_key" = CASE "type"
	WHEN 'SESSION_STARTED' THEN 'pz.session.started'
	WHEN 'SESSION_ENDED' THEN 'pz.session.ended'
	WHEN 'PLAYER_DIED' THEN 'pz.player.died'
	WHEN 'ZOMBIE_KILL' THEN 'pz.zombie.kill'
	WHEN 'PVP_KILL' THEN 'pz.pvp.kill'
	WHEN 'SKILL_LEVEL_UP' THEN 'pz.skill.level_up'
	WHEN 'ITEM_FOUND' THEN 'pz.item.found'
	WHEN 'BUILD_ACTION' THEN 'pz.build.action'
	ELSE 'legacy.unknown'
END;

ALTER TABLE "player_telemetry_events" ALTER COLUMN "event_key" SET NOT NULL;
ALTER TABLE "player_telemetry_events" ALTER COLUMN "type" DROP NOT NULL;

-- AlterTable
ALTER TABLE "reward_grants" ADD COLUMN "action_rule_id" TEXT;

-- CreateTable
CREATE TABLE "telemetry_listeners" (
	"id" TEXT NOT NULL,
	"profile_id" TEXT NOT NULL,
	"adapter_key" TEXT NOT NULL,
	"name" TEXT NOT NULL,
	"event_key" TEXT,
	"is_enabled" BOOLEAN NOT NULL DEFAULT true,
	"config" JSONB,
	"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"updated_at" TIMESTAMP(3) NOT NULL,

	CONSTRAINT "telemetry_listeners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_definitions" (
	"id" TEXT NOT NULL,
	"profile_id" TEXT NOT NULL,
	"key" TEXT NOT NULL,
	"name" TEXT NOT NULL,
	"is_enabled" BOOLEAN NOT NULL DEFAULT true,
	"config" JSONB,
	"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"updated_at" TIMESTAMP(3) NOT NULL,

	CONSTRAINT "workflow_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_steps" (
	"id" TEXT NOT NULL,
	"workflow_id" TEXT NOT NULL,
	"step_order" INTEGER NOT NULL,
	"event_key" TEXT NOT NULL,
	"within_seconds" INTEGER,
	"match_config" JSONB,
	"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"updated_at" TIMESTAMP(3) NOT NULL,

	CONSTRAINT "workflow_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_runs" (
	"id" TEXT NOT NULL,
	"workflow_id" TEXT NOT NULL,
	"profile_id" TEXT NOT NULL,
	"player_id" TEXT,
	"status" "WorkflowRunStatus" NOT NULL DEFAULT 'ACTIVE',
	"current_step" INTEGER NOT NULL DEFAULT 0,
	"context" JSONB,
	"started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"last_matched_at" TIMESTAMP(3),
	"expires_at" TIMESTAMP(3),
	"completed_at" TIMESTAMP(3),
	"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"updated_at" TIMESTAMP(3) NOT NULL,

	CONSTRAINT "workflow_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_rules" (
	"id" TEXT NOT NULL,
	"profile_id" TEXT NOT NULL,
	"name" TEXT NOT NULL,
	"trigger_kind" "TriggerSourceKind" NOT NULL,
	"trigger_key" TEXT NOT NULL,
	"is_enabled" BOOLEAN NOT NULL DEFAULT true,
	"money_amount" INTEGER NOT NULL DEFAULT 0,
	"xp_amount" INTEGER NOT NULL DEFAULT 0,
	"xp_category" TEXT,
	"xp_category_amount" INTEGER NOT NULL DEFAULT 0,
	"config" JSONB,
	"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"updated_at" TIMESTAMP(3) NOT NULL,

	CONSTRAINT "action_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_xp_balances" (
	"id" TEXT NOT NULL,
	"player_id" TEXT NOT NULL,
	"total_xp" INTEGER NOT NULL DEFAULT 0,
	"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"updated_at" TIMESTAMP(3) NOT NULL,

	CONSTRAINT "player_xp_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_xp_category_balances" (
	"id" TEXT NOT NULL,
	"player_id" TEXT NOT NULL,
	"category" TEXT NOT NULL,
	"total_xp" INTEGER NOT NULL DEFAULT 0,
	"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"updated_at" TIMESTAMP(3) NOT NULL,

	CONSTRAINT "player_xp_category_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "xp_grants" (
	"id" TEXT NOT NULL,
	"profile_id" TEXT NOT NULL,
	"player_id" TEXT NOT NULL,
	"action_rule_id" TEXT,
	"source_event_id" TEXT,
	"workflow_run_id" TEXT,
	"unique_key" TEXT,
	"category" TEXT,
	"amount" INTEGER NOT NULL,
	"reason" TEXT NOT NULL,
	"metadata" JSONB,
	"granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

	CONSTRAINT "xp_grants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "player_telemetry_events_profile_id_event_key_occurred_at_idx" ON "player_telemetry_events"("profile_id", "event_key", "occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "telemetry_listeners_profile_id_adapter_key_key" ON "telemetry_listeners"("profile_id", "adapter_key");

-- CreateIndex
CREATE INDEX "telemetry_listeners_profile_id_is_enabled_idx" ON "telemetry_listeners"("profile_id", "is_enabled");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_definitions_profile_id_key_key" ON "workflow_definitions"("profile_id", "key");

-- CreateIndex
CREATE INDEX "workflow_definitions_profile_id_is_enabled_idx" ON "workflow_definitions"("profile_id", "is_enabled");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_steps_workflow_id_step_order_key" ON "workflow_steps"("workflow_id", "step_order");

-- CreateIndex
CREATE INDEX "workflow_steps_workflow_id_event_key_idx" ON "workflow_steps"("workflow_id", "event_key");

-- CreateIndex
CREATE INDEX "workflow_runs_workflow_id_status_idx" ON "workflow_runs"("workflow_id", "status");

-- CreateIndex
CREATE INDEX "workflow_runs_profile_id_player_id_status_idx" ON "workflow_runs"("profile_id", "player_id", "status");

-- CreateIndex
CREATE INDEX "action_rules_profile_id_trigger_kind_trigger_key_is_enabled_idx" ON "action_rules"("profile_id", "trigger_kind", "trigger_key", "is_enabled");

-- CreateIndex
CREATE UNIQUE INDEX "player_xp_balances_player_id_key" ON "player_xp_balances"("player_id");

-- CreateIndex
CREATE UNIQUE INDEX "player_xp_category_balances_player_id_category_key" ON "player_xp_category_balances"("player_id", "category");

-- CreateIndex
CREATE INDEX "player_xp_category_balances_category_idx" ON "player_xp_category_balances"("category");

-- CreateIndex
CREATE UNIQUE INDEX "xp_grants_unique_key_key" ON "xp_grants"("unique_key");

-- CreateIndex
CREATE INDEX "xp_grants_profile_id_granted_at_idx" ON "xp_grants"("profile_id", "granted_at");

-- CreateIndex
CREATE INDEX "xp_grants_player_id_granted_at_idx" ON "xp_grants"("player_id", "granted_at");

-- CreateIndex
CREATE INDEX "xp_grants_player_id_category_granted_at_idx" ON "xp_grants"("player_id", "category", "granted_at");

-- AddForeignKey
ALTER TABLE "telemetry_listeners" ADD CONSTRAINT "telemetry_listeners_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "server_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_definitions" ADD CONSTRAINT "workflow_definitions_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "server_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_steps" ADD CONSTRAINT "workflow_steps_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "workflow_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_runs" ADD CONSTRAINT "workflow_runs_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "workflow_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_runs" ADD CONSTRAINT "workflow_runs_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "server_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_runs" ADD CONSTRAINT "workflow_runs_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "server_players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_rules" ADD CONSTRAINT "action_rules_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "server_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_xp_balances" ADD CONSTRAINT "player_xp_balances_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "server_players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_xp_category_balances" ADD CONSTRAINT "player_xp_category_balances_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "server_players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_grants" ADD CONSTRAINT "reward_grants_action_rule_id_fkey" FOREIGN KEY ("action_rule_id") REFERENCES "action_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xp_grants" ADD CONSTRAINT "xp_grants_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "server_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xp_grants" ADD CONSTRAINT "xp_grants_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "server_players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xp_grants" ADD CONSTRAINT "xp_grants_action_rule_id_fkey" FOREIGN KEY ("action_rule_id") REFERENCES "action_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xp_grants" ADD CONSTRAINT "xp_grants_source_event_id_fkey" FOREIGN KEY ("source_event_id") REFERENCES "player_telemetry_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xp_grants" ADD CONSTRAINT "xp_grants_workflow_run_id_fkey" FOREIGN KEY ("workflow_run_id") REFERENCES "workflow_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed default listeners for existing profiles
INSERT INTO "telemetry_listeners" ("id", "profile_id", "adapter_key", "name", "event_key", "is_enabled", "config", "created_at", "updated_at")
SELECT
	CONCAT(profile.id, '-listener-snapshot'),
	profile.id,
	'pz.player_snapshot',
	'Player snapshot polling',
	NULL,
	true,
	'{"snapshotIntervalMinutes":12,"inventoryIntervalMinutes":48,"gameStateIntervalMinutes":24,"refreshSeconds":60}'::jsonb,
	CURRENT_TIMESTAMP,
	CURRENT_TIMESTAMP
FROM "server_profiles" profile
WHERE NOT EXISTS (
	SELECT 1 FROM "telemetry_listeners" listener
	WHERE listener."profile_id" = profile.id AND listener."adapter_key" = 'pz.player_snapshot'
);

INSERT INTO "telemetry_listeners" ("id", "profile_id", "adapter_key", "name", "event_key", "is_enabled", "created_at", "updated_at")
SELECT CONCAT(profile.id, '-listener-pvp'), profile.id, 'pz.pvp_kill_tracker', 'PvP kill tracker', 'pz.pvp.kill', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "server_profiles" profile
WHERE NOT EXISTS (
	SELECT 1 FROM "telemetry_listeners" listener
	WHERE listener."profile_id" = profile.id AND listener."adapter_key" = 'pz.pvp_kill_tracker'
);

INSERT INTO "telemetry_listeners" ("id", "profile_id", "adapter_key", "name", "event_key", "is_enabled", "created_at", "updated_at")
SELECT CONCAT(profile.id, '-listener-item-found'), profile.id, 'pz.item_found', 'Item found events', 'pz.item.found', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "server_profiles" profile
WHERE NOT EXISTS (
	SELECT 1 FROM "telemetry_listeners" listener
	WHERE listener."profile_id" = profile.id AND listener."adapter_key" = 'pz.item_found'
);

INSERT INTO "telemetry_listeners" ("id", "profile_id", "adapter_key", "name", "event_key", "is_enabled", "config", "created_at", "updated_at")
SELECT
	CONCAT(profile.id, '-listener-build-action'),
	profile.id,
	'pz.build_action',
	'Build action events',
	'pz.build.action',
	true,
	'{"actions":["build"]}'::jsonb,
	CURRENT_TIMESTAMP,
	CURRENT_TIMESTAMP
FROM "server_profiles" profile
WHERE NOT EXISTS (
	SELECT 1 FROM "telemetry_listeners" listener
	WHERE listener."profile_id" = profile.id AND listener."adapter_key" = 'pz.build_action'
);
