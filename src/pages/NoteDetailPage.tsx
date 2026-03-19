import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SectionHeader } from '../components/SectionHeader';
import { favorites, notes } from '../data/mockData';
import { useApiData } from '../hooks/useApiData';
import { postJson } from '../lib/api';
import { formatNumber, levelLabel } from '../lib/format';
import type { FavoriteToggleResponse, NoteDetail } from '../types';

export function NoteDetailPage() {
  const { noteId } = useParams();
  const [favoriteBusy, setFavoriteBusy] = useState(false);

  const fallback = useMemo<NoteDetail>(() => {
    const note = notes.find((item) => item.id === Number(noteId)) ?? notes[0];
    const favorite = favorites.find((item) => item.noteId === note.id);

    return {
      ...note,
      ruleName: '爆款识别规则 v2',
      ruleReason: `系统基于收藏、增长、评论和时效四类信号计算爆款分 ${note.viralScore}。`,
      scoreBreakdown: ['收藏效率 75%', '增长率 1.82', '评论互动 19%', `爆款分 ${note.viralScore}`],
      ruleHighlights: [
        '收藏量明显高于普通内容，说明用户愿意保存或回看。',
        '增长率仍在高位，说明内容还处于扩散期。',
        '评论区有持续互动，说明内容不只是被浏览，也引发了表达。',
        '建议复盘标题结构、封面元素和评论区高频问题。',
      ],
      favoriteFolder: favorite?.folder,
      favoriteRemark: favorite?.remark,
      favoriteTags: favorite?.tags,
    };
  }, [noteId]);

  const noteState = useApiData<NoteDetail>(`/api/notes/${noteId}`, fallback);
  const note = noteState.data;

  async function toggleFavorite() {
    setFavoriteBusy(true);
    try {
      await postJson<FavoriteToggleResponse, { noteId: number }>(
        '/api/favorites/toggle',
        { noteId: note.id },
      );
      noteState.refresh();
    } finally {
      setFavoriteBusy(false);
    }
  }

  return (
    <div className="page">
      <SectionHeader
        title={note.title}
        description={`${note.authorName} · ${note.category} · 发布时间 ${note.publishTime}`}
        actions={
          <div className="inline-actions">
            {note.sourceUrl ? (
              <a className="button button--ghost" href={note.sourceUrl} target="_blank" rel="noreferrer">
                打开原帖
              </a>
            ) : null}
            <button className="button" onClick={toggleFavorite} disabled={favoriteBusy}>
              {favoriteBusy ? '保存中...' : note.favoriteFolder ? '取消收藏' : '加入收藏'}
            </button>
            <Link to="/discovery" className="button button--ghost">
              返回列表
            </Link>
          </div>
        }
      />

      <section className="detail-grid">
        <article className="panel detail-cover">
          <div className={`note-card__cover note-card__cover--${note.coverGradient} detail-cover__visual`}>
            <span className={`tag tag--${note.viralLevel.toLowerCase()}`}>{levelLabel(note.viralLevel)}</span>
          </div>
          <div className="chips">
            {note.keywords.map((keyword) => (
              <span key={keyword} className="chip">
                {keyword}
              </span>
            ))}
          </div>
          <p>{note.summary}</p>
        </article>

        <article className="panel">
          <SectionHeader title="核心指标" description="基于最近一次快照计算。" />
          <div className="stats-grid">
            <div className="stat-box">
              <span>点赞</span>
              <strong>{formatNumber(note.likeCount)}</strong>
            </div>
            <div className="stat-box">
              <span>收藏</span>
              <strong>{formatNumber(note.favoriteCount)}</strong>
            </div>
            <div className="stat-box">
              <span>评论</span>
              <strong>{formatNumber(note.commentCount)}</strong>
            </div>
            <div className="stat-box">
              <span>互动效率</span>
              <strong>{note.engagementRate}</strong>
            </div>
            <div className="stat-box">
              <span>增长率</span>
              <strong>{note.growthRate}</strong>
            </div>
            <div className="stat-box">
              <span>爆款分</span>
              <strong>{note.viralScore}</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <SectionHeader title="命中规则" description="解释这条内容为什么会被系统识别出来。" />
          <div className="rule-list">
            <div className="rule-item">
              <strong>{note.ruleName}</strong>
              <p>{note.ruleReason}</p>
            </div>
            <div className="rule-breakdown">
              {note.scoreBreakdown.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
            <div className="rule-highlight-list">
              {note.ruleHighlights.map((item) => (
                <div key={item} className="rule-highlight-item">
                  {item}
                </div>
              ))}
            </div>
            {note.sourceUrl ? (
              <div className="source-meta">
                <strong>来源赛道：{note.sourceTrackName ?? '真实采集'}</strong>
                <span>采集关键词：{note.sourceKeyword ?? '未记录'}</span>
                <span>采集时间：{note.collectedAt ?? '未记录'}</span>
              </div>
            ) : null}
          </div>
        </article>

        <article className="panel">
          <SectionHeader title="复盘备注" description="沉淀后续选题和策略可复用的结论。" />
          <div className="favorite-box">
            <strong>{note.favoriteFolder ? `已收藏到 ${note.favoriteFolder}` : '暂未收藏'}</strong>
            <p>{note.favoriteRemark ?? '建议记录标题结构、封面元素和评论区里出现频率最高的需求点。'}</p>
            <div className="chips">
              {(note.favoriteTags ?? ['高收藏', '对比型封面']).map((tag) => (
                <span key={tag} className="chip">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </article>
      </section>
      {noteState.error ? <p className="status-message">详情接口暂不可用，当前显示本地回退数据。</p> : null}
    </div>
  );
}
