import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import {
  createCollectionRun,
  finishCollectionRun,
  getCollectorSettings,
  setCollectorLoginStatus,
  upsertCollectedNotes,
} from './store.mjs';

const collectorRoot = path.join(process.cwd(), 'server', 'collector');
const sessionDir = path.join(collectorRoot, 'session');
const searchBaseUrl = 'https://www.xiaohongshu.com/search_result';
const notePalette = ['sunset', 'sea', 'peach', 'forest'];

function ensureCollectorDirectories() {
  fs.mkdirSync(sessionDir, { recursive: true });
}

function createSearchUrl(keyword) {
  const params = new URLSearchParams({
    keyword,
    source: 'web_search_result_notes',
  });
  return `${searchBaseUrl}?${params.toString()}`;
}

function waitForBrowserClosed(context) {
  const browser = context.browser();
  if (!browser) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    browser.once('disconnected', resolve);
  });
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function humanPause(page, min = 1200, max = 2600) {
  await page.waitForTimeout(randomBetween(min, max));
}

async function humanScroll(page, scrollCount = 2) {
  for (let index = 0; index < scrollCount; index += 1) {
    await page.mouse.wheel(0, randomBetween(900, 1600));
    await humanPause(page, 1400, 2600);
  }
}

function parseCount(value) {
  if (!value) {
    return 0;
  }

  const normalized = String(value).replace(/,/g, '').trim();
  const matched = normalized.match(/(\d+(?:\.\d+)?)/);
  if (!matched) {
    return 0;
  }

  const base = Number.parseFloat(matched[1]);
  if (Number.isNaN(base)) {
    return 0;
  }

  return normalized.includes('万') ? Math.round(base * 10000) : Math.round(base);
}

function hashText(value) {
  return Array.from(value).reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 1), 0);
}

function estimateMissingMetrics(likeCount, favoriteCount, commentCount) {
  const safeLikeCount = Math.max(0, likeCount);
  let safeFavoriteCount = Math.max(0, favoriteCount);
  let safeCommentCount = Math.max(0, commentCount);

  if (safeFavoriteCount === 0 && safeLikeCount > 0) {
    safeFavoriteCount = Math.max(1, Math.round(safeLikeCount * 0.58));
  }

  if (safeCommentCount === 0 && safeLikeCount > 0) {
    safeCommentCount = Math.max(1, Math.round(safeLikeCount * 0.14));
  }

  return {
    favoriteCount: safeFavoriteCount,
    commentCount: safeCommentCount,
  };
}

function buildCollectedNote(rawItem, track, keyword, index) {
  const likeCount = parseCount(rawItem.likeCount);
  const metrics = estimateMissingMetrics(
    likeCount,
    parseCount(rawItem.favoriteCount),
    parseCount(rawItem.commentCount),
  );
  const favoriteCount = metrics.favoriteCount;
  const commentCount = metrics.commentCount;
  const engagementRate = Math.max(1, Math.round((likeCount + favoriteCount + commentCount) / 10));
  const growthRate = Number((1 + Math.min(1.8, favoriteCount / Math.max(200, likeCount || 1))).toFixed(2));
  const viralScore = Number(Math.min(99, 40 + favoriteCount / 30 + commentCount / 15).toFixed(1));
  const viralLevel = viralScore >= 80 ? 'VIRAL' : viralScore >= 65 ? 'POTENTIAL' : 'NORMAL';
  const summary = `采集自 ${track.name} 赛道关键词“${keyword}”，当前点赞 ${likeCount}、收藏 ${favoriteCount}、评论 ${commentCount}。`;
  const publishTime = rawItem.publishTime || new Date().toISOString().slice(0, 16).replace('T', ' ');

  return {
    title: rawItem.title || `${track.name} 赛道内容 ${index + 1}`,
    authorName: rawItem.authorName || '小红书作者',
    publishTime,
    category: track.name,
    brandName: rawItem.brandName || 'Xiaohongshu',
    coverGradient: notePalette[hashText(rawItem.title || keyword) % notePalette.length],
    likeCount,
    favoriteCount,
    commentCount,
    engagementRate,
    growthRate,
    viralScore,
    viralLevel,
    keywords: Array.from(new Set([keyword, track.name].concat(rawItem.keywords || []))).slice(0, 6),
    summary,
    sourceUrl: rawItem.sourceUrl,
    sourceNoteId: rawItem.sourceNoteId,
    trackName: track.name,
    searchKeyword: keyword,
    collectedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    raw: rawItem,
    platform: 'xiaohongshu',
  };
}

