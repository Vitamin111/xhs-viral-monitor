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
      <SectionHeader title="Alert Center" description="Review viral hits, trend surges, and task exceptions." />
      <section className="panel">
        <div className="table">
          <div className="table__row table__row--head">
            <span>Alert Title</span>
            <span>Type</span>
            <span>Task</span>
            <span>Reason</span>
            <span>Time</span>
            <span>Status</span>
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
                <strong>{alert.read ? 'Read' : 'Unread'}</strong>
                {!alert.read ? (
                  <button className="button button--ghost button--small" onClick={() => markAsRead(alert.id)}>
                    Mark read
                  </button>
                ) : null}
              </span>
            </div>
          ))}
        </div>
        {alertsState.error ? <p className="status-message">Alert API is unavailable, showing fallback data.</p> : null}
      </section>
    </div>
  );
}
