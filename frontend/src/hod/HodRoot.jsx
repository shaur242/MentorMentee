import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { createApiClient } from '../api/client.js';
import LoginPage from '../components/LoginPage.jsx';
import AppShell from '../components/AppShell.jsx';
import Dashboard from './pages/Dashboard.jsx';
import AssignCoordinator from './pages/AssignCoordinator.jsx';
import Allocation from './pages/Allocation.jsx';
import Capacity from './pages/Capacity.jsx';
import Compliance from './pages/Compliance.jsx';
import Diaries from './pages/Diaries.jsx';
import CriticalIssues from './pages/CriticalIssues.jsx';
import DepartmentNotice from './pages/DepartmentNotice.jsx';
import Peer from './pages/Peer.jsx';

const { api, getToken, setToken } = createApiClient('hod');
export const hodApi = api;

export default function HodRoot() {
  const [ready, setReady] = useState(false);
  const [hod, setHod] = useState(null);
  const [criticalCount, setCriticalCount] = useState(0);
  const navigate = useNavigate();

  const refreshDashboard = useCallback(async () => {
    const dash = await api('/hod/dashboard');
    setHod(dash.hod);
    return dash;
  }, []);

  const refreshBadges = useCallback(async () => {
    try {
      const issues = await api('/hod/critical-issues');
      setCriticalCount(issues.filter((i) => i.status === 'Open').length);
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
    const res = await api('/auth/hod-login', { method: 'POST', body: JSON.stringify({ employeeId, password }) });
    setToken(res.token);
    setHod(res.hod);
    await refreshDashboard();
    await refreshBadges();
    navigate('/hod/dashboard');
  }

  function handleLogout() {
    api('/auth/logout', { method: 'POST' }).catch(() => {});
    setToken(null);
    setHod(null);
    navigate('/hod');
  }

  if (!ready) return null;

  if (!getToken() || !hod) {
    return (
      <LoginPage
        title="MentorOne — HOD"
        subtitle="Sign in to your HOD portal"
        idLabel="Employee ID"
        idPlaceholder="e.g. EMP1001"
        note="This portal is for Heads of Department only. Your employee ID and password are provided by the institution — there is no role selection here."
        onSubmit={handleLogin}
      />
    );
  }

  const links = [
    { to: '/hod/dashboard', label: 'Dashboard' },
    { to: '/hod/assign-coordinator', label: 'Assign Coordinator & Mentors' },
    { to: '/hod/allocation', label: 'Mentee Allocation' },
    { to: '/hod/capacity', label: 'Mentor Capacity' },
    { to: '/hod/compliance', label: 'Session Compliance' },
    { to: '/hod/diaries', label: 'Mentoring Diaries' },
    { to: '/hod/critical', label: 'Critical Issues', badge: criticalCount },
    { to: '/hod/notice', label: 'Department Notice' },
    { to: '/hod/peer', label: 'Peer Mentoring' }
  ];

  const ctx = { hod, refreshDashboard, refreshBadges };

  return (
    <Routes>
      <Route
        element={
          <AppShell
            role="hod"
            portalTitle="HOD Portal"
            sectionLabel="Head of Department"
            user={{ name: hod.name, subtitle: `HOD, ${hod.department}` }}
            links={links}
            onLogout={handleLogout}
          />
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard ctx={ctx} />} />
        <Route path="assign-coordinator" element={<AssignCoordinator ctx={ctx} />} />
        <Route path="allocation" element={<Allocation ctx={ctx} />} />
        <Route path="capacity" element={<Capacity ctx={ctx} />} />
        <Route path="compliance" element={<Compliance ctx={ctx} />} />
        <Route path="diaries" element={<Diaries ctx={ctx} />} />
        <Route path="critical" element={<CriticalIssues ctx={ctx} />} />
        <Route path="notice" element={<DepartmentNotice ctx={ctx} />} />
        <Route path="peer" element={<Peer ctx={ctx} />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
}
