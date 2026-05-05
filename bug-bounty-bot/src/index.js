import cron from 'node-cron';
import { Client, Events, GatewayIntentBits } from 'discord.js';
import { config, requireConfig } from './config.js';
import { completeQuest, getStats } from './store.js';
import {
  formatQuestBoard,
  getBossfight,
  getDailyQuests,
  getPrepCard
} from './quests.js';

requireConfig(['token']);

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

function findQuest(questId) {
  return getDailyQuests().find((quest) => quest.id === questId);
}

function formatStats(user) {
  const recent = user.completed.slice(-5).reverse();
  const lines = [
    '**Bug Bounty Stats**',
    `XP: ${user.xp}`,
    `Streak: ${user.streak} day${user.streak === 1 ? '' : 's'}`,
    `Completed quests: ${user.completed.length}`
  ];

  if (recent.length) {
    lines.push('', '**Recent wins:**');
    for (const entry of recent) {
      lines.push(`- ${entry.date}: ${entry.title} (+${entry.xp} XP)`);
    }
  }

  return lines.join('\n');
}

async function postDailyQuestBoard() {
  if (!config.questChannelId) return;

  const channel = await client.channels.fetch(config.questChannelId);
  if (!channel || !channel.isTextBased()) return;

  await channel.send(formatQuestBoard());
}

client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}`);

  if (config.questChannelId) {
    cron.schedule(config.dailyPostCron, postDailyQuestBoard, {
      timezone: config.timezone
    });
    console.log(`Daily quest board scheduled: ${config.dailyPostCron} ${config.timezone}`);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  try {
    if (interaction.commandName === 'quests') {
      await interaction.reply(formatQuestBoard());
      return;
    }

    if (interaction.commandName === 'done') {
      const questId = interaction.options.getString('quest', true).trim();
      const quest = findQuest(questId);

      if (!quest) {
        await interaction.reply({
          content: `I do not see "${questId}" on today's board. Run /quests and use one of those ids.`,
          ephemeral: true
        });
        return;
      }

      const result = await completeQuest(interaction.user.id, quest);

      if (result.alreadyDone) {
        await interaction.reply({
          content: `Already counted "${quest.title}" today. Your XP is still ${result.user.xp}.`,
          ephemeral: true
        });
        return;
      }

      await interaction.reply(
        `Quest complete: **${quest.title}** (+${quest.xp} XP)\nTotal XP: ${result.user.xp}\nStreak: ${result.user.streak}`
      );
      return;
    }

    if (interaction.commandName === 'stats') {
      const user = await getStats(interaction.user.id);
      await interaction.reply(formatStats(user));
      return;
    }

    if (interaction.commandName === 'prep') {
      const topic = interaction.options.getString('topic', true);
      const card = getPrepCard(topic);
      await interaction.reply(`**Prep: ${topic}**\n${card.map((line) => `- ${line}`).join('\n')}`);
      return;
    }

    if (interaction.commandName === 'bossfight') {
      const bossfight = getBossfight();
      await interaction.reply(`**Weekly Bossfight: ${bossfight.title}**\n${bossfight.prompt}`);
      return;
    }

    if (interaction.commandName === 'report') {
      const title = interaction.options.getString('title', true);
      const impact = interaction.options.getString('impact', true);
      const steps = interaction.options.getString('steps', true);

      await interaction.reply([
        '**Responsible Disclosure Draft**',
        '',
        `**Title:** ${title}`,
        '',
        '**Summary:**',
        'A security issue was identified in an authorized target. The behavior may allow the impact described below.',
        '',
        `**Impact:** ${impact}`,
        '',
        '**Steps to Reproduce:**',
        steps,
        '',
        '**Expected Result:**',
        'The application should enforce authorization and validation server-side.',
        '',
        '**Suggested Remediation:**',
        'Add server-side checks, validate trust boundaries, log suspicious attempts, and add regression tests.'
      ].join('\n'));
      return;
    }

    if (interaction.commandName === 'resources') {
      await interaction.reply([
        '**Safe Practice Resources**',
        '- PortSwigger Web Security Academy',
        '- OWASP WebGoat',
        '- OWASP Juice Shop',
        '- Hack The Box Academy',
        '- TryHackMe web security paths',
        '- Public bug bounty programs where you have read and accepted the scope'
      ].join('\n'));
    }
  } catch (error) {
    console.error(error);
    const message = 'Something went wrong handling that command. Check the bot logs for details.';
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: message, ephemeral: true });
    } else {
      await interaction.reply({ content: message, ephemeral: true });
    }
  }
});

await client.login(config.token);

