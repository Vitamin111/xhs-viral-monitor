import { Link } from 'react-router-dom';
import { MetricCard } from '../components/MetricCard';
import { NoteCard } from '../components/NoteCard';
import { SectionHeader } from '../components/SectionHeader';
import { alerts, dashboardStats, keywordTrends, notes, tasks } from '../data/mockData';
import { useApiData } from '../hooks/useApiData';
import type { AlertItem, DashboardStat, KeywordTrend, NoteSummary, TaskItem } from '../types';

export function DashboardPage() {
  const statsState = useApiData<DashboardStat[]>('/api/dashboard/overview', dashboardStats);
  const trendsState = useApiData<KeywordTrend[]>('/api/dashboard/keyword-trends', keywordTrends);
  const alertsState = useApiData<AlertItem[]>('/api/dashboard/recent-alerts', alerts);
  const notesState = useApiData<NoteSummary[]>('/api/dashboard/featured-notes', notes.slice(0, 2));
  const tasksState = useApiData<TaskItem[]>('/api/dashboard/focus-tasks', tasks);

  return (
    <div className="page">
      <section className="hero">
        <div>
          <div className="eyebrow">今日重点</div>
          <h2>高收藏、高对比、高模板化内容，仍然是当前四个赛道里最容易跑出来的爆款结构。</h2>
          <p>建议优先跟进护肤、通勤穿搭、美食早餐和香氛清单这四个方向，并重点观察内容发布后 6 小时内的收藏效率。</p>
        </div>
        <div className="hero__panel">
          <span className="hero__label">系统建议</span>
          <strong>今天优先复盘 2 条新增爆款</strong>
          <p>其中 1 条来自核心监控任务，1 条来自系统趋势发现，适合直接进入选题会。</p>
        </div>
      </section>

      <section className="metrics-grid">
        {statsState.data.map((item) => (
          <MetricCard key={item.label} {...item} />
        ))}
      </section>

      <section className="panel-grid panel-grid--dashboard">
        <div className="panel">
          <SectionHeader title="热门关键词趋势" description="近 24 小时赛道热度排序" />
          <div className="trend-list">
            {trendsState.data.map((item) => (
              <div key={item.keyword} className="trend-row">
                <div>
                  <strong>{item.keyword}</strong>
                  <span>热度分 {item.score}</span>
                </div>
                <em>{item.delta}</em>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <SectionHeader title="最新预警" description="最近触发的重要信号" />
          <div className="alert-feed">
            {alertsState.data.map((alert) => (
              <Link key={alert.id} to={alert.noteId ? `/notes/${alert.noteId}` : '/alerts'} className="alert-feed__item">
                <span className={`pill pill--${alert.level.toLowerCase()}`}>{alert.level}</span>
                <strong>{alert.title}</strong>
                <p>{alert.reason}</p>
                <small>{alert.createdAt}</small>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="panel-grid panel-grid--dashboard">
        <div className="panel">
          <SectionHeader
            title="今日新增爆款"
            description="建议优先复盘的内容"
            actions={<Link to="/discovery" className="button">查看全部</Link>}
          />
          <div className="stack">
            {notesState.data.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        </div>
        <div className="panel">
          <SectionHeader
            title="重点监控任务"
            description="当前运行中的任务健康度"
            actions={<Link to="/tasks" className="button button--ghost">管理任务</Link>}
          />
          <div className="task-list">
            {tasksState.data.map((task) => (
              <div key={task.id} className="task-row">
                <div>
                  <strong>{task.taskName}</strong>
                  <span>{task.targets.join(' / ')}</span>
                </div>
                <div>
                  <em>{task.status}</em>
                  <small>下次执行 {task.nextRunAt}</small>
                </div>
              </div>
            ))}
          </div>
          {statsState.error || trendsState.error || alertsState.error || notesState.error || tasksState.error ? (
            <p className="status-message">当前显示的是本地回退数据，API 暂未连接。</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
