import 'dotenv/config';

export const config = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.DISCORD_CLIENT_ID,
  guildId: process.env.DISCORD_GUILD_ID,
  questChannelId: process.env.QUEST_CHANNEL_ID,
  timezone: process.env.TIMEZONE || 'America/New_York',
  dailyPostCron: process.env.DAILY_POST_CRON || '0 8 * * *'
};

export function requireConfig(keys) {
  const missing = keys.filter((key) => !config[key]);
  if (missing.length) {
    throw new Error(`Missing required config: ${missing.join(', ')}`);
  }
}

