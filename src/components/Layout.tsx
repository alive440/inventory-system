import { NavLink, Outlet } from 'react-router-dom'

const NAV = [
  { to: '/', label: '驾驶舱', icon: '📊' },
  { to: '/products', label: '商品管理', icon: '📦' },
  { to: '/suppliers', label: '供应商', icon: '🏭' },
  { to: '/purchase', label: '采购入库', icon: '🛒' },
  { to: '/sales', label: '销售出库', icon: '💸' },
  { to: '/inventory', label: '库存看板', icon: '📋' },
  { to: '/inventory/check', label: '库存盘点', icon: '🔍' },
  { to: '/logs', label: '流水明细', icon: '📝' },
  { to: '/reports', label: '利润报表', icon: '📈' },
]

export default function Layout() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon">📦</span>
          <span className="sidebar-logo-text">进销存</span>
        </div>
        <nav className="sidebar-nav">
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'}
              className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
