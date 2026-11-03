import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { createApiClient } from '../api/client.js';
import LoginPage from '../components/LoginPage.jsx';
import AppShell from '../components/AppShell.jsx';
import Dashboard from './pages/Dashboard.jsx';
import FindMentor from './pages/FindMentor.jsx';
import BookSession from './pages/BookSession.jsx';
import Otp from './pages/Otp.jsx';
import HodNotices from './pages/HodNotices.jsx';
import Feedback from './pages/Feedback.jsx';
import Goals from './pages/Goals.jsx';
import SelfValidation from './pages/SelfValidation.jsx';

const { api, getToken, setToken } = createApiClient('mentee');
export const menteeApi = api;

export default function MenteeRoot() {
  const [ready, setReady] = useState(false);
  const [mentee, setMentee] = useState(null);
  const [mentor, setMentor] = useState(null);
  const [noticeCount, setNoticeCount] = useState(0);
  const [requestCount, setRequestCount] = useState(0);
  const navigate = useNavigate();

  const refreshDashboard = useCallback(async () => {
    const dash = await api('/mentee/dashboard');
    setMentee(dash.mentee);
    setMentor(dash.mentor);
    return dash;
  }, []);

  const refreshBadges = useCallback(async (currentMentor) => {
    try {
      const notices = await api('/mentee/hod-notices');
      setNoticeCount(notices.length);
    } catch (e) {
      /* non-critical */
    }
    try {
      if (!currentMentor) {
        const incoming = await api('/mentee/mentor-requests');
        setRequestCount(incoming.length);
      } else {
        setRequestCount(0);
      }
    } catch (e) {
      /* non-critical */
    }
  }, []);

  useEffect(() => {
    if (!getToken()) {
      setReady(true);
      return;
    }
    refreshDashboard()
      .then((dash) => refreshBadges(dash.mentor))
      .catch(() => setToken(null))
      .finally(() => setReady(true));
  }, [refreshDashboard, refreshBadges]);

  async function handleLogin(registerNo, password) {
    const res = await api('/auth/mentee-login', {
      method: 'POST',
      body: JSON.stringify({ registerNo, password })
    });
    setToken(res.token);
    setMentee(res.mentee);
    const dash = await refreshDashboard();
    await refreshBadges(dash.mentor);
    navigate('/mentee/dashboard');
  }

  function handleLogout() {
    api('/auth/logout', { method: 'POST' }).catch(() => {});
    setToken(null);
    setMentee(null);
    setMentor(null);
    navigate('/mentee');
  }

  if (!ready) return null;

  if (!getToken() || !mentee) {
    return (
      <LoginPage
        title="MentorOne — Mentee"
        subtitle="Sign in to your mentee portal"
        idLabel="Register Number"
        idPlaceholder="e.g. 2548021"
        note="This portal is for mentees only. Your register number and password are provided by your department — there is no role selection here."
        onSubmit={handleLogin}
      />
    );
  }

  const links = [
    { to: '/mentee/dashboard', label: 'Dashboard' },
    { to: '/mentee/find-mentor', label: 'Find Mentor', badge: requestCount },
    { to: '/mentee/book', label: 'Book Session' },
    { to: '/mentee/otp', label: 'OTP' },
    { to: '/mentee/hod-notices', label: 'HOD Notices', badge: noticeCount },
    { to: '/mentee/feedback', label: 'Feedback' },
    { to: '/mentee/goals', label: 'My Goals' },
    { to: '/mentee/self-validation', label: 'Self Validation' }
  ];

  const ctx = { mentee, mentor, setMentor, refreshDashboard, refreshBadges };

  return (
    <Routes>
      <Route
        element={
          <AppShell
            role="mentee"
            portalTitle="Mentee Portal"
            sectionLabel="Mentee"
            user={{ name: mentee.name, subtitle: mentee.registerNo }}
            links={links}
            onLogout={handleLogout}
          />
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard ctx={ctx} />} />
        <Route path="find-mentor" element={<FindMentor ctx={ctx} />} />
        <Route path="book" element={<BookSession ctx={ctx} />} />
        <Route path="otp" element={<Otp ctx={ctx} />} />
        <Route path="hod-notices" element={<HodNotices ctx={ctx} />} />
        <Route path="feedback" element={<Feedback ctx={ctx} />} />
        <Route path="goals" element={<Goals ctx={ctx} />} />
        <Route path="self-validation" element={<SelfValidation ctx={ctx} />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
}
