// src/utils/channelRestriction.js
//
// Shared helper used by BOTH messageCreate.js (prefix commands) and
// interactionCreate.js (slash commands) to enforce requirement #2:
// commands / bot output only allowed in the designated "bot" channel.

import { botConfig } from '../config/bot.js';

/**
 * @param {import('discord.js').TextBasedChannel} channel
 * @returns {boolean} true if this channel is allowed to run commands in.
 */
export function isAllowedCommandChannel(channel) {
  const cfg = botConfig.channelRestriction;
  if (!cfg?.enabled) return true; // restriction turned off globally
  if (!channel) return false;

  if (cfg.allowedChannelId) {
    return channel.id === cfg.allowedChannelId;
  }

  // Fallback: match by channel name if no explicit ID is configured.
  return channel.name?.toLowerCase() === cfg.allowedChannelName?.toLowerCase();
}
