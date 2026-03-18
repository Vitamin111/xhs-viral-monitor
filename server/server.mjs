import cors from 'cors';
import express from 'express';

const app = express();
const port = Number(process.env.PORT || 8787);

app.use(cors());
app.use(express.json());

const notes = [
  {
    id: 101,
    title: 'Sensitive skin repair cream review',
    authorName: 'Ingredient Lab',
    publishTime: '2026-03-18 09:20',
    category: 'Skincare',
    brandName: 'Avene',
    coverGradient: 'sunset',
    likeCount: 1280,
    favoriteCount: 965,
    commentCount: 243,
    engagementRate: 248,
    growthRate: 1.82,
    viralScore: 89.4,
    viralLevel: 'VIRAL',
    keywords: ['sensitive skin', 'repair cream', 'seasonal change'],
    summary: 'Strong before/after framing and unusually high save efficiency for the category.',
  },
  {
    id: 102,
    title: 'Affordable commute outfit formulas',
    authorName: 'Closet Lab',
    publishTime: '2026-03-18 07:45',
    category: 'Fashion',
    brandName: 'Uniqlo',
    coverGradient: 'sea',
    likeCount: 2010,
    favoriteCount: 1505,
    commentCount: 182,
    engagementRate: 301,
    growthRate: 1.36,
    viralScore: 86.2,
    viralLevel: 'VIRAL',
    keywords: ['commute outfit', 'affordable', 'template'],
    summary: 'Template-driven fashion content with high saves and clear utility value.',
  },
  {
    id: 103,
    title: '5-minute air fryer breakfast menu',
    authorName: 'Morning Wins',
    publishTime: '2026-03-18 08:10',
    category: 'Food',
    brandName: 'Home',
    coverGradient: 'peach',
    likeCount: 790,
    favoriteCount: 624,
    commentCount: 95,
    engagementRate: 176,
    growthRate: 1.58,
    viralScore: 74.8,
    viralLevel: 'POTENTIAL',
    keywords: ['breakfast', 'air fryer', 'office worker'],
    summary: 'Early-stage high-growth content with strong save momentum.',
  },
  {
    id: 104,
    title: 'Spring perfume list with soft woody notes',
    authorName: 'Scent Archive',
    publishTime: '2026-03-17 18:30',
    category: 'Fragrance',
    brandName: 'Jo Malone',
    coverGradient: 'forest',
    likeCount: 642,
    favoriteCount: 401,
    commentCount: 88,
    engagementRate: 92,
    growthRate: 0.78,
    viralScore: 58.3,
    viralLevel: 'NORMAL',
    keywords: ['perfume', 'woody note', 'spring'],
    summary: 'Good topic relevance, but recent growth has started to cool down.',
  },
];

const tasks = [
  {
    id: 1,
    taskName: 'Skincare keyword monitor',
    taskType: 'KEYWORD',
    status: 'ACTIVE',
    targets: ['sensitive skin', 'repair cream', 'skin barrier'],
    cadence: 'Every 1 hour',
    lastRunAt: '2026-03-18 10:00',
    nextRunAt: '2026-03-18 11:00',
    viralCount: 3,
    alertCount: 2,
    failCount: 0,
  },
  {
    id: 2,
    taskName: 'Competitor brand monitor',
    taskType: 'COMPETITOR',
    status: 'ACTIVE',
    targets: ['Avene', 'La Roche-Posay', 'CeraVe'],
    cadence: 'Every 6 hours',
    lastRunAt: '2026-03-18 06:00',
    nextRunAt: '2026-03-18 12:00',
    viralCount: 5,
    alertCount: 4,
    failCount: 0,
  },
  {
    id: 3,
    taskName: 'Fashion creator tracking',
    taskType: 'AUTHOR',
    status: 'PAUSED',
    targets: ['Closet Lab', 'Commuter Style'],
    cadence: 'Every 1 day',
    lastRunAt: '2026-03-17 09:00',
    nextRunAt: '2026-03-19 09:00',
    viralCount: 1,
    alertCount: 0,
    failCount: 0,
  },
];

