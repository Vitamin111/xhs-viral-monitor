import { Link } from 'react-router-dom';
import { SectionHeader } from '../components/SectionHeader';
import { alerts as fallbackAlerts } from '../data/mockData';
import { useApiData } from '../hooks/useApiData';
import { postJson } from '../lib/api';
import type { AlertItem } from '../types';

export function AlertsPage() {
  const alertsState = useApiData<AlertItem[]>('/api/alerts', fallbackAlerts);

  async function markAsRead(id: number) {
    await postJson<AlertItem, Record<string, never>>(`/api/alerts/${id}/read`, {});
    alertsState.refresh();
  }

  return (
    <div className="page">
      <SectionHeader title="预警中心" description="查看爆款命中、趋势激增和任务异常。" />
      <section className="panel">
        <div className="table">
          <div className="table__row table__row--head">
            <span>预警标题</span>
            <span>类型</span>
            <span>任务</span>
            <span>原因</span>
            <span>时间</span>
            <span>状态</span>
          </div>
          {alertsState.data.map((alert) => (
            <div key={alert.id} className="table__row">
              <span>
                <strong>{alert.title}</strong>
                <small>{alert.level}</small>
              </span>
              <span>{alert.alertType}</span>
              <span>{alert.taskName}</span>
              <span>{alert.reason}</span>
              <span>{alert.noteId ? <Link to={`/notes/${alert.noteId}`}>{alert.createdAt}</Link> : alert.createdAt}</span>
              <span className="table__action-cell">
                <strong>{alert.read ? '已读' : '未读'}</strong>
                {!alert.read ? (
                  <button className="button button--ghost button--small" onClick={() => markAsRead(alert.id)}>
                    标记已读
                  </button>
                ) : null}
              </span>
            </div>
          ))}
        </div>
        {alertsState.error ? <p className="status-message">预警接口暂不可用，当前显示本地回退数据。</p> : null}
      </section>
    </div>
  );
}
