// src/commands/afk.js
//
// Handles the "dsp afk [reason]" trigger. This is NOT a slash command —
// it's matched directly inside messageCreate.js against
// `botConfig.afk.triggerPhrase` (see the integration snippet in
// messageCreate.js). Exporting the logic here just keeps things tidy.

import { EmbedBuilder } from 'discord.js';
import { botConfig, getColor } from '../config/config.js';
import { setAfk } from '../services/afkService.js';

/**
 * @param {import('discord.js').Message} message
 * @param {string} rawArgs - everything after "dsp afk", already trimmed
 */
export async function handleAfkTrigger(message, rawArgs) {
  const reason = rawArgs?.length ? rawArgs : botConfig.afk.defaultReason;

  await setAfk(message.author.id, message.guild.id, reason);

  const embed = new EmbedBuilder()
    .setColor(getColor('afk'))
    .setDescription(`💤 **${message.author.username}** is now AFK: ${reason}`);

  await message.reply({ embeds: [embed] });
}
