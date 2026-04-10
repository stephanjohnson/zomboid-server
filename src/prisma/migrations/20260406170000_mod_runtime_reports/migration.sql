CREATE TABLE "mod_runtime_reports" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "server_name" TEXT NOT NULL,
    "reason" TEXT,
    "active_mod_ids" JSONB NOT NULL,
    "active_workshop_ids" JSONB,
    "reported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mod_runtime_reports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "mod_runtime_reports_profile_id_reported_at_idx" ON "mod_runtime_reports"("profile_id", "reported_at");

ALTER TABLE "mod_runtime_reports"
ADD CONSTRAINT "mod_runtime_reports_profile_id_fkey"
FOREIGN KEY ("profile_id") REFERENCES "server_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;