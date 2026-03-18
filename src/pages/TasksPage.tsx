import { useMemo, useState } from 'react';
import { SectionHeader } from '../components/SectionHeader';
import { tasks as fallbackTasks } from '../data/mockData';
import { useApiData } from '../hooks/useApiData';
import { deleteJson, postJson, putJson } from '../lib/api';
import type { CreateTaskPayload, TaskItem, UpdateTaskPayload } from '../types';

const taskTypeOptions: CreateTaskPayload['taskType'][] = ['KEYWORD', 'BRAND', 'AUTHOR', 'COMPETITOR', 'CATEGORY'];
const cadenceOptions = ['每 1 小时', '每 6 小时', '每 1 天'];

const emptyForm: CreateTaskPayload = {
  taskName: '',
  taskType: 'KEYWORD',
  targets: [],
  cadence: cadenceOptions[0],
};

export function TasksPage() {
  const tasksState = useApiData<TaskItem[]>('/api/tasks', fallbackTasks);
  const [mode, setMode] = useState<'create' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [form, setForm] = useState<CreateTaskPayload>(emptyForm);
  const [targetInput, setTargetInput] = useState('');

  const editingTask = useMemo(
    () => tasksState.data.find((task) => task.id === editingId) ?? null,
    [editingId, tasksState.data],
  );

  function openCreateForm() {
    setMode('create');
    setEditingId(null);
    setForm(emptyForm);
    setTargetInput('');
    setSubmitError(null);
  }

  function openEditForm(task: TaskItem) {
    setMode('edit');
    setEditingId(task.id);
    setForm({
      taskName: task.taskName,
      taskType: task.taskType,
      targets: task.targets,
      cadence: task.cadence,
    });
    setTargetInput(task.targets.join(', '));
    setSubmitError(null);
  }

  function closeForm() {
    setMode(null);
    setEditingId(null);
    setForm(emptyForm);
    setTargetInput('');
    setSubmitError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedTargets = targetInput
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean);

    if (!form.taskName.trim() || normalizedTargets.length === 0) {
      setSubmitError('请填写任务名称，并至少输入一个监控对象。');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      if (mode === 'edit' && editingTask) {
        await putJson<TaskItem, UpdateTaskPayload>(`/api/tasks/${editingTask.id}`, {
          ...form,
          taskName: form.taskName.trim(),
          targets: normalizedTargets,
          status: editingTask.status,
        });
      } else {
        await postJson<TaskItem, CreateTaskPayload>('/api/tasks', {
          ...form,
          taskName: form.taskName.trim(),
          targets: normalizedTargets,
        });
      }

      closeForm();
      tasksState.refresh();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '保存任务失败。');
    } finally {
      setSubmitting(false);
    }
  }

  async function pauseTask(taskId: number) {
    await postJson<TaskItem, Record<string, never>>(`/api/tasks/${taskId}/pause`, {});
    tasksState.refresh();
  }

  async function resumeTask(taskId: number) {
    await postJson<TaskItem, Record<string, never>>(`/api/tasks/${taskId}/resume`, {});
    tasksState.refresh();
  }

  async function deleteTask(taskId: number) {
    await deleteJson<{ removed: TaskItem }>(`/api/tasks/${taskId}`);
    if (editingId === taskId) {
      closeForm();
    }
    tasksState.refresh();
  }

  return (
    <div className="page">
      <SectionHeader
        title="监控中心"
        description="管理关键词、品牌、达人和竞品监控任务。"
        actions={
          <button className="button" onClick={openCreateForm}>
            新建任务
          </button>
        }
      />

      {mode ? (
        <section className="panel">
          <SectionHeader
            title={mode === 'edit' ? '编辑监控任务' : '创建监控任务'}
            description="提交后会写入本地 API，并立即刷新任务列表。"
          />
          <form className="task-form" onSubmit={handleSubmit}>
            <label className="field">
              <span>任务名称</span>
              <input
                className="search search--wide"
                value={form.taskName}
                onChange={(event) => setForm((prev) => ({ ...prev, taskName: event.target.value }))}
                placeholder="例如：护肤竞品监控"
              />
            </label>

            <label className="field">
              <span>任务类型</span>
              <select
                className="select"
                value={form.taskType}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, taskType: event.target.value as CreateTaskPayload['taskType'] }))
                }
              >
                {taskTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="field field--wide">
              <span>监控对象</span>
              <textarea
                className="textarea"
                value={targetInput}
                onChange={(event) => setTargetInput(event.target.value)}
                placeholder="用逗号或换行分隔，例如：敏感肌, 修护面霜"
              />
            </label>

            <label className="field">
              <span>执行频率</span>
              <select
                className="select"
                value={form.cadence}
                onChange={(event) => setForm((prev) => ({ ...prev, cadence: event.target.value }))}
              >
                {cadenceOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <div className="task-form__actions">
              <button type="submit" className="button" disabled={submitting}>
                {submitting ? '保存中...' : '保存任务'}
              </button>
              <button type="button" className="button button--ghost" onClick={closeForm}>
                取消
              </button>
            </div>
          </form>
          {submitError ? <p className="status-message">{submitError}</p> : null}
        </section>
      ) : null}

      <section className="panel">
        <div className="table">
          <div className="table__row table__row--head">
            <span>任务名称</span>
            <span>类型</span>
            <span>监控对象</span>
            <span>状态</span>
            <span>执行频率</span>
            <span>操作</span>
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
              <span className="table__action-cell">
                <div className="inline-actions">
                  <button className="button button--ghost button--small" onClick={() => openEditForm(task)}>
                    编辑
                  </button>
                  {task.status === 'PAUSED' ? (
                    <button className="button button--ghost button--small" onClick={() => resumeTask(task.id)}>
                      恢复
                    </button>
                  ) : (
                    <button className="button button--ghost button--small" onClick={() => pauseTask(task.id)}>
                      暂停
                    </button>
                  )}
                  <button className="button button--ghost button--small" onClick={() => deleteTask(task.id)}>
                    删除
                  </button>
                </div>
                <small>
                  命中 {task.viralCount} / 预警 {task.alertCount}
                </small>
              </span>
            </div>
          ))}
        </div>
        {tasksState.loading ? <p className="status-message">正在加载最新任务数据...</p> : null}
        {tasksState.error ? <p className="status-message">任务接口暂不可用，当前显示本地回退数据。</p> : null}
      </section>

      <section className="panel-grid">
        <article className="panel">
          <SectionHeader title="推荐模板" description="适合 MVP 阶段优先创建的监控组合。" />
          <div className="stack">
            <div className="template-card">
              <strong>关键词雷达</strong>
              <p>适合护肤、穿搭、家居等内容团队，重点发现新内容热度变化。</p>
            </div>
            <div className="template-card">
              <strong>竞品脉冲监控</strong>
              <p>关注品牌词与竞品内容动作，方便输出周报和策略建议。</p>
            </div>
          </div>
        </article>
        <article className="panel">
          <SectionHeader title="执行健康度" description="用于后续接入真实任务运行日志。" />
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
