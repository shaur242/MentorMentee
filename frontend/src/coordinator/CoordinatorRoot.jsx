import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { createApiClient } from '../api/client.js';
import LoginPage from '../components/LoginPage.jsx';
import AppShell from '../components/AppShell.jsx';
import Dashboard from './pages/Dashboard.jsx';
import MyMentors from './pages/MyMentors.jsx';
import AssignMentees from './pages/AssignMentees.jsx';
import Notifications from './pages/Notifications.jsx';
import HodNotices from './pages/HodNotices.jsx';
import Remarks from './pages/Remarks.jsx';
import Feedback from './pages/Feedback.jsx';
import Reports from './pages/Reports.jsx';

const { api, getToken, setToken } = createApiClient('coordinator');
export const coordinatorApi = api;

export default function CoordinatorRoot() {
  const [ready, setReady] = useState(false);
  const [coordinator, setCoordinator] = useState(null);
  const [noticeCount, setNoticeCount] = useState(0);
  const [notifCount, setNotifCount] = useState(0);
  const navigate = useNavigate();

  const refreshDashboard = useCallback(async () => {
    const dash = await api('/coordinator/dashboard');
    setCoordinator(dash.coordinator);
    return dash;
  }, []);

  const refreshBadges = useCallback(async () => {
    try {
      const notices = await api('/coordinator/hod-notices');
      setNoticeCount(notices.length);
    } catch (e) {}
    try {
      const notifs = await api('/coordinator/notifications');
      setNotifCount(notifs.length);
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (!getToken()) {
      setReady(true);
      return;
    }
    Promise.all([refreshDashboard(), refreshBadges()])
      .catch(() => setToken(null))
      .finally(() => setReady(true));
  }, [refreshDashboard, refreshBadges]);

  async function handleLogin(employeeId, password) {
    const res = await api('/auth/coordinator-login', { method: 'POST', body: JSON.stringify({ employeeId, password }) });
    setToken(res.token);
    setCoordinator(res.coordinator);
    await refreshDashboard();
    await refreshBadges();
    navigate('/coordinator/dashboard');
  }

  function handleLogout() {
    api('/auth/logout', { method: 'POST' }).catch(() => {});
    setToken(null);
    setCoordinator(null);
    navigate('/coordinator');
  }

  if (!ready) return null;

  if (!getToken() || !coordinator) {
    return (
      <LoginPage
        title="MentorOne — Coordinator"
        subtitle="Sign in to your coordinator portal"
        idLabel="Employee ID"
        idPlaceholder="e.g. EMP2001"
        note="This portal is for department coordinators only. Your employee ID and password are provided by your department — there is no role selection here."
        onSubmit={handleLogin}
      />
    );
  }

  const links = [
    { to: '/coordinator/dashboard', label: 'Dashboard' },
    { to: '/coordinator/mentors', label: 'My Mentors' },
    { to: '/coordinator/assign', label: 'Assign Mentees' },
    { to: '/coordinator/notifications', label: 'Notifications', badge: notifCount },
    { to: '/coordinator/hod-notices', label: 'HOD Notices', badge: noticeCount },
    { to: '/coordinator/remarks', label: 'Remarks' },
    { to: '/coordinator/feedback', label: 'Feedback' },
    { to: '/coordinator/reports', label: 'Reports' }
  ];

  const ctx = { coordinator, refreshDashboard };

  return (
    <Routes>
      <Route
        element={
          <AppShell
            role="coordinator"
            portalTitle="Coordinator Portal"
            sectionLabel="Coordinator"
            user={{ name: coordinator.name, subtitle: coordinator.department }}
            links={links}
            onLogout={handleLogout}
          />
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard ctx={ctx} />} />
        <Route path="mentors" element={<MyMentors ctx={ctx} />} />
        <Route path="assign" element={<AssignMentees ctx={ctx} />} />
        <Route path="notifications" element={<Notifications ctx={ctx} />} />
        <Route path="hod-notices" element={<HodNotices ctx={ctx} />} />
        <Route path="remarks" element={<Remarks ctx={ctx} />} />
        <Route path="feedback" element={<Feedback ctx={ctx} />} />
        <Route path="reports" element={<Reports ctx={ctx} />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
}
