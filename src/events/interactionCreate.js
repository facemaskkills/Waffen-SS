// src/events/interactionCreate.js
//
// This is a SNIPPET, not a full drop-in file — slash command dispatch is
// too template-specific to safely overwrite. Merge the highlighted block
// into your existing interactionCreate handler, right after you resolve
// `interaction.commandName` / the command object, and BEFORE you call
// `command.execute(interaction)`.

import { Events } from 'discord.js';
import { botConfig } from '../config/bot.js';
import { isAllowedCommandChannel } from '../utils/channelRestriction.js';

export const name = Events.InteractionCreate;

export async function execute(interaction) {
  if (!interaction.isChatInputCommand()) return; // keep your existing
                                                  // handling for buttons/
                                                  // selects/modals below

  const command = interaction.client.commands.get(interaction.commandName);
  if (!command) return;

  // ---------------------------------------------------------------
  // NEW: channel restriction check — reply ephemerally so it doesn't
  // spam the wrong channel, then bail out before running the command.
  // ---------------------------------------------------------------
  // Optional: exempt bot owners so admins can always run commands
  // anywhere (e.g. `/config`, `/deploy`). Remove this `if` if you
  // want the restriction to be absolute, even for owners.
  const isOwner = botConfig.commands.owners.includes(interaction.user.id);

  if (!isOwner && !isAllowedCommandChannel(interaction.channel)) {
    await interaction.reply({
      content: `🚫 ${botConfig.channelRestriction.restrictedMessage}`,
      ephemeral: true,
    });
    return;
  }

  // ... your existing cooldown checks / permission checks / execute call ...
  try {
    await command.execute(interaction);
  } catch (error) {
    // ... your existing error handling ...
  }
}
