CREATE TABLE "automation_action_executions" (
  "id" TEXT NOT NULL,
  "profile_id" TEXT NOT NULL,
  "player_id" TEXT NOT NULL,
  "action_rule_id" TEXT NOT NULL,
  "source_event_id" TEXT,
  "workflow_run_id" TEXT,
  "effect_type" TEXT NOT NULL,
  "unique_key" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "reason" TEXT NOT NULL,
  "metadata" JSONB,
  "error" TEXT,
  "queued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "executed_at" TIMESTAMP(3),
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "automation_action_executions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "automation_action_executions_unique_key_key" ON "automation_action_executions"("unique_key");
CREATE INDEX "automation_action_executions_profile_id_status_queued_at_idx" ON "automation_action_executions"("profile_id", "status", "queued_at");
CREATE INDEX "automation_action_executions_player_id_status_queued_at_idx" ON "automation_action_executions"("player_id", "status", "queued_at");

ALTER TABLE "automation_action_executions"
ADD CONSTRAINT "automation_action_executions_profile_id_fkey"
FOREIGN KEY ("profile_id") REFERENCES "server_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "automation_action_executions"
ADD CONSTRAINT "automation_action_executions_player_id_fkey"
FOREIGN KEY ("player_id") REFERENCES "server_players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "automation_action_executions"
ADD CONSTRAINT "automation_action_executions_action_rule_id_fkey"
FOREIGN KEY ("action_rule_id") REFERENCES "action_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "automation_action_executions"
ADD CONSTRAINT "automation_action_executions_source_event_id_fkey"
FOREIGN KEY ("source_event_id") REFERENCES "player_telemetry_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "automation_action_executions"
ADD CONSTRAINT "automation_action_executions_workflow_run_id_fkey"
FOREIGN KEY ("workflow_run_id") REFERENCES "workflow_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;