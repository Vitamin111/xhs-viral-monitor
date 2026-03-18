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
      ruleName: 'Viral Rule v1',
      ruleReason: 'Save count is above category P90 and growth remains inside the prime discovery window.',
      scoreBreakdown: ['save 95', 'growth 88', 'comment 73', 'time decay 10'],
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
        description={`${note.authorName} · ${note.category} · Published ${note.publishTime}`}
        actions={
          <div className="inline-actions">
            <button className="button" onClick={toggleFavorite} disabled={favoriteBusy}>
              {favoriteBusy ? 'Saving...' : note.favoriteFolder ? 'Remove Favorite' : 'Save Favorite'}
            </button>
            <Link to="/discovery" className="button button--ghost">
              Back to list
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
          <SectionHeader title="Core Metrics" description="Computed from the latest snapshot." />
          <div className="stats-grid">
            <div className="stat-box">
              <span>Likes</span>
              <strong>{formatNumber(note.likeCount)}</strong>
            </div>
            <div className="stat-box">
              <span>Saves</span>
              <strong>{formatNumber(note.favoriteCount)}</strong>
            </div>
            <div className="stat-box">
              <span>Comments</span>
              <strong>{formatNumber(note.commentCount)}</strong>
            </div>
            <div className="stat-box">
              <span>Efficiency</span>
              <strong>{note.engagementRate}</strong>
            </div>
            <div className="stat-box">
              <span>Growth Rate</span>
              <strong>{note.growthRate}</strong>
            </div>
            <div className="stat-box">
              <span>Viral Score</span>
              <strong>{note.viralScore}</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <SectionHeader title="Rule Hit" description="Why this note is currently flagged by the system." />
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
          <SectionHeader title="Review Notes" description="Capture reusable takeaways for future planning." />
          <div className="favorite-box">
            <strong>{note.favoriteFolder ? `Saved to ${note.favoriteFolder}` : 'Not saved yet'}</strong>
            <p>{note.favoriteRemark ?? 'Record title structure, visual cues, and the strongest user demand signals.'}</p>
            <div className="chips">
              {(note.favoriteTags ?? ['high-save', 'before-after']).map((tag) => (
                <span key={tag} className="chip">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </article>
      </section>
      {noteState.error ? <p className="status-message">Detail API is unavailable, showing fallback data.</p> : null}
    </div>
  );
}
