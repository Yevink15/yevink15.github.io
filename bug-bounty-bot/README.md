# Bug Bounty Quest Board

A Discord bot that helps you build evidence for a bug bounty developer role: daily security practice, writeups, portfolio work, and weekly momentum tracking.

## What It Does

- Posts a daily authorized bug bounty quest board.
- Tracks completed work with XP and streaks.
- Generates interview prep for bug bounty, AppSec, web security, and developer roles.
- Creates responsible disclosure report templates.
- Keeps work focused on legal targets: labs, your own apps, and programs where you have permission.

## Setup

1. Create a Discord application at <https://discord.com/developers/applications>.
2. Add a bot user under **Bot** and copy the bot token.
3. Enable **Message Content Intent** if you later add prefix commands. Slash commands here do not require it.
4. Invite the bot to your server with these scopes:
   - `bot`
   - `applications.commands`
5. Give it these bot permissions:
   - Send Messages
   - Use Slash Commands
   - Embed Links
6. Copy `.env.example` to `.env` and fill in:
   - `DISCORD_TOKEN`
   - `DISCORD_CLIENT_ID`
   - `DISCORD_GUILD_ID`
   - `QUEST_CHANNEL_ID`

## Run Locally

```bash
npm install
npm run register
npm start
```

## Commands

- `/quests` - Show today's quest board.
- `/done quest:<id>` - Mark a quest complete and earn XP.
- `/stats` - Show XP, streak, and completed quests.
- `/prep topic:<topic>` - Generate a focused prep card.
- `/bossfight` - Get a realistic portfolio challenge.
- `/report title:<title> impact:<impact> steps:<steps>` - Draft a responsible disclosure report.
- `/resources` - Show a starter list of practice resources.

## Safety Rule

Only test systems you own, labs designed for practice, or bug bounty programs where you have explicit permission and scope. The bot intentionally avoids guidance for unauthorized access.

