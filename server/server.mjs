import cors from 'cors';
import express from 'express';
import {
  createTask,
  deleteTask,
  getCollectorSettings,
  getDashboardStats,
  getKeywordTrends,
  getNoteById,
  getTaskById,
  listAlerts,
  listFavorites,
  listNotes,
  listTasks,
  markAlertRead,
  setTaskStatus,
  toggleFavorite,
  updateCollectorSettings,
  updateTask,
} from './store.mjs';

const app = express();
const port = Number(process.env.PORT || 8787);

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, now: new Date().toISOString() });
});

app.get('/api/dashboard/overview', (_req, res) => {
  res.json(getDashboardStats());
});

app.get('/api/dashboard/keyword-trends', (_req, res) => {
  res.json(getKeywordTrends());
});

app.get('/api/dashboard/recent-alerts', (_req, res) => {
  res.json(listAlerts());
});

app.get('/api/dashboard/featured-notes', (_req, res) => {
  res.json(listNotes().slice(0, 2));
});

app.get('/api/dashboard/focus-tasks', (_req, res) => {
  res.json(listTasks());
});

app.get('/api/notes', (req, res) => {
  const keyword = String(req.query.keyword ?? '');
  const level = String(req.query.level ?? 'ALL');
  res.json(listNotes({ keyword, level }));
});

app.get('/api/notes/:id', (req, res) => {
  const note = getNoteById(req.params.id);
  if (!note) {
    res.status(404).json({ message: 'note not found' });
    return;
  }

  const favorite = listFavorites().find((item) => item.noteId === note.id);
  res.json({
    ...note,
    ruleName: '爆款识别规则 v1',
    ruleReason: '收藏数高于类目 P90，且增长率仍处于核心爆发窗口。',
    scoreBreakdown: ['收藏分 95', '增长分 88', '评论分 73', '时效衰减 10'],
    favoriteFolder: favorite?.folder,
    favoriteRemark: favorite?.remark,
    favoriteTags: favorite?.tags,
  });
});

app.get('/api/tasks', (_req, res) => {
  res.json(listTasks());
});

app.post('/api/tasks', (req, res) => {
  const { taskName, taskType, targets, cadence } = req.body ?? {};

  if (!taskName || !taskType || !Array.isArray(targets) || targets.length === 0 || !cadence) {
    res.status(400).json({ message: 'invalid task payload' });
    return;
  }

  const task = createTask({
    taskName: String(taskName).trim(),
    taskType: String(taskType).toUpperCase(),
    targets: targets.map((item) => String(item).trim()).filter(Boolean),
    cadence: String(cadence),
  });
  res.status(201).json(task);
});

app.put('/api/tasks/:id', (req, res) => {
  const currentTask = getTaskById(req.params.id);
  if (!currentTask) {
    res.status(404).json({ message: 'task not found' });
    return;
  }

  const { taskName, taskType, targets, cadence, status } = req.body ?? {};

  if (!taskName || !taskType || !Array.isArray(targets) || targets.length === 0 || !cadence) {
    res.status(400).json({ message: 'invalid task payload' });
    return;
  }

  const updated = updateTask(req.params.id, {
    taskName: String(taskName).trim(),
    taskType: String(taskType).toUpperCase(),
    targets: targets.map((item) => String(item).trim()).filter(Boolean),
    cadence: String(cadence),
    status: String(status ?? currentTask.status).toUpperCase(),
  });

  res.json(updated);
});

app.post('/api/tasks/:id/pause', (req, res) => {
  const task = setTaskStatus(req.params.id, 'PAUSED');
  if (!task) {
    res.status(404).json({ message: 'task not found' });
    return;
  }
  res.json(task);
});

app.post('/api/tasks/:id/resume', (req, res) => {
  const task = setTaskStatus(req.params.id, 'ACTIVE');
  if (!task) {
    res.status(404).json({ message: 'task not found' });
    return;
  }
  res.json(task);
});

app.delete('/api/tasks/:id', (req, res) => {
  const removed = deleteTask(req.params.id);
  if (!removed) {
    res.status(404).json({ message: 'task not found' });
    return;
  }
  res.json({ removed });
});

app.get('/api/alerts', (_req, res) => {
  res.json(listAlerts());
});

app.post('/api/alerts/:id/read', (req, res) => {
  const alert = markAlertRead(req.params.id);
  if (!alert) {
    res.status(404).json({ message: 'alert not found' });
    return;
  }
  res.json(alert);
});

app.get('/api/favorites', (_req, res) => {
  const favorites = listFavorites().map((favorite) => {
    const note = getNoteById(favorite.noteId);
    return note ? { ...favorite, note } : null;
  }).filter(Boolean);
  res.json(favorites);
});

app.post('/api/favorites/toggle', (req, res) => {
  const {
    noteId,
    folder = '默认收藏夹',
    tags = ['待复盘'],
    remark = '来自详情页收藏。',
  } = req.body ?? {};
  const note = getNoteById(noteId);

  if (!note) {
    res.status(404).json({ message: 'note not found' });
    return;
  }

  const result = toggleFavorite({
    noteId: Number(noteId),
    folder: String(folder),
    tags: Array.isArray(tags) ? tags.map(String) : ['待复盘'],
    remark: String(remark),
  });

  if (!result.favorited) {
    res.json(result);
    return;
  }

  res.status(201).json({
    favorited: true,
    favorite: {
      ...result.favorite,
      note,
    },
  });
});

app.get('/api/settings/collector', (_req, res) => {
  res.json(getCollectorSettings());
});

app.put('/api/settings/collector', (req, res) => {
  const { enabledTracks, headedMode, manualLoginRequired } = req.body ?? {};
  const updated = updateCollectorSettings({
    enabledTracks: Array.isArray(enabledTracks) ? enabledTracks : undefined,
    headedMode: typeof headedMode === 'boolean' ? headedMode : undefined,
    manualLoginRequired: typeof manualLoginRequired === 'boolean' ? manualLoginRequired : undefined,
  });
  res.json(updated);
});

app.listen(port, () => {
  console.log(`API server running at http://localhost:${port}`);
});
