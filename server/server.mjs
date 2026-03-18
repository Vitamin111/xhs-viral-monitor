import cors from 'cors';
import express from 'express';
import { loadStore, saveStore } from './store.mjs';

const app = express();
const port = Number(process.env.PORT || 8787);

app.use(cors());
app.use(express.json());

function withStore(handler) {
  return (req, res) => {
    const store = loadStore();
    handler(req, res, store);
  };
}

function getNextId(items) {
  return items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
}

function getNoteById(store, id) {
  return store.notes.find((note) => note.id === Number(id));
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, now: new Date().toISOString() });
});

app.get('/api/dashboard/overview', withStore((_req, res, store) => {
  res.json(store.dashboardStats);
}));

app.get('/api/dashboard/keyword-trends', withStore((_req, res, store) => {
  res.json(store.keywordTrends);
}));

app.get('/api/dashboard/recent-alerts', withStore((_req, res, store) => {
  res.json(store.alerts);
}));

app.get('/api/dashboard/featured-notes', withStore((_req, res, store) => {
  res.json(store.notes.slice(0, 2));
}));

app.get('/api/dashboard/focus-tasks', withStore((_req, res, store) => {
  res.json(store.tasks);
}));

app.get('/api/notes', withStore((req, res, store) => {
  const keyword = String(req.query.keyword ?? '').trim().toLowerCase();
  const level = String(req.query.level ?? 'ALL').toUpperCase();

  const filtered = store.notes.filter((note) => {
    const matchesKeyword =
      !keyword ||
      note.title.toLowerCase().includes(keyword) ||
      note.authorName.toLowerCase().includes(keyword) ||
      note.keywords.some((item) => item.toLowerCase().includes(keyword));
    const matchesLevel = level === 'ALL' || note.viralLevel === level;

    return matchesKeyword && matchesLevel;
  });

  res.json(filtered);
}));

app.get('/api/notes/:id', withStore((req, res, store) => {
  const note = getNoteById(store, req.params.id);
  if (!note) {
    res.status(404).json({ message: 'note not found' });
    return;
  }

  const favorite = store.favorites.find((item) => item.noteId === note.id);
  res.json({
    ...note,
    ruleName: 'Viral Rule v1',
    ruleReason: 'Save count is above category P90 and growth remains inside the prime discovery window.',
    scoreBreakdown: ['save 95', 'growth 88', 'comment 73', 'time decay 10'],
    favoriteFolder: favorite?.folder,
    favoriteRemark: favorite?.remark,
    favoriteTags: favorite?.tags,
  });
}));

app.get('/api/tasks', withStore((_req, res, store) => {
  res.json(store.tasks);
}));

app.post('/api/tasks', withStore((req, res, store) => {
  const { taskName, taskType, targets, cadence } = req.body ?? {};

  if (!taskName || !taskType || !Array.isArray(targets) || targets.length === 0 || !cadence) {
    res.status(400).json({ message: 'invalid task payload' });
    return;
  }

  const now = new Date();
  const nextRun = new Date(now.getTime() + 60 * 60 * 1000);
  const task = {
    id: getNextId(store.tasks),
    taskName: String(taskName),
    taskType: String(taskType).toUpperCase(),
    status: 'ACTIVE',
    targets: targets.map((item) => String(item).trim()).filter(Boolean),
    cadence: String(cadence),
    lastRunAt: 'Not started',
    nextRunAt: nextRun.toISOString().slice(0, 16).replace('T', ' '),
    viralCount: 0,
    alertCount: 0,
    failCount: 0,
  };

  store.tasks.unshift(task);
  saveStore(store);
  res.status(201).json(task);
}));

app.put('/api/tasks/:id', withStore((req, res, store) => {
  const task = store.tasks.find((item) => item.id === Number(req.params.id));
  if (!task) {
    res.status(404).json({ message: 'task not found' });
    return;
  }

  const { taskName, taskType, targets, cadence, status } = req.body ?? {};

  if (!taskName || !taskType || !Array.isArray(targets) || targets.length === 0 || !cadence) {
    res.status(400).json({ message: 'invalid task payload' });
    return;
  }

  task.taskName = String(taskName);
  task.taskType = String(taskType).toUpperCase();
  task.targets = targets.map((item) => String(item).trim()).filter(Boolean);
  task.cadence = String(cadence);
  task.status = status ? String(status).toUpperCase() : task.status;

  saveStore(store);
  res.json(task);
}));

app.post('/api/tasks/:id/pause', withStore((req, res, store) => {
  const task = store.tasks.find((item) => item.id === Number(req.params.id));
  if (!task) {
    res.status(404).json({ message: 'task not found' });
    return;
  }

  task.status = 'PAUSED';
  saveStore(store);
  res.json(task);
}));

app.post('/api/tasks/:id/resume', withStore((req, res, store) => {
  const task = store.tasks.find((item) => item.id === Number(req.params.id));
  if (!task) {
    res.status(404).json({ message: 'task not found' });
    return;
  }

  task.status = 'ACTIVE';
  saveStore(store);
  res.json(task);
}));

app.delete('/api/tasks/:id', withStore((req, res, store) => {
  const taskIndex = store.tasks.findIndex((item) => item.id === Number(req.params.id));
  if (taskIndex < 0) {
    res.status(404).json({ message: 'task not found' });
    return;
  }

  const [removed] = store.tasks.splice(taskIndex, 1);
  saveStore(store);
  res.json({ removed });
}));

app.get('/api/alerts', withStore((_req, res, store) => {
  res.json(store.alerts);
}));

app.post('/api/alerts/:id/read', withStore((req, res, store) => {
  const alert = store.alerts.find((item) => item.id === Number(req.params.id));
  if (!alert) {
    res.status(404).json({ message: 'alert not found' });
    return;
  }

  alert.read = true;
  saveStore(store);
  res.json(alert);
}));

app.get('/api/favorites', withStore((_req, res, store) => {
  res.json(
    store.favorites
      .map((favorite) => {
        const note = getNoteById(store, favorite.noteId);
        return note ? { ...favorite, note } : null;
      })
      .filter(Boolean),
  );
}));

app.post('/api/favorites/toggle', withStore((req, res, store) => {
  const { noteId, folder = 'Default collection', tags = ['watch'], remark = 'Saved from detail page.' } = req.body ?? {};
  const note = getNoteById(store, noteId);

  if (!note) {
    res.status(404).json({ message: 'note not found' });
    return;
  }

  const existingIndex = store.favorites.findIndex((item) => item.noteId === note.id);
  if (existingIndex >= 0) {
    const [removed] = store.favorites.splice(existingIndex, 1);
    saveStore(store);
    res.json({ favorited: false, removed });
    return;
  }

  const favorite = {
    id: getNextId(store.favorites),
    noteId: note.id,
    folder: String(folder),
    tags: Array.isArray(tags) ? tags.map(String) : ['watch'],
    remark: String(remark),
    savedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
  };

  store.favorites.unshift(favorite);
  saveStore(store);
  res.status(201).json({ favorited: true, favorite: { ...favorite, note } });
}));

app.listen(port, () => {
  console.log(`API server running at http://localhost:${port}`);
});
