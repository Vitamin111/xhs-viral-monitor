export type ViralLevel = 'NORMAL' | 'POTENTIAL' | 'VIRAL';

export interface NoteSummary {
  id: number;
  title: string;
  authorName: string;
  publishTime: string;
  category: string;
  brandName: string;
  coverGradient: string;
  likeCount: number;
  favoriteCount: number;
  commentCount: number;
  engagementRate: number;
  growthRate: number;
  viralScore: number;
  viralLevel: ViralLevel;
  keywords: string[];
  summary: string;
}

export interface TaskItem {
  id: number;
  taskName: string;
  taskType: 'KEYWORD' | 'BRAND' | 'AUTHOR' | 'COMPETITOR' | 'CATEGORY';
  status: 'ACTIVE' | 'PAUSED' | 'FAILED';
  targets: string[];
  cadence: string;
  lastRunAt: string;
  nextRunAt: string;
  viralCount: number;
  alertCount: number;
  failCount: number;
}

export interface AlertItem {
  id: number;
  alertType: 'VIRAL_HIT' | 'POTENTIAL_VIRAL_HIT' | 'KEYWORD_SURGE' | 'TASK_EXCEPTION';
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  reason: string;
  taskName: string;
  createdAt: string;
  noteId?: number;
  read: boolean;
}

export interface FavoriteItem {
  id: number;
  noteId: number;
  folder: string;
  tags: string[];
  remark: string;
  savedAt: string;
}

export interface DashboardStat {
  label: string;
  value: string;
  change: string;
}

export interface KeywordTrend {
  keyword: string;
  score: number;
  delta: string;
}

export interface NoteDetail extends NoteSummary {
  ruleName: string;
  ruleReason: string;
  scoreBreakdown: string[];
  favoriteFolder?: string;
  favoriteRemark?: string;
  favoriteTags?: string[];
  sourceUrl?: string;
  sourceTrackName?: string;
  sourceKeyword?: string;
  collectedAt?: string;
}

export interface FavoriteViewItem extends FavoriteItem {
  note: NoteSummary;
}

export interface CreateTaskPayload {
  taskName: string;
  taskType: 'KEYWORD' | 'BRAND' | 'AUTHOR' | 'COMPETITOR' | 'CATEGORY';
  targets: string[];
  cadence: string;
}

export interface FavoriteToggleResponse {
  favorited: boolean;
  favorite?: FavoriteViewItem;
}

export interface UpdateTaskPayload extends CreateTaskPayload {
  status?: TaskItem['status'];
}

export interface CollectorTrack {
  id: string;
  name: string;
  keywords: string[];
  enabled: boolean;
}

export interface CollectorSettings {
  platformName: string;
  loginStatus: string;
  manualLoginRequired: boolean;
  headedMode: boolean;
  sessionFile: string;
  lastLoginAt: string | null;
  lastCollectAt: string | null;
  enabledTracks: CollectorTrack[];
}

export interface CollectedNoteItem extends NoteSummary {
  sourceUrl: string;
  sourceNoteId?: string | null;
  platform: string;
  trackName: string;
  searchKeyword: string;
  collectedAt: string;
}
