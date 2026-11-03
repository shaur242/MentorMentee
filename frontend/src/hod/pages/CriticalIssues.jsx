import { useEffect, useState } from 'react';
import { hodApi } from '../HodRoot.jsx';
import { Card, Badge, Notice } from '../../components/ui.jsx';

export default function CriticalIssues({ ctx }) {
  const { refreshBadges } = ctx;
  const [issues, setIssues] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [mentees, setMentees] = useState([]);
  const [coordinators, setCoordinators] = useState([]);

  const [all, setAll] = useState(false);
  const [useMentor, setUseMentor] = useState(false);
  const [useMentee, setUseMentee] = useState(false);
  const [useCoordinator, setUseCoordinator] = useState(false);
  const [mentorId, setMentorId] = useState('');
  const [menteeId, setMenteeId] = useState('');
  const [coordinatorId, setCoordinatorId] = useState('');
  const [message, setMessage] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    hodApi('/hod/critical-issues').then(setIssues);
    hodApi('/hod/mentors-list').then((list) => {
      setMentors(list);
      if (list.length) setMentorId(list[0].id);
    });
    hodApi('/hod/mentees-list').then((list) => {
      setMentees(list);
      if (list.length) setMenteeId(list[0].id);
    });
    hodApi('/hod/coordinators-list').then((list) => {
      setCoordinators(list);
      if (list.length) setCoordinatorId(list[0].id);
    });
  }, []);

  async function send() {
    if (!message.trim()) return setResult({ tone: 'red', text: 'Write a message before sending.' });
    const payload = { all, message };
    if (!all) {
      if (useMentor) payload.mentorId = mentorId;
      if (useMentee) payload.menteeId = menteeId;
      if (useCoordinator) payload.coordinatorId = coordinatorId;
    }
    try {
      const res = await hodApi('/hod/notify', { method: 'POST', body: JSON.stringify(payload) });
      setResult({ tone: 'green', text: res.message });
      setMessage('');
    } catch (e) {
      setResult({ tone: 'red', text: e.message });
    }
  }

  return (
    <div>
      <div className="page-title">Critical Issues</div>
      <div className="page-sub">Confidential escalations from mentors, beyond the mentor's normal scope.</div>

      <Card title="Mentor Escalations">
        {issues.length ? (
          issues.map((i) => (
            <div className="row" key={i.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <b style={{ fontSize: 13 }}>{i.category}</b>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{i.id} · {i.mentorName} → {i.menteeName} · {i.date}</div>
              </div>
              <Badge tone={i.status === 'Open' ? 'red' : 'green'}>{i.status}</Badge>
            </div>
          ))
        ) : (
          <Notice tone="green">No escalations right now.</Notice>
        )}
      </Card>

      <Card title="Notify">
        <div className="page-sub" style={{ marginBottom: 10 }}>Choose exactly who should receive this notice, or notify everyone at once.</div>
        <div className="field">
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} /> Notify All (every mentor, mentee and coordinator)
          </label>
        </div>
        <div className="grid2">
          <div className="field">
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="checkbox" checked={useMentor} disabled={all} onChange={(e) => setUseMentor(e.target.checked)} /> Mentor
            </label>
            <select className="input" disabled={all || !useMentor} value={mentorId} onChange={(e) => setMentorId(e.target.value)}>
              {mentors.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="checkbox" checked={useMentee} disabled={all} onChange={(e) => setUseMentee(e.target.checked)} /> Mentee
            </label>
            <select className="input" disabled={all || !useMentee} value={menteeId} onChange={(e) => setMenteeId(e.target.value)}>
              {mentees.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="checkbox" checked={useCoordinator} disabled={all} onChange={(e) => setUseCoordinator(e.target.checked)} /> Coordinator
            </label>
            <select className="input" disabled={all || !useCoordinator} value={coordinatorId} onChange={(e) => setCoordinatorId(e.target.value)}>
              {coordinators.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="field">
          <label className="label">Message</label>
          <textarea className="input" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>
        <button className="btn btn-accent" onClick={send}>Send notice</button>
        {result && <div style={{ marginTop: 10 }}><Notice tone={result.tone}>{result.text}</Notice></div>}
      </Card>
    </div>
  );
}
