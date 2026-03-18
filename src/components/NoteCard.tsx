import { Link } from 'react-router-dom';
import type { NoteSummary } from '../types';
import { formatNumber, levelLabel } from '../lib/format';

interface NoteCardProps {
  note: NoteSummary;
}

export function NoteCard({ note }: NoteCardProps) {
  return (
    <article className="note-card">
      <div className={`note-card__cover note-card__cover--${note.coverGradient}`}>
        <span className={`tag tag--${note.viralLevel.toLowerCase()}`}>{levelLabel(note.viralLevel)}</span>
      </div>
      <div className="note-card__body">
        <div className="note-card__meta">
          <span>{note.category}</span>
          <span>{note.publishTime}</span>
        </div>
        <h3>{note.title}</h3>
        <p>{note.summary}</p>
        <div className="chips">
          {note.keywords.map((keyword) => (
            <span key={keyword} className="chip">
              {keyword}
            </span>
          ))}
        </div>
        <div className="note-card__stats">
          <span>赞 {formatNumber(note.likeCount)}</span>
          <span>藏 {formatNumber(note.favoriteCount)}</span>
          <span>评 {formatNumber(note.commentCount)}</span>
          <strong>{note.viralScore}</strong>
        </div>
        <div className="note-card__footer">
          <span>{note.authorName}</span>
          <Link to={`/notes/${note.id}`} className="button button--ghost">
            查看详情
          </Link>
        </div>
      </div>
    </article>
  );
}
