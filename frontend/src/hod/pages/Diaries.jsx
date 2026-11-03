import { useEffect, useState } from 'react';
import { hodApi } from '../HodRoot.jsx';
import { Card } from '../../components/ui.jsx';

export default function Diaries() {
  const [pairs, setPairs] = useState([]);
  const [overview, setOverview] = useState([]);
  const [mentorId, setMentorId] = useState('');
  const [mentees, setMentees] = useState([]);
  const [menteeId, setMenteeId] = useState('');
  const [history, setHistory] = useState([]);

  async function loadOverview() {
    const res = await hodApi('/hod/allocation');
    setOverview(res.overview);
    const list = [];
    res.overview.forEach((m) => m.mentees.forEach((mn) => list.push({ mentorName: m.name, mentorId: m.id, mentee: mn })));
    setPairs(list);
    const withMentees = res.overview.filter((m) => m.mentees.length);
    if (withMentees.length) {
      setMentorId(withMentees[0].id);
      setMentees(withMentees[0].mentees);
      setMenteeId(withMentees[0].mentees[0].id);
    }
  }
  useEffect(() => { loadOverview(); }, []);

  function onMentorChange(id) {
    setMentorId(id);
    const row = overview.find((m) => m.id === id);
    const list = row ? row.mentees : [];
    setMentees(list);
    setMenteeId(list.length ? list[0].id : '');
  }

  useEffect(() => {
    if (!mentorId || !menteeId) return;
    hodApi(`/hod/remarks?mentorId=${mentorId}&menteeId=${menteeId}`).then(setHistory);
  }, [mentorId, menteeId]);

  async function pairingAction(id, action) {
    try {
      const res = await hodApi(`/hod/pairings/${id}/${action}`, { method: 'POST' });
      alert(res.message);
      loadOverview();
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div>
      <div className="page-title">Mentoring Diaries</div>
      <div className="page-sub">Read-only view of remarks submitted for each pair, plus pairing oversight.</div>

      <Card title="Mentor-Mentee Pairings">
        {pairs.length ? (
          pairs.map((p) => (
            <div className="row" key={p.mentee.id} style={{ padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13 }}>{p.mentorName} - {p.mentee.name}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-xs btn-accent" onClick={() => pairingAction(p.mentee.id, 'accept')}>Accept</button>
                <button className="btn btn-xs btn-red" onClick={() => pairingAction(p.mentee.id, 'decline')}>Decline</button>
              </div>
            </div>
          ))
        ) : (
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>No pairings yet.</div>
        )}
      </Card>

      <Card title="Open a Diary">
        <div className="grid2">
          <div className="field">
            <label className="label">Mentor</label>
            <select className="input" value={mentorId} onChange={(e) => onMentorChange(e.target.value)}>
              {overview.filter((m) => m.mentees.length).map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label">Mentee</label>
            <select className="input" value={menteeId} onChange={(e) => setMenteeId(e.target.value)}>
              {mentees.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>
        {history.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)' }}>No remarks submitted yet.</div>}
        {history.map((h) => (
          <div className="card" key={h.id} style={{ marginBottom: 10 }}>
            <div className="row" style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{h.date}</span>
              <span className="badge b-blue" style={{ textTransform: 'capitalize' }}>{h.mode}</span>
            </div>
            {h.transcript && (
              <div style={{ marginBottom: h.cells.length ? 10 : 0 }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Transcript</div>
                <div style={{ fontSize: 13, whiteSpace: 'pre-wrap', color: '#c3cbdb' }}>{h.transcript}</div>
              </div>
            )}
            {h.cells.length > 0 &&
              h.cells.map((c, i) => (
                <div key={i} style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>Q: {c.question}</div>
                  <div style={{ fontSize: 13 }}>{c.answer}</div>
                </div>
              ))}
          </div>
        ))}
      </Card>
    </div>
  );
}