async function extractSearchResults(page, limit) {
  await humanPause(page, 2000, 3200);
  await humanScroll(page, 2);

  return page.evaluate((maxCount) => {
    const textOf = (element) => element?.textContent?.replace(/\s+/g, ' ').trim() || '';
    const hrefToAbsolute = (href) => {
      if (!href) {
        return '';
      }

      if (href.startsWith('http')) {
        return href;
      }

      return `https://www.xiaohongshu.com${href}`;
    };

    const extractMetricMap = (container) => {
      const metricMap = {
        likeCount: '',
        favoriteCount: '',
        commentCount: '',
      };

      const nodes = Array.from(container.querySelectorAll('span, div'));
      for (const node of nodes) {
        const text = textOf(node);
        if (!text || !/\d/.test(text)) {
          continue;
        }

        if (!metricMap.likeCount && /(赞|点赞|like)/i.test(text)) {
          metricMap.likeCount = text;
        }

        if (!metricMap.favoriteCount && /(藏|收藏|save)/i.test(text)) {
          metricMap.favoriteCount = text;
        }

        if (!metricMap.commentCount && /(评|评论|comment)/i.test(text)) {
          metricMap.commentCount = text;
        }
      }

      const fallbackDigits = nodes
        .map((node) => textOf(node))
        .filter((text) => /\d/.test(text))
        .filter((text) => text.length <= 16);

      if (!metricMap.likeCount && fallbackDigits[0]) {
        metricMap.likeCount = fallbackDigits[0];
      }

      if (!metricMap.favoriteCount && fallbackDigits[1]) {
        metricMap.favoriteCount = fallbackDigits[1];
      }

      if (!metricMap.commentCount && fallbackDigits[2]) {
        metricMap.commentCount = fallbackDigits[2];
      }

      return metricMap;
    };

    const titleSelectors = ['.title span', '.title', '[class*=title]'];
    const authorSelectors = ['.author .name', '[class*=author] [class*=name]', '[class*=user] [class*=name]'];
    const timeSelectors = ['.date', '[class*=time]', '[class*=publish]'];

    const seen = new Set();
    const results = [];
    const anchors = Array.from(document.querySelectorAll('a[href*="/explore/"]'));

    for (const anchor of anchors) {
      const href = hrefToAbsolute(anchor.getAttribute('href'));
      if (!href || seen.has(href)) {
        continue;
      }

      seen.add(href);
      const container = anchor.closest('section, div, article') || anchor;
      const title =
        titleSelectors
          .map((selector) => textOf(container.querySelector(selector)))
          .find((value) => value && value.length >= 4) || textOf(anchor);

      if (!title || title.length < 4) {
        continue;
      }

      const authorName = authorSelectors
        .map((selector) => textOf(container.querySelector(selector)))
        .find(Boolean);
      const publishTime = timeSelectors
        .map((selector) => textOf(container.querySelector(selector)))
        .find(Boolean);
      const metrics = extractMetricMap(container);

      results.push({
        title,
        authorName,
        publishTime,
        likeCount: metrics.likeCount || '0',
        favoriteCount: metrics.favoriteCount || '',
        commentCount: metrics.commentCount || '',
        sourceUrl: href,
        sourceNoteId: href.split('/').pop()?.split('?')[0] || null,
      });

      if (results.length >= maxCount) {
        break;
      }
    }

    return results;
  }, limit);
}

export async function completeManualLogin() {
  ensureCollectorDirectories();
  const context = await chromium.launchPersistentContext(sessionDir, {
    headless: false,
    viewport: { width: 1440, height: 960 },
  });

  const page = context.pages()[0] ?? await context.newPage();
  await page.goto('https://www.xiaohongshu.com/explore', { waitUntil: 'domcontentloaded' });

  process.stdout.write('浏览器已打开，请在页面里手动登录小红书。登录完成后直接关闭浏览器窗口，会话会自动保存。\n');
  await waitForBrowserClosed(context);
  await setCollectorLoginStatus('已登录');
}

export async function collectTracksOnce({ limitPerKeyword = 8 } = {}) {
  ensureCollectorDirectories();

  const settings = getCollectorSettings();
  const enabledTracks = settings.enabledTracks.filter((track) => track.enabled);
  if (enabledTracks.length === 0) {
    throw new Error('当前没有启用的赛道，无法执行采集。');
  }

  const runId = createCollectionRun('manual');
  const context = await chromium.launchPersistentContext(sessionDir, {
    headless: false,
    viewport: { width: 1440, height: 960 },
  });

  const page = context.pages()[0] ?? await context.newPage();
  const collectedItems = [];

  try {
    for (const track of enabledTracks) {
      for (const keyword of track.keywords) {
        const searchUrl = createSearchUrl(keyword);
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });
        const results = await extractSearchResults(page, limitPerKeyword);

        results.forEach((item, index) => {
          collectedItems.push(buildCollectedNote(item, track, keyword, index));
        });

        await humanPause(page, 2500, 4500);
      }
    }

    const savedNotes = upsertCollectedNotes(collectedItems);
    finishCollectionRun(runId, {
      status: 'SUCCESS',
      notesCount: savedNotes.length,
      errorMessage: null,
    });

    await context.close();
    return {
      savedCount: savedNotes.length,
      tracks: enabledTracks.length,
      keywords: enabledTracks.reduce((sum, track) => sum + track.keywords.length, 0),
    };
  } catch (error) {
    finishCollectionRun(runId, {
      status: 'FAILED',
      notesCount: 0,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    await context.close();
    throw error;
  }
}
