import { useState } from 'react';
import { SectionHeader } from '../components/SectionHeader';
import { tasks as fallbackTasks } from '../data/mockData';
import { useApiData } from '../hooks/useApiData';
import { postJson } from '../lib/api';
import type { CreateTaskPayload, TaskItem } from '../types';

const taskTypeOptions: CreateTaskPayload['taskType'][] = ['KEYWORD', 'BRAND', 'AUTHOR', 'COMPETITOR', 'CATEGORY'];
const cadenceOptions = ['Every 1 hour', 'Every 6 hours', 'Every 1 day'];

export function TasksPage() {
  const tasksState = useApiData<TaskItem[]>('/api/tasks', fallbackTasks);
  const [isCreating, setIsCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [form, setForm] = useState<CreateTaskPayload>({
    taskName: '',
    taskType: 'KEYWORD',
    targets: [],
    cadence: cadenceOptions[0],
  });
  const [targetInput, setTargetInput] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedTargets = targetInput
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean);

    if (!form.taskName.trim() || normalizedTargets.length === 0) {
      setSubmitError('Please provide a task name and at least one target.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      await postJson<TaskItem, CreateTaskPayload>('/api/tasks', {
        ...form,
        taskName: form.taskName.trim(),
        targets: normalizedTargets,
      });
      setForm({
        taskName: '',
        taskType: 'KEYWORD',
        targets: [],
        cadence: cadenceOptions[0],
      });
      setTargetInput('');
      setIsCreating(false);
      tasksState.refresh();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to create task.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <SectionHeader
        title="Task Center"
        description="Manage keyword, brand, creator, and competitor monitoring tasks."
        actions={
          <button className="button" onClick={() => setIsCreating((value) => !value)}>
            {isCreating ? 'Close Form' : 'Create Task'}
          </button>
        }
      />

      {isCreating ? (
        <section className="panel">
          <SectionHeader title="Create Monitoring Task" description="This writes to the local API and refreshes the task list immediately." />
          <form className="task-form" onSubmit={handleSubmit}>
            <label className="field">
              <span>Task name</span>
              <input
                className="search search--wide"
                value={form.taskName}
                onChange={(event) => setForm((prev) => ({ ...prev, taskName: event.target.value }))}
                placeholder="Example: Skincare competitor monitor"
              />
            </label>

            <label className="field">
              <span>Task type</span>
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
              <span>Targets</span>
              <textarea
                className="textarea"
                value={targetInput}
                onChange={(event) => setTargetInput(event.target.value)}
                placeholder="Use commas or line breaks, e.g. sensitive skin, repair cream"
              />
            </label>

            <label className="field">
              <span>Cadence</span>
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
                {submitting ? 'Creating...' : 'Save Task'}
              </button>
              <button type="button" className="button button--ghost" onClick={() => setIsCreating(false)}>
                Cancel
              </button>
            </div>
          </form>
          {submitError ? <p className="status-message">{submitError}</p> : null}
        </section>
      ) : null}

      <section className="panel">
        <div className="table">
          <div className="table__row table__row--head">
            <span>Task Name</span>
            <span>Type</span>
            <span>Targets</span>
            <span>Status</span>
            <span>Cadence</span>
            <span>Latest Result</span>
          </div>
          {tasksState.data.map((task) => (
            <div key={task.id} className="table__row">
              <span>
                <strong>{task.taskName}</strong>
                <small>Next run {task.nextRunAt}</small>
              </span>
              <span>{task.taskType}</span>
              <span>{task.targets.join(' / ')}</span>
              <span>{task.status}</span>
              <span>{task.cadence}</span>
              <span>
                Hits {task.viralCount} / Alerts {task.alertCount}
              </span>
            </div>
          ))}
        </div>
        {tasksState.loading ? <p className="status-message">Loading latest task data...</p> : null}
        {tasksState.error ? <p className="status-message">Task API is unavailable, showing fallback data.</p> : null}
      </section>

      <section className="panel-grid">
        <article className="panel">
          <SectionHeader title="Suggested Templates" description="Recommended monitoring combos for the MVP stage." />
          <div className="stack">
            <div className="template-card">
              <strong>Keyword Radar</strong>
              <p>Great for skincare, fashion, and home content teams that need early breakout detection.</p>
            </div>
            <div className="template-card">
              <strong>Competitor Pulse</strong>
              <p>Track brand terms and competitor content moves to support weekly reviews and planning.</p>
            </div>
          </div>
        </article>
        <article className="panel">
          <SectionHeader title="Execution Health" description="Placeholder for future real task execution logs." />
          <div className="health-list">
            <div className="health-item">
              <strong>Task success rate</strong>
              <span>97.8%</span>
            </div>
            <div className="health-item">
              <strong>Average execution time</strong>
              <span>14s</span>
            </div>
            <div className="health-item">
              <strong>Continuous failed tasks</strong>
              <span>0</span>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
