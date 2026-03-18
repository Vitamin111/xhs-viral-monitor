import { SectionHeader } from '../components/SectionHeader';

export function SettingsPage() {
  return (
    <div className="page">
      <SectionHeader title="设置" description="当前提供基础账号与通知设置占位，方便后续接真实后端接口。" />
      <section className="panel-grid">
        <article className="panel">
          <h3>账号信息</h3>
          <div className="settings-list">
            <div className="settings-item">
              <span>当前账号</span>
              <strong>product.manager</strong>
            </div>
            <div className="settings-item">
              <span>角色</span>
              <strong>ADMIN</strong>
            </div>
          </div>
        </article>
        <article className="panel">
          <h3>通知偏好</h3>
          <div className="settings-list">
            <div className="settings-item">
              <span>站内预警</span>
              <strong>已开启</strong>
            </div>
            <div className="settings-item">
              <span>邮件通知</span>
              <strong>规划中</strong>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