const alerts = [
  {
    id: 1,
    alertType: 'VIRAL_HIT',
    level: 'HIGH',
    title: 'Skincare monitor found a new viral note',
    reason: 'Save count is above category P90 and short-term growth is 2.4x the baseline.',
    taskName: 'Skincare keyword monitor',
    createdAt: '10 minutes ago',
    noteId: 101,
    read: false,
  },
  {
    id: 2,
    alertType: 'KEYWORD_SURGE',
    level: 'MEDIUM',
    title: 'Keyword trend is rising: commute outfit',
    reason: 'Four high-save notes appeared in the last 6 hours and trend is up 76% day over day.',
    taskName: 'Fashion trend watch',
    createdAt: '35 minutes ago',
    noteId: 102,
    read: false,
  },
  {
    id: 3,
    alertType: 'POTENTIAL_VIRAL_HIT',
    level: 'LOW',
    title: 'Potential viral note detected',
    reason: 'The breakfast note is showing unusually strong save efficiency in its first 2 hours.',
    taskName: 'Breakfast idea radar',
    createdAt: '1 hour ago',
    noteId: 103,
    read: true,
  },
];

const favorites = [
  {
    id: 1,
    noteId: 101,
    folder: 'Skincare viral cases',
    tags: ['title', 'cover'],
    remark: 'Useful for weekly case studies around repair content.',
    savedAt: '2026-03-18 10:12',
  },
  {
    id: 2,
    noteId: 102,
    folder: 'Fashion templates',
    tags: ['high-save', 'repeatable'],
    remark: 'Number-led template title performs very well here.',
    savedAt: '2026-03-18 09:40',
  },
];

const dashboardStats = [
  { label: 'Today Viral', value: '23', change: '+18%' },
  { label: 'Potential Viral', value: '41', change: '+9%' },
  { label: 'Active Tasks', value: '18', change: '+2' },
  { label: 'Unread Alerts', value: '6', change: '+3' },
];

const keywordTrends = [
  { keyword: 'sensitive skin', score: 92, delta: '+23%' },
  { keyword: 'commute outfit', score: 86, delta: '+18%' },
  { keyword: 'air fryer breakfast', score: 74, delta: '+31%' },
  { keyword: 'woody perfume', score: 58, delta: '-6%' },
];

function getNoteById(id) {
  return notes.find((note) => note.id === Number(id));
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, now: new Date().toISOString() });
});

app.get('/api/dashboard/overview', (_req, res) => {
  res.json(dashboardStats);
});

app.get('/api/dashboard/keyword-trends', (_req, res) => {
  res.json(keywordTrends);
});

app.get('/api/dashboard/recent-alerts', (_req, res) => {
  res.json(alerts);
});

app.get('/api/dashboard/featured-notes', (_req, res) => {
  res.json(notes.slice(0, 2));
});

app.get('/api/dashboard/focus-tasks', (_req, res) => {
  res.json(tasks);
});

app.get('/api/notes', (req, res) => {
  const keyword = String(req.query.keyword ?? '').trim().toLowerCase();
  const level = String(req.query.level ?? 'ALL').toUpperCase();

  const filtered = notes.filter((note) => {
    const matchesKeyword =
      !keyword ||
      note.title.toLowerCase().includes(keyword) ||
      note.authorName.toLowerCase().includes(keyword) ||
      note.keywords.some((item) => item.toLowerCase().includes(keyword));
    const matchesLevel = level === 'ALL' || note.viralLevel === level;

    return matchesKeyword && matchesLevel;
  });

  res.json(filtered);
});

app.get('/api/notes/:id', (req, res) => {
  const note = getNoteById(req.params.id);
  if (!note) {
    res.status(404).json({ message: 'note not found' });
    return;
  }

  const favorite = favorites.find((item) => item.noteId === note.id);
  res.json({
    ...note,
    ruleName: 'Viral Rule v1',
    ruleReason: 'Save count is above category P90 and growth remains inside the prime discovery window.',
    scoreBreakdown: ['save 95', 'growth 88', 'comment 73', 'time decay 10'],
    favoriteFolder: favorite?.folder,
    favoriteRemark: favorite?.remark,
    favoriteTags: favorite?.tags,
  });
});

app.get('/api/tasks', (_req, res) => {
  res.json(tasks);
});

app.get('/api/alerts', (_req, res) => {
  res.json(alerts);
});

app.get('/api/favorites', (_req, res) => {
  res.json(
    favorites
      .map((favorite) => {
        const note = getNoteById(favorite.noteId);
        return note ? { ...favorite, note } : null;
      })
      .filter(Boolean),
  );
});

app.listen(port, () => {
  console.log(`API server running at http://localhost:${port}`);
});
