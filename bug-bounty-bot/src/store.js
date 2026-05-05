import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getTodayKey } from './quests.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '..', 'data');
const dataFile = path.join(dataDir, 'progress.json');

async function ensureStore() {
  await mkdir(dataDir, { recursive: true });
  try {
    const raw = await readFile(dataFile, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { users: {} };
  }
}

async function saveStore(store) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(dataFile, `${JSON.stringify(store, null, 2)}\n`, 'utf8');
}

function getUser(store, userId) {
  if (!store.users[userId]) {
    store.users[userId] = {
      xp: 0,
      completed: [],
      lastCompletedDate: null,
      streak: 0
    };
  }
  return store.users[userId];
}

function updateStreak(user, today) {
  if (user.lastCompletedDate === today) return;

  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);

  user.streak = user.lastCompletedDate === yesterdayKey ? user.streak + 1 : 1;
  user.lastCompletedDate = today;
}

export async function completeQuest(userId, quest) {
  const store = await ensureStore();
  const user = getUser(store, userId);
  const today = getTodayKey();
  const alreadyDone = user.completed.some((entry) => entry.questId === quest.id && entry.date === today);

  if (alreadyDone) {
    return { user, alreadyDone: true };
  }

  user.completed.push({
    questId: quest.id,
    title: quest.title,
    xp: quest.xp,
    date: today
  });
  user.xp += quest.xp;
  updateStreak(user, today);

  await saveStore(store);
  return { user, alreadyDone: false };
}

export async function getStats(userId) {
  const store = await ensureStore();
  const user = getUser(store, userId);
  await saveStore(store);
  return user;
}

