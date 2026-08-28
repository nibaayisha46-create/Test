import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { MenuIcon, ReportIcon, UsersIcon } from './Icons.jsx';

const NAV_ITEMS = [
  { to: '/users', label: 'Users', icon: <UsersIcon /> },
  { to: '/reports', label: 'User Reports', icon: <ReportIcon /> },
];

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="app">
      {sidebarOpen ? (
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      ) : null}

      <aside className={`sidebar${sidebarOpen ? ' is-open' : ''}`}>
        <div className="sidebar__brand">
          <span className="sidebar__logo">UM</span>
          <div>
            <div className="sidebar__title">User Management</div>
            <div className="sidebar__subtitle">Admin dashboard</div>
          </div>
        </div>

        <nav className="sidebar__nav">
          <span className="sidebar__label">Modules</span>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="main">
        <header className="topbar">
          <button
            type="button"
            className="icon-btn"
            onClick={() => setSidebarOpen((open) => !open)}
            aria-label="Toggle navigation"
            aria-expanded={sidebarOpen}
          >
            <MenuIcon />
          </button>
          <span className="sidebar__title">User Management</span>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
