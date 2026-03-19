import cors from 'cors';
import express from 'express';
import {
  createTask,
  deleteTask,
  getCollectorSettings,
  getDashboardStats,
  getKeywordTrends,
  getNoteById,
  getNoteSourceByNoteId,
  getTaskById,
  listCollectedNotesPaged,
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

function buildRuleDetail(note, source) {
  const saveRatio = note.likeCount > 0 ? note.favoriteCount / note.likeCount : 0;
  const commentRatio = note.likeCount > 0 ? note.commentCount / note.likeCount : 0;
  const levelLabel =
    note.viralLevel === 'VIRAL' ? '爆款' : note.viralLevel === 'POTENTIAL' ? '潜力爆款' : '普通内容';

  return {
    ruleName: '爆款识别规则 v2',
    ruleReason: `系统基于收藏、增长、评论和时效四类信号计算爆款分 ${note.viralScore}，当前判定为${levelLabel}。`,
    scoreBreakdown: [
      `收藏效率 ${(saveRatio * 100).toFixed(0)}%`,
      `增长率 ${note.growthRate}`,
      `评论互动 ${(commentRatio * 100).toFixed(0)}%`,
      `爆款分 ${note.viralScore}`,
    ],
    ruleHighlights: [
      note.favoriteCount >= 300
        ? '收藏量已进入高热内容区间，说明用户有较强的保存和回看意愿。'
        : '收藏量处于可跟踪区间，具备继续观察价值。',
      note.growthRate >= 1.5
        ? `增长率 ${note.growthRate}，说明内容仍处在热度扩散阶段。`
        : `增长率 ${note.growthRate}，说明内容热度相对平稳。`,
      note.commentCount >= 80
        ? '评论量较高，说明内容除了被收藏，也具备讨论度。'
        : '评论量中等，更偏向实用型内容的收藏表现。',
      source?.searchKeyword
        ? `该内容命中关键词“${source.searchKeyword}”，来自 ${source.trackName} 赛道。`
        : '当前为本地演示或未记录采集来源的数据。',
    ],
  };
}

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
  const source = getNoteSourceByNoteId(note.id);
  const ruleDetail = buildRuleDetail(note, source);

  res.json({
    ...note,
    ruleName: ruleDetail.ruleName,
    ruleReason: ruleDetail.ruleReason,
    scoreBreakdown: ruleDetail.scoreBreakdown,
    ruleHighlights: ruleDetail.ruleHighlights,
    favoriteFolder: favorite?.folder,
    favoriteRemark: favorite?.remark,
    favoriteTags: favorite?.tags,
    sourceUrl: source?.sourceUrl,
    sourceTrackName: source?.trackName,
    sourceKeyword: source?.searchKeyword,
    collectedAt: source?.collectedAt,
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
  const favorites = listFavorites()
    .map((favorite) => {
      const note = getNoteById(favorite.noteId);
      return note ? { ...favorite, note } : null;
    })
    .filter(Boolean);
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

app.get('/api/collector/notes', (req, res) => {
  const keyword = String(req.query.keyword ?? '');
  const track = String(req.query.track ?? 'ALL');
  const page = Number(req.query.page ?? 1);
  const pageSize = Number(req.query.pageSize ?? 20);
  res.json(listCollectedNotesPaged({ keyword, track, page, pageSize }));
});

app.listen(port, () => {
  console.log(`API server running at http://localhost:${port}`);
});
