import { SectionHeader } from '../components/SectionHeader';
import { tasks } from '../data/mockData';
import { useApiData } from '../hooks/useApiData';
import type { TaskItem } from '../types';

export function TasksPage() {
  const tasksState = useApiData<TaskItem[]>('/api/tasks', tasks);

  return (
    <div className="page">
      <SectionHeader
        title="监控中心"
        description="管理关键词、品牌、达人与竞品任务。"
        actions={<button className="button">新建任务</button>}
      />

      <section className="panel">
        <div className="table">
          <div className="table__row table__row--head">
            <span>任务名称</span>
            <span>类型</span>
            <span>监控对象</span>
            <span>状态</span>
            <span>执行频率</span>
            <span>最近结果</span>
          </div>
          {tasksState.data.map((task) => (
            <div key={task.id} className="table__row">
              <span>
                <strong>{task.taskName}</strong>
                <small>下次执行 {task.nextRunAt}</small>
              </span>
              <span>{task.taskType}</span>
              <span>{task.targets.join(' / ')}</span>
              <span>{task.status}</span>
              <span>{task.cadence}</span>
              <span>命中 {task.viralCount} / 预警 {task.alertCount}</span>
            </div>
          ))}
        </div>
        {tasksState.error ? <p className="status-message">任务接口未连接，当前显示本地回退数据。</p> : null}
      </section>

      <section className="panel-grid">
        <article className="panel">
          <SectionHeader title="推荐任务模板" description="适合 MVP 阶段优先创建的监控组合" />
          <div className="stack">
            <div className="template-card">
              <strong>关键词爆款雷达</strong>
              <p>适合护肤、穿搭、家居等内容团队，重点发现新内容热度变化。</p>
            </div>
            <div className="template-card">
              <strong>竞品动作监控</strong>
              <p>关注核心品牌词与竞品内容表现，便于输出周报和选题建议。</p>
            </div>
          </div>
        </article>
        <article className="panel">
          <SectionHeader title="执行健康度" description="用于后续接入真实任务运行日志" />
          <div className="health-list">
            <div className="health-item">
              <strong>任务成功率</strong>
              <span>97.8%</span>
            </div>
            <div className="health-item">
              <strong>平均执行耗时</strong>
              <span>14s</span>
            </div>
            <div className="health-item">
              <strong>连续失败任务</strong>
              <span>0</span>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
