// src/services/afkService.js
//
// Uses your project's REAL database layer (pgDb from utils/postgresDatabase.js)
// and the REAL afk_status table your bot already auto-creates on startup
// (columns: guild_id, user_id, reason, status_at, expires_at).
//
// AFK is scoped PER GUILD here (matching your table's composite primary key
// of guild_id + user_id) — so the same user can have independent AFK status
// in different servers.

import { pgDb } from '../utils/postgresDatabase.js';
import { botConfig } from '../config/bot.js';

const TABLE = 'afk_status';

/**
 * Marks a user as AFK in a specific guild.
 */
export async function setAfk(guildId, userId, reason = botConfig.afk.defaultReason) {
  const trimmedReason = reason.slice(0, botConfig.afk.maxReasonLength);

  if (!pgDb.isAvailable()) return null;

  // Ensure guild/user rows exist first (your schema has foreign keys to
  // guilds/users tables) — mirrors the pattern used elsewhere in
  // postgresDatabase.js (see setStructuredData's 'afk_status' case).
  await pgDb.pool.query(
    `INSERT INTO guilds (id, created_at) VALUES ($1, CURRENT_TIMESTAMP) ON CONFLICT (id) DO NOTHING`,
    [guildId],
  );
  await pgDb.pool.query(
    `INSERT INTO users (id, created_at) VALUES ($1, CURRENT_TIMESTAMP) ON CONFLICT (id) DO NOTHING`,
    [userId],
  );

  await pgDb.pool.query(
    `INSERT INTO ${TABLE} (guild_id, user_id, reason, status_at)
     VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
     ON CONFLICT (guild_id, user_id)
     DO UPDATE SET reason = EXCLUDED.reason, status_at = CURRENT_TIMESTAMP`,
    [guildId, userId, trimmedReason],
  );

  return { guildId, userId, reason: trimmedReason };
}

/**
 * Returns the AFK row for a user in a specific guild, or null if not AFK.
 */
export async function getAfk(guildId, userId) {
  if (!pgDb.isAvailable()) return null;

  const { rows } = await pgDb.pool.query(
    `SELECT guild_id, user_id, reason, status_at, expires_at FROM ${TABLE} WHERE guild_id = $1 AND user_id = $2`,
    [guildId, userId],
  );
  return rows[0] ?? null;
}

/**
 * Clears AFK status for a user in a guild. Returns the deleted row, or
 * null if they weren't AFK to begin with.
 */
export async function clearAfk(guildId, userId) {
  if (!pgDb.isAvailable()) return null;

  const { rows } = await pgDb.pool.query(
    `DELETE FROM ${TABLE} WHERE guild_id = $1 AND user_id = $2 RETURNING guild_id, user_id, reason`,
    [guildId, userId],
  );
  return rows[0] ?? null;
}

/**
 * Batch-checks a list of user IDs within a guild and returns only the
 * ones who are currently AFK.
 */
export async function getAfkBulk(guildId, userIds) {
  if (!pgDb.isAvailable() || !userIds.length) return [];

  const { rows } = await pgDb.pool.query(
    `SELECT guild_id, user_id, reason FROM ${TABLE} WHERE guild_id = $1 AND user_id = ANY($2::text[])`,
    [guildId, userIds],
  );
  return rows;
}
