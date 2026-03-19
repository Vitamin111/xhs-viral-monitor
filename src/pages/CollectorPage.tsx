import { useMemo, useState } from 'react';
import { SectionHeader } from '../components/SectionHeader';
import { useApiData } from '../hooks/useApiData';
import { formatNumber, levelLabel } from '../lib/format';
import type { CollectedNotesResponse } from '../types';

const fallbackCollectedNotes: CollectedNotesResponse = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 20,
  totalPages: 1,
  tracks: [],
};

const pageSizeOptions = [20, 50, 100];

export function CollectorPage() {
  const [keyword, setKeyword] = useState('');
  const [track, setTrack] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const requestPath = useMemo(() => {
    const params = new URLSearchParams({
      keyword,
      track,
      page: String(page),
      pageSize: String(pageSize),
    });
    return `/api/collector/notes?${params.toString()}`;
  }, [keyword, page, pageSize, track]);

  const collectedState = useApiData<CollectedNotesResponse>(requestPath, fallbackCollectedNotes);
  const items = collectedState.data.items ?? [];
  const tracks = ['ALL'].concat(collectedState.data.tracks ?? []);

  function applyKeyword(value: string) {
    setKeyword(value);
    setPage(1);
  }

  function applyTrack(value: string) {
    setTrack(value);
    setPage(1);
  }

  function applyPageSize(value: number) {
    setPageSize(value);
    setPage(1);
  }

  return (
    <div className="page">
      <SectionHeader
        title="真实采集"
        description="展示已写入数据库的小红书真实采集结果，每条都带原帖链接。"
      />

      <section className="panel collector-summary">
        <div className="metric-card collector-summary__card">
          <span>当前已入库</span>
          <strong>{collectedState.data.total}</strong>
          <em>仅统计带来源链接的真实采集内容</em>
        </div>
        <div className="collector-toolbar">
          <input
            className="search search--wide"
            value={keyword}
            onChange={(event) => applyKeyword(event.target.value)}
            placeholder="搜索标题、作者、关键词"
          />
          <select className="select" value={track} onChange={(event) => applyTrack(event.target.value)}>
            {tracks.map((item) => (
              <option key={item} value={item}>
                {item === 'ALL' ? '全部赛道' : item}
              </option>
            ))}
          </select>
          <select
            className="select"
            value={pageSize}
            onChange={(event) => applyPageSize(Number(event.target.value))}
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                每页 {option} 条
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="panel">
        <div className="table table--collector">
          <div className="table__row table__row--head table__row--collector">
            <span>标题</span>
            <span>赛道</span>
            <span>关键词</span>
            <span>互动数据</span>
            <span>采集时间</span>
            <span>原帖</span>
          </div>
          {items.map((item) => (
            <div key={`${item.id}-${item.sourceUrl}`} className="table__row table__row--collector">
              <span>
                <strong>{item.title}</strong>
                <small>{item.authorName}</small>
              </span>
              <span>
                <strong>{item.trackName}</strong>
                <small>{levelLabel(item.viralLevel)}</small>
              </span>
              <span>{item.searchKeyword}</span>
              <span>
                <strong>赞 {formatNumber(item.likeCount)}</strong>
                <small>藏 {formatNumber(item.favoriteCount)} / 评 {formatNumber(item.commentCount)}</small>
              </span>
              <span>{item.collectedAt}</span>
              <span className="table__action-cell">
                <a className="button button--ghost button--small" href={item.sourceUrl} target="_blank" rel="noreferrer">
                  打开原帖
                </a>
              </span>
            </div>
          ))}
        </div>

        <div className="pagination-bar">
          <span>
            第 {collectedState.data.page} / {collectedState.data.totalPages} 页，共 {collectedState.data.total} 条
          </span>
          <div className="inline-actions">
            <button
              className="button button--ghost button--small"
              disabled={collectedState.data.page <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              上一页
            </button>
            <button
              className="button button--ghost button--small"
              disabled={collectedState.data.page >= collectedState.data.totalPages}
              onClick={() => setPage((value) => Math.min(collectedState.data.totalPages, value + 1))}
            >
              下一页
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <p className="status-message">当前没有符合条件的真实采集数据。可以先调整筛选条件再查看。</p>
        ) : null}
        {collectedState.error ? <p className="status-message">真实采集接口暂不可用，建议先检查 API 是否已启动。</p> : null}
      </section>
    </div>
  );
}
