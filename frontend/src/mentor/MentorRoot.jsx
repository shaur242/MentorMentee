import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { createApiClient } from '../api/client.js';
import LoginPage from '../components/LoginPage.jsx';
import AppShell from '../components/AppShell.jsx';
import Home from './pages/Home.jsx';
import MyMentees from './pages/MyMentees.jsx';
import FindMentees from './pages/FindMentees.jsx';
import SessionRequests from './pages/SessionRequests.jsx';
import GroupMeet from './pages/GroupMeet.jsx';
import OtpAttendance from './pages/OtpAttendance.jsx';
import Remarks from './pages/Remarks.jsx';
import CriticalIssue from './pages/CriticalIssue.jsx';
import HodNotices from './pages/HodNotices.jsx';
import Profile from './pages/Profile.jsx';
import MenteeGoals from './pages/MenteeGoals.jsx';
import MentorFeedbackOnSelf from './pages/MentorFeedbackOnSelf.jsx';

const { api, getToken, setToken } = createApiClient('mentor');
export const mentorApi = api;

export default function MentorRoot() {
  const [ready, setReady] = useState(false);
  const [mentor, setMentor] = useState(null);
  const [noticeCount, setNoticeCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const navigate = useNavigate();

  const refreshDashboard = useCallback(async () => {
    const dash = await api('/mentor/dashboard');
    setMentor(dash.mentor);
    setPendingCount(dash.pendingSessions.length + dash.menteeRequests.length);
    return dash;
  }, []);

  const refreshBadges = useCallback(async () => {
    try {
      const notices = await api('/mentor/hod-notices');
      setNoticeCount(notices.length);
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
    const res = await api('/auth/mentor-login', { method: 'POST', body: JSON.stringify({ employeeId, password }) });
    setToken(res.token);
    setMentor(res.mentor);
    await refreshDashboard();
    await refreshBadges();
    navigate('/mentor/home');
  }

  function handleLogout() {
    api('/auth/logout', { method: 'POST' }).catch(() => {});
    setToken(null);
    setMentor(null);
    navigate('/mentor');
  }

  if (!ready) return null;

  if (!getToken() || !mentor) {
    return (
      <LoginPage
        title="MentorOne — Mentor"
        subtitle="Sign in to your mentor portal"
        idLabel="Employee ID"
        idPlaceholder="e.g. EMP2010"
        note="This portal is for mentors only. Your employee ID and password are provided by your department — there is no role selection here."
        onSubmit={handleLogin}
      />
    );
  }

  const links = [
    { to: '/mentor/home', label: 'Home', badge: pendingCount },
    { to: '/mentor/mentees', label: 'My Mentees' },
    { to: '/mentor/find-mentees', label: 'Find Mentees' },
    { to: '/mentor/requests', label: 'Session Requests' },
    { to: '/mentor/group-meet', label: 'Group Meet' },
    { to: '/mentor/otp', label: 'OTP Attendance' },
    { to: '/mentor/remarks', label: 'Remarks' },
    { to: '/mentor/critical', label: 'Report Critical Issue' },
    { to: '/mentor/hod-notices', label: 'HOD Notices', badge: noticeCount },
    { to: '/mentor/goals', label: 'Mentee Goals' },
    { to: '/mentor/mentor-feedback', label: 'Mentor Feedback' },
    { to: '/mentor/profile', label: 'My Profile' }
  ];

  const ctx = { mentor, setMentor, refreshDashboard };

  return (
    <Routes>
      <Route
        element={
          <AppShell
            role="mentor"
            portalTitle="Mentor Portal"
            sectionLabel="Mentor"
            user={{ name: mentor.name }}
            links={links}
            onLogout={handleLogout}
          />
        }
      >
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home" element={<Home ctx={ctx} />} />
        <Route path="mentees" element={<MyMentees ctx={ctx} />} />
        <Route path="find-mentees" element={<FindMentees ctx={ctx} />} />
        <Route path="requests" element={<SessionRequests ctx={ctx} />} />
        <Route path="group-meet" element={<GroupMeet ctx={ctx} />} />
        <Route path="otp" element={<OtpAttendance ctx={ctx} />} />
        <Route path="remarks" element={<Remarks ctx={ctx} />} />
        <Route path="critical" element={<CriticalIssue ctx={ctx} />} />
        <Route path="hod-notices" element={<HodNotices ctx={ctx} />} />
        <Route path="goals" element={<MenteeGoals ctx={ctx} />} />
        <Route path="mentor-feedback" element={<MentorFeedbackOnSelf ctx={ctx} />} />
        <Route path="profile" element={<Profile ctx={ctx} />} />
        <Route path="*" element={<Navigate to="home" replace />} />
      </Route>
    </Routes>
  );
}
