// src/services/afkService.js
//
// Thin data-access layer for the AFK system. Assumes your project already
// has a shared Postgres pool/client exported from somewhere like
// `src/database/pool.js`. Adjust the import below to match your actual
// database module (this template assumes a `pg` Pool with a `.query()` method,
// which is the standard pattern for Railway Postgres + node-postgres).

import { pool } from '../database/pool.js'; // <-- adjust path to your real pool
import { botConfig } from '../config/bot.js';

const TABLE = botConfig.afk.tableName;

/**
 * Marks a user as AFK, or updates their existing AFK reason.
 */
export async function setAfk(userId, guildId, reason = botConfig.afk.defaultReason) {
  const trimmedReason = reason.slice(0, botConfig.afk.maxReasonLength);

  await pool.query(
    `INSERT INTO ${TABLE} (user_id, guild_id, reason, since)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (user_id)
     DO UPDATE SET reason = EXCLUDED.reason, guild_id = EXCLUDED.guild_id, since = NOW()`,
    [userId, guildId, trimmedReason],
  );

  return { userId, guildId, reason: trimmedReason };
}

/**
 * Returns the AFK row for a user, or null if they are not AFK.
 */
export async function getAfk(userId) {
  const { rows } = await pool.query(
    `SELECT user_id, guild_id, reason, since FROM ${TABLE} WHERE user_id = $1`,
    [userId],
  );
  return rows[0] ?? null;
}

/**
 * Clears a user's AFK status. Returns the row that was deleted (or null
 * if the user wasn't AFK to begin with — useful so callers can skip the
 * "welcome back" message when nothing actually changed).
 */
export async function clearAfk(userId) {
  const { rows } = await pool.query(
    `DELETE FROM ${TABLE} WHERE user_id = $1 RETURNING user_id, guild_id, reason, since`,
    [userId],
  );
  return rows[0] ?? null;
}

/**
 * Batch-checks a list of user IDs (e.g. everyone @mentioned in a message)
 * and returns only the ones who are currently AFK.
 */
export async function getAfkBulk(userIds) {
  if (!userIds.length) return [];
  const { rows } = await pool.query(
    `SELECT user_id, guild_id, reason, since FROM ${TABLE} WHERE user_id = ANY($1::text[])`,
    [userIds],
  );
  return rows;
}
