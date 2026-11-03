import { NavLink, Outlet } from 'react-router-dom';
import { Avatar } from './ui.jsx';

/**
 * links: [{ to, icon, label, badge }]
 * badge is an optional number; 0/undefined hides the pill.
 */
export default function AppShell({ role, portalTitle, sectionLabel, user, links, onLogout }) {
  return (
    <div className="app-shell" data-role={role}>
      <div className="topbar">
        <div className="topbar-title">{portalTitle}</div>
        <div className="topbar-user">
          <Avatar name={user?.name || ''} />
          <span>{user?.subtitle ? `${user.name} — ${user.subtitle}` : user?.name}</span>
          <button className="btn btn-ghost btn-xs" style={{ marginLeft: 10 }} onClick={onLogout}>
            Log out
          </button>
        </div>
      </div>
      <div className="layout">
        <div className="sidebar">
          <div className="s-section">{sectionLabel}</div>
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => `slink${isActive ? ' active' : ''}`}
              end={l.end}
            >
              {l.label}
              {!!l.badge && <span className="pill-count">{l.badge}</span>}
            </NavLink>
          ))}
        </div>
        <div className="main">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
