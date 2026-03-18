import { Link } from 'react-router-dom';
import { SectionHeader } from '../components/SectionHeader';
import { favorites, notes } from '../data/mockData';
import { useApiData } from '../hooks/useApiData';
import { postJson } from '../lib/api';
import type { FavoriteToggleResponse, FavoriteViewItem } from '../types';

export function FavoritesPage() {
  const fallback = favorites.map((favorite) => ({
    ...favorite,
    note: notes.find((note) => note.id === favorite.noteId)!,
  }));
  const favoritesState = useApiData<FavoriteViewItem[]>('/api/favorites', fallback);

  async function removeFavorite(noteId: number) {
    await postJson<FavoriteToggleResponse, { noteId: number }>(
      '/api/favorites/toggle',
      { noteId },
    );
    favoritesState.refresh();
  }

  return (
    <div className="page">
      <SectionHeader title="Favorites" description="Keep reusable cases, notes, and tags in one place." />
      <section className="card-grid">
        {favoritesState.data.map((item) => (
          <article key={item.id} className="panel favorite-card">
            <div>
              <span className="eyebrow">{item.folder}</span>
              <h3>{item.note?.title}</h3>
              <p>{item.remark}</p>
            </div>
            <div className="chips">
              {item.tags.map((tag) => (
                <span key={tag} className="chip">
                  {tag}
                </span>
              ))}
            </div>
            <div className="favorite-card__footer">
              <span>Saved at {item.savedAt}</span>
              <div className="inline-actions">
                <Link to={`/notes/${item.noteId}`} className="button button--ghost">
                  Open
                </Link>
                <button className="button button--ghost" onClick={() => removeFavorite(item.noteId)}>
                  Remove
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>
      {favoritesState.error ? <p className="status-message">Favorites API is unavailable, showing fallback data.</p> : null}
    </div>
  );
}
