import { SectionHeader } from '../components/SectionHeader';
import { collectorSettings as fallbackCollectorSettings } from '../data/mockData';
import { useApiData } from '../hooks/useApiData';
import type { CollectorSettings } from '../types';

export function SettingsPage() {
  const collectorState = useApiData<CollectorSettings>('/api/settings/collector', fallbackCollectorSettings);

  return (
    <div className="page">
      <SectionHeader title="设置" description="管理账号、通知和真实采集器的接入状态。" />
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

      <section className="panel">
        <SectionHeader
          title="小红书采集器"
          description="当前采用有头浏览器 + 首次手动登录方案，优先监控 4 个赛道。"
        />
        <div className="settings-list">
          <div className="settings-item">
            <span>平台</span>
            <strong>{collectorState.data.platformName}</strong>
          </div>
          <div className="settings-item">
            <span>登录状态</span>
            <strong>{collectorState.data.loginStatus}</strong>
          </div>
          <div className="settings-item">
            <span>首次登录方式</span>
            <strong>{collectorState.data.manualLoginRequired ? '手动登录' : '自动登录'}</strong>
          </div>
          <div className="settings-item">
            <span>浏览器模式</span>
            <strong>{collectorState.data.headedMode ? '有头模式' : '无头模式'}</strong>
          </div>
          <div className="settings-item">
            <span>会话目录</span>
            <strong>{collectorState.data.sessionFile}</strong>
          </div>
          <div className="settings-item">
            <span>最近登录时间</span>
            <strong>{collectorState.data.lastLoginAt ?? '暂无'}</strong>
          </div>
          <div className="settings-item">
            <span>最近采集时间</span>
            <strong>{collectorState.data.lastCollectAt ?? '暂无'}</strong>
          </div>
        </div>

        <div className="stack">
          {collectorState.data.enabledTracks.map((track) => (
            <div key={track.id} className="template-card">
              <strong>
                {track.name} {track.enabled ? '已启用' : '已停用'}
              </strong>
              <p>{track.keywords.join(' / ')}</p>
            </div>
          ))}
        </div>

        {collectorState.error ? <p className="status-message">采集器配置接口暂不可用，当前显示本地回退数据。</p> : null}
      </section>
    </div>
  );
}
