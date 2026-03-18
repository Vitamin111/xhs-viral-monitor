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
      <SectionHeader title="收藏夹" description="沉淀可复盘案例、标签和备注。" />
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
              <span>收藏于 {item.savedAt}</span>
              <div className="inline-actions">
                <Link to={`/notes/${item.noteId}`} className="button button--ghost">
                  打开
                </Link>
                <button className="button button--ghost" onClick={() => removeFavorite(item.noteId)}>
                  移除
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>
      {favoritesState.error ? <p className="status-message">收藏接口暂不可用，当前显示本地回退数据。</p> : null}
    </div>
  );
}
