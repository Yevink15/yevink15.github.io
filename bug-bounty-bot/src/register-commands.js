import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import { config, requireConfig } from './config.js';

requireConfig(['token', 'clientId', 'guildId']);

const commands = [
  new SlashCommandBuilder()
    .setName('quests')
    .setDescription('Show today\'s bug bounty quest board.'),
  new SlashCommandBuilder()
    .setName('done')
    .setDescription('Mark a quest complete.')
    .addStringOption((option) =>
      option
        .setName('quest')
        .setDescription('Quest id from /quests, such as recon-scope or writeup.')
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Show your XP, streak, and completed quest count.'),
  new SlashCommandBuilder()
    .setName('prep')
    .setDescription('Get a focused bug bounty or AppSec interview prep card.')
    .addStringOption((option) =>
      option
        .setName('topic')
        .setDescription('Try xss, idor, sqli, report, or interview.')
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('bossfight')
    .setDescription('Get a larger portfolio challenge for the week.'),
  new SlashCommandBuilder()
    .setName('report')
    .setDescription('Draft a responsible disclosure report template.')
    .addStringOption((option) =>
      option.setName('title').setDescription('Short vulnerability title.').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('impact').setDescription('What could an attacker do?').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('steps').setDescription('Reproduction steps summary.').setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('resources')
    .setDescription('Show safe bug bounty practice resources.')
].map((command) => command.toJSON());

const rest = new REST({ version: '10' }).setToken(config.token);

await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), {
  body: commands
});

console.log(`Registered ${commands.length} guild slash commands.`);

