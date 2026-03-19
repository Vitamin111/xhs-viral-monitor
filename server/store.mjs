import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'app.db');
const seedPath = path.join(__dirname, 'store.json');

const db = new DatabaseSync(dbPath);

function parseJson(value, fallback) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function stringifyJson(value) {
  return JSON.stringify(value ?? []);
}

function rowCount(tableName) {
  const row = db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get();
  return Number(row.count);
}

function nextId(tableName) {
  const row = db.prepare(`SELECT COALESCE(MAX(id), 0) AS max_id FROM ${tableName}`).get();
  return Number(row.max_id) + 1;
}

function formatLocalTimestamp(date = new Date()) {
  return date.toISOString().slice(0, 16).replace('T', ' ');
}

function mapNote(row) {
  return {
    id: row.id,
    title: row.title,
    authorName: row.author_name,
    publishTime: row.publish_time,
    category: row.category,
    brandName: row.brand_name,
    coverGradient: row.cover_gradient,
    likeCount: row.like_count,
    favoriteCount: row.favorite_count,
    commentCount: row.comment_count,
    engagementRate: row.engagement_rate,
    growthRate: row.growth_rate,
    viralScore: row.viral_score,
    viralLevel: row.viral_level,
    keywords: parseJson(row.keywords_json, []),
    summary: row.summary,
  };
}

function mapTask(row) {
  return {
    id: row.id,
    taskName: row.task_name,
    taskType: row.task_type,
    status: row.status,
    targets: parseJson(row.targets_json, []),
    cadence: row.cadence,
    lastRunAt: row.last_run_at,
    nextRunAt: row.next_run_at,
    viralCount: row.viral_count,
    alertCount: row.alert_count,
    failCount: row.fail_count,
  };
}

function mapAlert(row) {
  return {
    id: row.id,
    alertType: row.alert_type,
    level: row.level,
    title: row.title,
    reason: row.reason,
    taskName: row.task_name,
    createdAt: row.created_at_label,
    noteId: row.note_id,
    read: Boolean(row.is_read),
  };
}

function mapFavorite(row) {
  return {
    id: row.id,
    noteId: row.note_id,
    folder: row.folder,
    tags: parseJson(row.tags_json, []),
    remark: row.remark,
    savedAt: row.saved_at,
  };
}

function mapCollectorSettings(row) {
  return {
    platformName: row.platform_name,
    loginStatus: row.login_status,
    manualLoginRequired: Boolean(row.manual_login_required),
    headedMode: Boolean(row.headed_mode),
    sessionFile: row.session_file,
    lastLoginAt: row.last_login_at,
    lastCollectAt: row.last_collect_at,
    enabledTracks: parseJson(row.enabled_tracks_json, []),
  };
}

