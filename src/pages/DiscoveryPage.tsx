import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { NoteCard } from '../components/NoteCard';
import { SectionHeader } from '../components/SectionHeader';
import { notes } from '../data/mockData';
import { useApiData } from '../hooks/useApiData';
import { formatNumber, levelLabel } from '../lib/format';
import type { NoteSummary } from '../types';

export function DiscoveryPage() {
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState<'ALL' | 'VIRAL' | 'POTENTIAL' | 'NORMAL'>('ALL');
  const [view, setView] = useState<'card' | 'table'>('card');
  const notesState = useApiData<NoteSummary[]>('/api/notes', notes);

  const filteredNotes = useMemo(() => {
    return notesState.data.filter((note) => {
      const matchesQuery =
        !query ||
        note.title.includes(query) ||
        note.authorName.includes(query) ||
        note.keywords.some((keyword) => keyword.includes(query));
      const matchesLevel = level === 'ALL' || note.viralLevel === level;

      return matchesQuery && matchesLevel;
    });
  }, [level, notesState.data, query]);

  return (
    <div className="page">
      <SectionHeader
        title="爆款发现"
        description="按关键词、类目和爆款等级查看当前值得跟进的内容。"
        actions={
          <div className="toolbar">
            <button className={`button ${view === 'card' ? '' : 'button--ghost'}`} onClick={() => setView('card')}>
              卡片
            </button>
            <button className={`button ${view === 'table' ? '' : 'button--ghost'}`} onClick={() => setView('table')}>
              表格
            </button>
          </div>
        }
      />

      <section className="panel filters">
        <input
          className="search search--wide"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索关键词、标题或达人"
        />
        <select value={level} onChange={(event) => setLevel(event.target.value as typeof level)} className="select">
          <option value="ALL">全部等级</option>
          <option value="VIRAL">爆款</option>
          <option value="POTENTIAL">潜力</option>
          <option value="NORMAL">普通</option>
        </select>
        <div className="filters__summary">当前共 {filteredNotes.length} 条内容</div>
        {notesState.loading ? <div className="filters__summary">正在加载最新数据...</div> : null}
        {notesState.error ? <div className="filters__summary">API 不可用，当前显示本地回退数据</div> : null}
      </section>

      {view === 'card' ? (
        <section className="card-grid">
          {filteredNotes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </section>
      ) : (
        <section className="panel">
          <div className="table">
            <div className="table__row table__row--head">
              <span>标题</span>
              <span>作者</span>
              <span>类目</span>
              <span>互动</span>
              <span>爆款分</span>
              <span>等级</span>
            </div>
            {filteredNotes.map((note) => (
              <Link key={note.id} className="table__row" to={`/notes/${note.id}`}>
                <span>
                  <strong>{note.title}</strong>
                  <small>{note.publishTime}</small>
                </span>
                <span>{note.authorName}</span>
                <span>{note.category}</span>
                <span>{formatNumber(note.favoriteCount)}</span>
                <span>{note.viralScore}</span>
                <span>{levelLabel(note.viralLevel)}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
