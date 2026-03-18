import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/dashboard', label: '首页' },
  { to: '/discovery', label: '爆款发现' },
  { to: '/tasks', label: '监控中心' },
  { to: '/alerts', label: '预警中心' },
  { to: '/favorites', label: '收藏夹' },
  { to: '/settings', label: '设置' },
];

export function AppLayout() {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand__mark">X</div>
          <div>
            <div className="brand__title">小红书爆款监控</div>
            <div className="brand__subtitle">Viral Intelligence Console</div>
          </div>
        </div>
        <nav className="nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav__item ${isActive ? 'nav__item--active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar__card">
          <div className="sidebar__label">今日建议</div>
          <strong>优先跟进护肤与通勤穿搭赛道</strong>
          <p>这两个类目今天的收藏效率显著高于过去 7 天均值。</p>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div>
            <div className="eyebrow">内容策略平台</div>
            <h1 className="topbar__title">爆款监控工作台</h1>
          </div>
          <div className="topbar__actions">
            <input className="search" placeholder="搜索关键词、品牌、达人" />
            <div className="avatar">PM</div>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
