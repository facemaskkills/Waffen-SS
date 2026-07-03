-- Migration: create afk_status table
-- Run this against your Railway Postgres instance (e.g. via `psql $DATABASE_URL -f afk-migration.sql`
-- or through whatever migration runner your project already uses).

CREATE TABLE IF NOT EXISTS afk_status (
  user_id     TEXT PRIMARY KEY,
  guild_id    TEXT NOT NULL,
  reason      TEXT NOT NULL DEFAULT 'AFK',
  since       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optional: speeds up lookups when checking many mentioned users at once
CREATE INDEX IF NOT EXISTS idx_afk_status_guild ON afk_status (guild_id);
