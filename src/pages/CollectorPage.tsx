import { SectionHeader } from '../components/SectionHeader';
import { useApiData } from '../hooks/useApiData';
import { formatNumber, levelLabel } from '../lib/format';
import type { CollectedNoteItem } from '../types';

const fallbackCollectedNotes: CollectedNoteItem[] = [];

const trackOptions = ['ALL', '护肤', '穿搭', '美食', '香氛'] as const;

export function CollectorPage() {
  const collectedState = useApiData<CollectedNoteItem[]>('/api/collector/notes', fallbackCollectedNotes);

  return (
    <div className="page">
      <SectionHeader
        title="真实采集"
        description="展示已写入数据库的小红书真实采集结果，每条都带原帖链接。"
      />

      <section className="panel collector-summary">
        <div className="metric-card collector-summary__card">
          <span>当前已入库</span>
          <strong>{collectedState.data.length}</strong>
          <em>仅统计带来源链接的真实采集内容</em>
        </div>
        <div className="collector-track-list">
          {trackOptions.map((track) => (
            <span key={track} className="chip">
              {track === 'ALL' ? '全部赛道' : track}
            </span>
          ))}
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
          {collectedState.data.map((item) => (
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
                <a
                  className="button button--ghost button--small"
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  打开原帖
                </a>
              </span>
            </div>
          ))}
        </div>
        {collectedState.data.length === 0 ? (
          <p className="status-message">当前还没有真实采集数据。请先执行一次 `run-xhs-collect.bat`。</p>
        ) : null}
        {collectedState.error ? <p className="status-message">真实采集接口暂不可用，建议先检查 API 是否已启动。</p> : null}
      </section>
    </div>
  );
}