function mapCollectedNote(row) {
  return {
    id: row.id,
    title: row.title,
    authorName: row.author_name,
    publishTime: row.publish_time,
    category: row.category,
    brandName: row.brand_name,
    coverGradient: row.cover_gradient,
    likeCount: row.like_count,
    favoriteCount: row.favorite_count,
    commentCount: row.comment_count,
    engagementRate: row.engagement_rate,
    growthRate: row.growth_rate,
    viralScore: row.viral_score,
    viralLevel: row.viral_level,
    keywords: parseJson(row.keywords_json, []),
    summary: row.summary,
    sourceUrl: row.source_url,
    sourceNoteId: row.source_note_id,
    platform: row.platform,
    trackName: row.track_name,
    searchKeyword: row.keyword,
    collectedAt: row.collected_at,
  };
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      author_name TEXT NOT NULL,
      publish_time TEXT NOT NULL,
      category TEXT NOT NULL,
      brand_name TEXT NOT NULL,
      cover_gradient TEXT NOT NULL,
      like_count INTEGER NOT NULL,
      favorite_count INTEGER NOT NULL,
      comment_count INTEGER NOT NULL,
      engagement_rate REAL NOT NULL,
      growth_rate REAL NOT NULL,
      viral_score REAL NOT NULL,
      viral_level TEXT NOT NULL,
      keywords_json TEXT NOT NULL,
      summary TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY,
      task_name TEXT NOT NULL,
      task_type TEXT NOT NULL,
      status TEXT NOT NULL,
      targets_json TEXT NOT NULL,
      cadence TEXT NOT NULL,
      last_run_at TEXT NOT NULL,
      next_run_at TEXT NOT NULL,
      viral_count INTEGER NOT NULL,
      alert_count INTEGER NOT NULL,
      fail_count INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY,
      alert_type TEXT NOT NULL,
      level TEXT NOT NULL,
      title TEXT NOT NULL,
      reason TEXT NOT NULL,
      task_name TEXT NOT NULL,
      created_at_label TEXT NOT NULL,
      note_id INTEGER,
      is_read INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY,
      note_id INTEGER NOT NULL,
      folder TEXT NOT NULL,
      tags_json TEXT NOT NULL,
      remark TEXT NOT NULL,
      saved_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dashboard_stats (
      id INTEGER PRIMARY KEY,
      label TEXT NOT NULL,
      value TEXT NOT NULL,
      change_value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS keyword_trends (
      id INTEGER PRIMARY KEY,
      keyword TEXT NOT NULL,
      score REAL NOT NULL,
      delta TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS collector_settings (
      id INTEGER PRIMARY KEY,
      platform_name TEXT NOT NULL,
      login_status TEXT NOT NULL,
      manual_login_required INTEGER NOT NULL,
      headed_mode INTEGER NOT NULL,
      session_file TEXT NOT NULL,
      last_login_at TEXT,
      last_collect_at TEXT,
      enabled_tracks_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS collection_runs (
      id INTEGER PRIMARY KEY,
      started_at TEXT NOT NULL,
      finished_at TEXT,
      status TEXT NOT NULL,
      triggered_by TEXT NOT NULL,
      notes_count INTEGER NOT NULL DEFAULT 0,
      error_message TEXT
    );

    CREATE TABLE IF NOT EXISTS note_sources (
      id INTEGER PRIMARY KEY,
      note_id INTEGER NOT NULL,
      platform TEXT NOT NULL,
      source_url TEXT NOT NULL UNIQUE,
      source_note_id TEXT,
      track_name TEXT NOT NULL,
      keyword TEXT NOT NULL,
      collected_at TEXT NOT NULL,
      raw_json TEXT NOT NULL
    );
  `);
}

function upsertSeedData(seed) {
  const noteInsert = db.prepare(`
    INSERT OR REPLACE INTO notes (
      id, title, author_name, publish_time, category, brand_name, cover_gradient,
      like_count, favorite_count, comment_count, engagement_rate, growth_rate,
      viral_score, viral_level, keywords_json, summary
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const taskInsert = db.prepare(`
    INSERT OR REPLACE INTO tasks (
      id, task_name, task_type, status, targets_json, cadence,
      last_run_at, next_run_at, viral_count, alert_count, fail_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const alertInsert = db.prepare(`
    INSERT OR REPLACE INTO alerts (
      id, alert_type, level, title, reason, task_name, created_at_label, note_id, is_read
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const favoriteInsert = db.prepare(`
    INSERT OR REPLACE INTO favorites (
      id, note_id, folder, tags_json, remark, saved_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);

  const dashboardInsert = db.prepare(`
    INSERT OR REPLACE INTO dashboard_stats (id, label, value, change_value)
    VALUES (?, ?, ?, ?)
  `);

  const trendInsert = db.prepare(`
    INSERT OR REPLACE INTO keyword_trends (id, keyword, score, delta)
    VALUES (?, ?, ?, ?)
  `);

  for (const note of seed.notes) {
    noteInsert.run(
      note.id,
      note.title,
      note.authorName,
      note.publishTime,
      note.category,
      note.brandName,
      note.coverGradient,
      note.likeCount,
      note.favoriteCount,
      note.commentCount,
      note.engagementRate,
      note.growthRate,
      note.viralScore,
      note.viralLevel,
      stringifyJson(note.keywords),
      note.summary,
    );
  }

  for (const task of seed.tasks) {
    taskInsert.run(
      task.id,
      task.taskName,
      task.taskType,
      task.status,
      stringifyJson(task.targets),
      task.cadence,
      task.lastRunAt,
      task.nextRunAt,
      task.viralCount,
      task.alertCount,
      task.failCount,
    );
  }

  for (const alert of seed.alerts) {
    alertInsert.run(
      alert.id,
      alert.alertType,
      alert.level,
      alert.title,
      alert.reason,
      alert.taskName,
      alert.createdAt,
      alert.noteId ?? null,
      alert.read ? 1 : 0,
    );
  }

  for (const favorite of seed.favorites) {
    favoriteInsert.run(
      favorite.id,
      favorite.noteId,
      favorite.folder,
      stringifyJson(favorite.tags),
      favorite.remark,
      favorite.savedAt,
    );
  }

  seed.dashboardStats.forEach((item, index) => {
    dashboardInsert.run(index + 1, item.label, item.value, item.change);
  });

  seed.keywordTrends.forEach((item, index) => {
    trendInsert.run(index + 1, item.keyword, item.score, item.delta);
  });

  const settings = seed.collectorSettings;
  db.prepare(`
    INSERT OR IGNORE INTO collector_settings (
      id, platform_name, login_status, manual_login_required, headed_mode,
      session_file, last_login_at, last_collect_at, enabled_tracks_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    1,
    settings.platformName,
    settings.loginStatus,
    settings.manualLoginRequired ? 1 : 0,
    settings.headedMode ? 1 : 0,
    settings.sessionFile,
    settings.lastLoginAt,
    settings.lastCollectAt,
    stringifyJson(settings.enabledTracks),
  );
}

function seedDatabase() {
  if (!fs.existsSync(seedPath)) {
    return;
  }

  const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  const hasCollectedSources = rowCount('note_sources') > 0;

  if (rowCount('notes') === 0 || !hasCollectedSources) {
    upsertSeedData(seed);
  }
}

initSchema();
seedDatabase();

export function getDashboardStats() {
  return db.prepare('SELECT label, value, change_value FROM dashboard_stats ORDER BY id').all().map((row) => ({
    label: row.label,
    value: row.value,
    change: row.change_value,
  }));
}

export function getKeywordTrends() {
  return db.prepare('SELECT keyword, score, delta FROM keyword_trends ORDER BY id').all();
}

export function listNotes({ keyword = '', level = 'ALL' } = {}) {
  const rows = db.prepare('SELECT * FROM notes ORDER BY publish_time DESC, id DESC').all();
  const normalizedKeyword = keyword.trim().toLowerCase();
  const normalizedLevel = level.toUpperCase();

  return rows
    .map(mapNote)
    .filter((note) => {
      const matchesKeyword =
        !normalizedKeyword ||
        note.title.toLowerCase().includes(normalizedKeyword) ||
        note.authorName.toLowerCase().includes(normalizedKeyword) ||
        note.keywords.some((item) => item.toLowerCase().includes(normalizedKeyword));
      const matchesLevel = normalizedLevel === 'ALL' || note.viralLevel === normalizedLevel;
      return matchesKeyword && matchesLevel;
    });
}

export function getNoteById(id) {
  const row = db.prepare('SELECT * FROM notes WHERE id = ?').get(Number(id));
  return row ? mapNote(row) : null;
}

export function getNoteSourceByNoteId(id) {
  const row = db.prepare(`
    SELECT *
    FROM note_sources
    WHERE note_id = ?
  `).get(Number(id));

  if (!row) {
    return null;
  }

  return {
    sourceUrl: row.source_url,
    sourceNoteId: row.source_note_id,
    platform: row.platform,
    trackName: row.track_name,
    searchKeyword: row.keyword,
    collectedAt: row.collected_at,
  };
}

export function listCollectedNotes({ keyword = '', track = 'ALL' } = {}) {
  const rows = db.prepare(`
    SELECT
      notes.*,
      note_sources.source_url,
      note_sources.source_note_id,
      note_sources.platform,
      note_sources.track_name,
      note_sources.keyword,
      note_sources.collected_at
    FROM note_sources
    INNER JOIN notes ON notes.id = note_sources.note_id
    ORDER BY note_sources.collected_at DESC, note_sources.id DESC
  `).all();

  const normalizedKeyword = keyword.trim().toLowerCase();
  const normalizedTrack = track.trim().toLowerCase();

  return rows
    .map(mapCollectedNote)
    .filter((item) => {
      const matchesKeyword =
        !normalizedKeyword ||
        item.title.toLowerCase().includes(normalizedKeyword) ||
        item.authorName.toLowerCase().includes(normalizedKeyword) ||
        item.searchKeyword.toLowerCase().includes(normalizedKeyword) ||
        item.keywords.some((word) => word.toLowerCase().includes(normalizedKeyword));
      const matchesTrack = normalizedTrack === 'all' || item.trackName.toLowerCase() === normalizedTrack;
      return matchesKeyword && matchesTrack;
    });
}

export function listTasks() {
  return db.prepare('SELECT * FROM tasks ORDER BY id DESC').all().map(mapTask);
}

export function createTask({ taskName, taskType, targets, cadence }) {
  const id = nextId('tasks');
  const nextRunAt = formatLocalTimestamp(new Date(Date.now() + 60 * 60 * 1000));

  db.prepare(`
    INSERT INTO tasks (
      id, task_name, task_type, status, targets_json, cadence,
      last_run_at, next_run_at, viral_count, alert_count, fail_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    taskName,
    taskType,
    'ACTIVE',
    stringifyJson(targets),
    cadence,
    'Not started',
    nextRunAt,
    0,
    0,
    0,
  );

  return getTaskById(id);
}

export function getTaskById(id) {
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(Number(id));
  return row ? mapTask(row) : null;
}

export function updateTask(id, { taskName, taskType, targets, cadence, status }) {
  db.prepare(`
    UPDATE tasks
    SET task_name = ?, task_type = ?, targets_json = ?, cadence = ?, status = ?
    WHERE id = ?
  `).run(taskName, taskType, stringifyJson(targets), cadence, status, Number(id));

  return getTaskById(id);
}

export function setTaskStatus(id, status) {
  db.prepare('UPDATE tasks SET status = ? WHERE id = ?').run(status, Number(id));
  return getTaskById(id);
}

export function deleteTask(id) {
  const task = getTaskById(id);
  if (!task) {
    return null;
  }

  db.prepare('DELETE FROM tasks WHERE id = ?').run(Number(id));
  return task;
}

export function listAlerts() {
  return db.prepare('SELECT * FROM alerts ORDER BY id DESC').all().map(mapAlert);
}

export function markAlertRead(id) {
  db.prepare('UPDATE alerts SET is_read = 1 WHERE id = ?').run(Number(id));
  const row = db.prepare('SELECT * FROM alerts WHERE id = ?').get(Number(id));
  return row ? mapAlert(row) : null;
}

export function listFavorites() {
  return db.prepare('SELECT * FROM favorites ORDER BY id DESC').all().map(mapFavorite);
}

export function toggleFavorite({ noteId, folder, tags, remark }) {
  const existing = db.prepare('SELECT * FROM favorites WHERE note_id = ?').get(Number(noteId));
  if (existing) {
    db.prepare('DELETE FROM favorites WHERE note_id = ?').run(Number(noteId));
    return { favorited: false, removed: mapFavorite(existing) };
  }

  const id = nextId('favorites');
  const savedAt = formatLocalTimestamp();
  db.prepare(`
    INSERT INTO favorites (id, note_id, folder, tags_json, remark, saved_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, Number(noteId), folder, stringifyJson(tags), remark, savedAt);

  const created = db.prepare('SELECT * FROM favorites WHERE id = ?').get(id);
  return { favorited: true, favorite: mapFavorite(created) };
}

export function getCollectorSettings() {
  const row = db.prepare('SELECT * FROM collector_settings WHERE id = 1').get();
  return mapCollectorSettings(row);
}

export function updateCollectorSettings({ enabledTracks, headedMode, manualLoginRequired }) {
  const current = getCollectorSettings();
  db.prepare(`
    UPDATE collector_settings
    SET enabled_tracks_json = ?, headed_mode = ?, manual_login_required = ?
    WHERE id = 1
  `).run(
    stringifyJson(enabledTracks ?? current.enabledTracks),
    (headedMode ?? current.headedMode) ? 1 : 0,
    (manualLoginRequired ?? current.manualLoginRequired) ? 1 : 0,
  );

  return getCollectorSettings();
}

export function setCollectorLoginStatus(loginStatus, lastLoginAt = formatLocalTimestamp()) {
  db.prepare(`
    UPDATE collector_settings
    SET login_status = ?, last_login_at = ?
    WHERE id = 1
  `).run(loginStatus, lastLoginAt);

  return getCollectorSettings();
}

export function setCollectorCollectTime(lastCollectAt = formatLocalTimestamp()) {
  db.prepare(`
    UPDATE collector_settings
    SET last_collect_at = ?
    WHERE id = 1
  `).run(lastCollectAt);

  return getCollectorSettings();
}

export function createCollectionRun(triggeredBy = 'manual') {
  const id = nextId('collection_runs');
  db.prepare(`
    INSERT INTO collection_runs (id, started_at, status, triggered_by, notes_count, error_message)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, formatLocalTimestamp(), 'RUNNING', triggeredBy, 0, null);
  return id;
}

export function finishCollectionRun(id, { status, notesCount = 0, errorMessage = null } = {}) {
  db.prepare(`
    UPDATE collection_runs
    SET finished_at = ?, status = ?, notes_count = ?, error_message = ?
    WHERE id = ?
  `).run(formatLocalTimestamp(), status ?? 'SUCCESS', notesCount, errorMessage, Number(id));
}

export function listCollectionRuns(limit = 10) {
  return db.prepare(`
    SELECT * FROM collection_runs
    ORDER BY id DESC
    LIMIT ?
  `).all(Number(limit));
}

export function upsertCollectedNotes(items) {
  const inserted = [];
  const findBySource = db.prepare('SELECT * FROM note_sources WHERE source_url = ?');
  const findByNoteId = db.prepare('SELECT * FROM notes WHERE id = ?');
  const insertNote = db.prepare(`
    INSERT INTO notes (
      id, title, author_name, publish_time, category, brand_name, cover_gradient,
      like_count, favorite_count, comment_count, engagement_rate, growth_rate,
      viral_score, viral_level, keywords_json, summary
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const updateNote = db.prepare(`
    UPDATE notes
    SET title = ?, author_name = ?, publish_time = ?, category = ?, brand_name = ?, cover_gradient = ?,
        like_count = ?, favorite_count = ?, comment_count = ?, engagement_rate = ?, growth_rate = ?,
        viral_score = ?, viral_level = ?, keywords_json = ?, summary = ?
    WHERE id = ?
  `);
  const insertSource = db.prepare(`
    INSERT INTO note_sources (
      id, note_id, platform, source_url, source_note_id, track_name, keyword, collected_at, raw_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const updateSource = db.prepare(`
    UPDATE note_sources
    SET track_name = ?, keyword = ?, collected_at = ?, raw_json = ?, source_note_id = ?
    WHERE id = ?
  `);

  for (const item of items) {
    const sourceUrl = item.sourceUrl;
    if (!sourceUrl) {
      continue;
    }

    const existingSource = findBySource.get(sourceUrl);
    const payload = [
      item.title,
      item.authorName,
      item.publishTime,
      item.category,
      item.brandName,
      item.coverGradient,
      item.likeCount,
      item.favoriteCount,
      item.commentCount,
      item.engagementRate,
      item.growthRate,
      item.viralScore,
      item.viralLevel,
      stringifyJson(item.keywords),
      item.summary,
    ];

    let noteId;
    if (existingSource) {
      noteId = existingSource.note_id;
      updateNote.run(...payload, noteId);
      updateSource.run(
        item.trackName,
        item.searchKeyword,
        item.collectedAt ?? formatLocalTimestamp(),
        JSON.stringify(item.raw ?? {}),
        item.sourceNoteId ?? null,
        existingSource.id,
      );
    } else {
      noteId = nextId('notes');
      insertNote.run(noteId, ...payload);
      insertSource.run(
        nextId('note_sources'),
        noteId,
        item.platform ?? 'xiaohongshu',
        sourceUrl,
        item.sourceNoteId ?? null,
        item.trackName,
        item.searchKeyword,
        item.collectedAt ?? formatLocalTimestamp(),
        JSON.stringify(item.raw ?? {}),
      );
    }

    const saved = findByNoteId.get(noteId);
    if (saved) {
      inserted.push(mapNote(saved));
    }
  }

  if (inserted.length > 0) {
    setCollectorCollectTime();
  }

  return inserted;
}

export function getDatabasePath() {
  return dbPath;
}
