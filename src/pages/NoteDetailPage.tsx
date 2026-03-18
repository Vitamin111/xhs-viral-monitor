import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SectionHeader } from '../components/SectionHeader';
import { favorites, notes } from '../data/mockData';
import { useApiData } from '../hooks/useApiData';
import { formatNumber, levelLabel } from '../lib/format';
import type { NoteDetail } from '../types';

export function NoteDetailPage() {
  const { noteId } = useParams();
  const fallback = useMemo<NoteDetail>(() => {
    const note = notes.find((item) => item.id === Number(noteId)) ?? notes[0];
    const favorite = favorites.find((item) => item.noteId === note.id);

    return {
      ...note,
      ruleName: '爆款识别规则 v1',
      ruleReason: '收藏数高于类目 P90，且增长分显著高于类目均值，发布时间仍处于黄金窗口。',
      scoreBreakdown: ['收藏分 95', '增长分 88', '评论分 73', '时间衰减 10'],
      favoriteFolder: favorite?.folder,
      favoriteRemark: favorite?.remark,
      favoriteTags: favorite?.tags,
    };
  }, [noteId]);
  const noteState = useApiData<NoteDetail>(`/api/notes/${noteId}`, fallback);
  const note = noteState.data;

  return (
    <div className="page">
      <SectionHeader
        title={note.title}
        description={`${note.authorName} · ${note.category} · 发布时间 ${note.publishTime}`}
        actions={<Link to="/discovery" className="button button--ghost">返回列表</Link>}
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
          <SectionHeader title="核心指标" description="基于最近一次快照计算" />
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
          <SectionHeader title="命中规则" description="当前内容命中原因说明" />
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
          </div>
        </article>

        <article className="panel">
          <SectionHeader title="复盘备注" description="沉淀可复用的内容结论" />
          <div className="favorite-box">
            <strong>{note.favoriteFolder ? `已收藏到 ${note.favoriteFolder}` : '尚未收藏'}</strong>
            <p>{note.favoriteRemark ?? '建议记录标题结构、封面元素和评论高频诉求。'}</p>
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
      {noteState.error ? <p className="status-message">详情接口未连接，当前显示本地回退数据。</p> : null}
    </div>
  );
}
