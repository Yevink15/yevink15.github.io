const questPools = {
  recon: [
    {
      id: 'recon-scope',
      title: 'Read one program scope',
      xp: 15,
      detail: 'Pick one authorized program or lab. Write down in-scope assets, out-of-scope rules, and one testing idea.'
    },
    {
      id: 'recon-map',
      title: 'Map one target surface',
      xp: 20,
      detail: 'For an authorized target, list routes, auth boundaries, inputs, file upload points, and API calls.'
    },
    {
      id: 'recon-notes',
      title: 'Clean up recon notes',
      xp: 10,
      detail: 'Turn loose notes into a short markdown page you could show as a portfolio artifact.'
    }
  ],
  appsec: [
    {
      id: 'lab-xss',
      title: 'Complete one XSS lab',
      xp: 25,
      detail: 'Practice in a legal lab and write the vulnerable source/sink pattern in your own words.'
    },
    {
      id: 'lab-idOR',
      title: 'Test an IDOR scenario',
      xp: 25,
      detail: 'Use a lab or your own demo app. Explain the object-level authorization failure and fix.'
    },
    {
      id: 'lab-auth',
      title: 'Review one auth flow',
      xp: 25,
      detail: 'Check reset, login, session, and role transitions in an authorized app or training lab.'
    }
  ],
  developer: [
    {
      id: 'fix-demo',
      title: 'Ship one secure-code fix',
      xp: 30,
      detail: 'Add a small vulnerable-and-fixed example to your portfolio, with tests or before/after notes.'
    },
    {
      id: 'writeup',
      title: 'Write one mini report',
      xp: 30,
      detail: 'Use title, summary, impact, reproduction steps, evidence, and remediation.'
    },
    {
      id: 'commit',
      title: 'Make one portfolio commit',
      xp: 15,
      detail: 'Commit a security note, lab writeup, demo fix, or README improvement.'
    }
  ]
};

const bossfights = [
  {
    title: 'Secure Notes App Review',
    prompt: 'Build or review a tiny notes API with login, note ownership, and admin routes. Find and fix one broken access control issue. Publish the before/after diff and a report.'
  },
  {
    title: 'File Upload Hardening',
    prompt: 'Create a demo file upload endpoint. Document risks around file type validation, storage paths, size limits, and public access. Implement a safer version.'
  },
  {
    title: 'Password Reset Threat Model',
    prompt: 'Draw the password reset flow for a demo app. Identify abuse cases, then add rate limiting, token expiry, one-time use, and safe messaging.'
  },
  {
    title: 'API Authorization Matrix',
    prompt: 'Choose a demo REST API and create a user/role/action matrix. Add tests proving users cannot access another user account.'
  }
];

const prepCards = {
  xss: [
    'Explain reflected, stored, and DOM XSS.',
    'Name the source, sink, payload context, impact, and fix.',
    'Practice saying: "The issue is untrusted input reaching an HTML/JS execution context without context-aware encoding."'
  ],
  idor: [
    'Define object-level authorization.',
    'Show how changing an ID exposes another user resource.',
    'Explain the fix: server-side ownership checks on every object access.'
  ],
  sqli: [
    'Explain why string-built SQL is risky.',
    'Compare parameterized queries with escaping.',
    'Mention impact: data exposure, auth bypass, data modification.'
  ],
  report: [
    'Use a crisp title: vulnerable action + asset + impact.',
    'Lead with impact, then reproducible steps.',
    'Include remediation that a developer can actually implement.'
  ],
  interview: [
    'Prepare one story about responsible disclosure.',
    'Prepare one story about reading code and fixing a bug.',
    'Prepare one story about learning a new vulnerability class.'
  ],
  default: [
    'Define the concept in one sentence.',
    'Give a realistic example and impact.',
    'Explain a developer-friendly remediation.'
  ]
};

export function getTodayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function getDailyQuests(date = new Date()) {
  const day = Math.floor(date.getTime() / 86400000);
  const tracks = Object.keys(questPools);

  return tracks.map((track, index) => {
    const pool = questPools[track];
    const quest = pool[(day + index) % pool.length];
    return { ...quest, track };
  });
}

export function formatQuestBoard(date = new Date()) {
  const quests = getDailyQuests(date);
  const lines = [
    '**Bug Bounty Quest Board**',
    `Date: ${getTodayKey(date)}`,
    '',
    'Only test authorized targets: labs, your own apps, or in-scope bug bounty programs.',
    ''
  ];

  for (const quest of quests) {
    lines.push(`**${quest.id}** [${quest.track}] ${quest.title} (${quest.xp} XP)`);
    lines.push(quest.detail);
    lines.push('');
  }

  lines.push('Use `/done quest:<id>` when you finish one.');
  return lines.join('\n');
}

export function getBossfight() {
  const index = Math.floor(Date.now() / 604800000) % bossfights.length;
  return bossfights[index];
}

export function getPrepCard(topic) {
  const key = topic.toLowerCase().trim();
  return prepCards[key] || prepCards.default;
}

