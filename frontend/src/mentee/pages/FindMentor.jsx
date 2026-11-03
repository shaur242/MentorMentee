import { useEffect, useState } from 'react';
import { menteeApi } from '../MenteeRoot.jsx';
import { Card, Avatar, Notice } from '../../components/ui.jsx';

export default function FindMentor({ ctx }) {
  const { mentor, setMentor, refreshDashboard, refreshBadges } = ctx;
  const [mentors, setMentors] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [connectEnabled, setConnectEnabled] = useState(true);
  const [search, setSearch] = useState('');
  const [loaded, setLoaded] = useState(false);

  async function loadAll() {
    try {
      const [mentorList, incomingList, connect] = await Promise.all([
        menteeApi('/mentee/mentors'),
        menteeApi('/mentee/mentor-requests').catch(() => []),
        menteeApi('/mentee/connect-mode').catch(() => ({ enabled: true }))
      ]);
      setMentors(mentorList);
      setIncoming(incomingList);
      setConnectEnabled(connect.enabled);
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => {
    loadAll();
  }, [mentor]);

  async function requestMentor(mentorId) {
    try {
      const res = await menteeApi('/mentee/mentor-requests', { method: 'POST', body: JSON.stringify({ mentorId }) });
      alert(res.message);
    } catch (e) {
      alert(e.message);
    }
  }

  async function respondIncoming(requestId, action) {
    try {
      const res = await menteeApi(`/mentee/mentor-requests/${requestId}/respond`, {
        method: 'POST',
        body: JSON.stringify({ action })
      });
      alert(res.message);
      const dash = await refreshDashboard();
      setMentor(dash.mentor);
      await refreshBadges(dash.mentor);
    } catch (e) {
      alert(e.message);
    }
  }

  if (mentor) {
    return (
      <div>
        <div className="page-title">Find a Mentor</div>
        <div className="page-sub">You already have a mentor assigned.</div>
        <Card title="Your Mentor">
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <Avatar name={mentor.name} size="lg" />
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{mentor.name}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{mentor.designation} · {mentor.department}</div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const q = search.toLowerCase();
  const filtered = mentors.filter(
    (m) => !q || m.name.toLowerCase().includes(q) || m.department.toLowerCase().includes(q) || m.tags.join(' ').toLowerCase().includes(q)
  );

  return (
    <div>
      <div className="page-title">Find a Mentor</div>
      <div className="page-sub">Browse faculty profiles — send a request to your preferred mentor, or respond to one below.</div>

      {incoming.length > 0 && (
        <Card title="Mentors who want to mentor you">
          {incoming.map((r) => (
            <div className="row" key={r.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div className="row-start">
                <Avatar name={r.mentorName} />
                <div>
                  <b style={{ fontSize: 13 }}>{r.mentorName}</b>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{r.mentor?.designation} · {r.mentor?.department}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-accent btn-xs" onClick={() => respondIncoming(r.id, 'accept')}>Accept</button>
                <button className="btn btn-red btn-xs" onClick={() => respondIncoming(r.id, 'decline')}>Decline</button>
              </div>
            </div>
          ))}
        </Card>
      )}

      {!connectEnabled && (
        <Notice tone="amber">Direct requests are currently switched off by your coordinator — they will assign you a mentor directly.</Notice>
      )}

      <div className="field">
        <input className="input" placeholder="Search by name, department, or specialisation..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loaded && filtered.length === 0 && (
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>
            {mentors.length ? 'No mentors match your search.' : 'No mentors are available in your department right now — check back soon or ask your coordinator.'}
          </div>
        )}
        {filtered.map((m) => (
          <div className="card" key={m.id}>
            <div style={{ display: 'flex', gap: 14 }}>
              <Avatar name={m.name} size="lg" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{m.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>{m.designation} · {m.department}</div>
                <div className="tags">
                  {m.tags.map((t) => (
                    <span className="tag" key={t}>{t}</span>
                  ))}
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--green)' }}>{m.openSlots}/{m.totalSlots} slots open</div>
              </div>
              <button className="btn btn-accent" style={{ alignSelf: 'flex-start' }} disabled={!connectEnabled} onClick={() => requestMentor(m.id)}>
                Request
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
