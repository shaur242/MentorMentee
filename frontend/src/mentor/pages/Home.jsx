import { useEffect, useState } from 'react';
import { mentorApi } from '../MentorRoot.jsx';
import { Card, Avatar, Badge } from '../../components/ui.jsx';

export function sessionBadge(status) {
  if (status === 'confirmed') return <Badge tone="blue">Confirmed</Badge>;
  if (status === 'declined') return <Badge tone="red">Declined</Badge>;
  if (status === 'completed') return <Badge tone="green">Completed</Badge>;
  if (status === 'cancelled') return <Badge tone="gray">Cancelled</Badge>;
  return <Badge tone="amber">Pending</Badge>;
}

export function SessionRow({ s, onRespond, onReschedule }) {
  return (
    <div className="row" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: 8 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{s.title} · {s.menteeName}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{s.label} · {s.timeLabel} · {s.mode}</div>
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {sessionBadge(s.status)}
        {s.status === 'pending' && onRespond && (
          <>
            <button className="btn btn-accent btn-xs" onClick={() => onRespond(s.id, 'accept')}>Accept</button>
            {onReschedule && <button className="btn btn-xs" onClick={() => onReschedule(s)}>Reschedule</button>}
            <button className="btn btn-red btn-xs" onClick={() => onRespond(s.id, 'decline')}>Decline</button>
          </>
        )}
      </div>
    </div>
  );
}

export default function Home({ ctx }) {
  const { mentor, refreshDashboard } = ctx;
  const [dash, setDash] = useState(null);

  async function load() {
    const d = await mentorApi('/mentor/dashboard');
    setDash(d);
  }
  useEffect(() => { load(); }, []);

  async function respond(sessionId, action) {
    try {
      await mentorApi(`/mentor/sessions/${sessionId}/respond`, { method: 'POST', body: JSON.stringify({ action }) });
      await load();
      await refreshDashboard();
    } catch (e) {
      alert(e.message);
    }
  }
  async function respondMenteeRequest(id, action) {
    try {
      const res = await mentorApi(`/mentor/mentee-requests/${id}/respond`, { method: 'POST', body: JSON.stringify({ action }) });
      alert(res.message);
      await load();
      await refreshDashboard();
    } catch (e) {
      alert(e.message);
    }
  }

  if (!dash) return null;

  return (
    <div>
      <div className="page-title">Welcome back</div>
      <div className="page-sub">{dash.mentor.designation} · {dash.mentor.department}</div>

      <div className="stats stats-3">
        <div className="stat"><div className="stat-label">Active mentees</div><div className="stat-value">{dash.stats.activeMentees} / {dash.stats.capacity}</div></div>
        <div className="stat"><div className="stat-label">Sessions this month</div><div className="stat-value">{dash.stats.sessionsThisMonth}</div></div>
        <div className="stat"><div className="stat-label">Pending requests</div><div className="stat-value">{dash.stats.pendingRequests}</div></div>
      </div>

      <Card title="Pending Session Requests">
        {dash.pendingSessions.length ? (
          dash.pendingSessions.map((s) => <SessionRow key={s.id} s={s} onRespond={respond} />)
        ) : (
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>No pending session requests.</div>
        )}
      </Card>

      <Card title="Mentee Requests (wanting you as mentor)">
        {dash.menteeRequests.length ? (
          dash.menteeRequests.map((r) => (
            <div className="row" key={r.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div className="row-start">
                <Avatar name={r.menteeName} />
                <div>
                  <b style={{ fontSize: 13 }}>{r.menteeName}</b>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{r.mentee.programme} · Sem {r.mentee.semester} · requested {r.createdAt}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-accent btn-xs" onClick={() => respondMenteeRequest(r.id, 'accept')}>Accept</button>
                <button className="btn btn-red btn-xs" onClick={() => respondMenteeRequest(r.id, 'decline')}>Decline</button>
              </div>
            </div>
          ))
        ) : (
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>No mentees are currently requesting you.</div>
        )}
      </Card>

      <Card title="Mentee At-a-Glance">
        {dash.mentees.length ? (
          dash.mentees.map((m) => (
            <div className="row" key={m.id} style={{ padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
              <div className="row-start"><Avatar name={m.name} /><span style={{ fontSize: 13 }}>{m.name}</span></div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>Attendance {m.attendance}%</span>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>CGPA {m.cgpa}</span>
                {m.status === 'At risk' ? <Badge tone="red">At risk</Badge> : <Badge tone="green">Good standing</Badge>}
              </div>
            </div>
          ))
        ) : (
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>You have no mentees yet.</div>
        )}
      </Card>
    </div>
  );
}
