ALTER TABLE "server_profiles"
ADD COLUMN "automation_state" JSONB;

ALTER TABLE "server_players"
ADD COLUMN "automation_state" JSONB;