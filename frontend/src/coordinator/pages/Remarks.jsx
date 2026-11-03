import { useEffect, useState } from 'react';
import { coordinatorApi } from '../CoordinatorRoot.jsx';
import { Card } from '../../components/ui.jsx';

export default function Remarks() {
  const [mentors, setMentors] = useState([]);
  const [mentorId, setMentorId] = useState('');
  const [mentees, setMentees] = useState([]);
  const [menteeId, setMenteeId] = useState('');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    coordinatorApi('/coordinator/mentors').then((list) => {
      setMentors(list);
      if (list.length) setMentorId(list[0].id);
    });
  }, []);

  useEffect(() => {
    if (!mentorId) return;
    coordinatorApi('/coordinator/dashboard').then((dash) => {
      const row = dash.mentorOverview.find((m) => m.id === mentorId);
      const list = row ? row.mentees || [] : [];
      setMentees(list);
      if (list.length) setMenteeId(list[0].id);
      else setMenteeId('');
    });
  }, [mentorId]);

  useEffect(() => {
    if (!mentorId || !menteeId) return;
    coordinatorApi(`/coordinator/remarks?mentorId=${mentorId}&menteeId=${menteeId}`).then(setHistory);
  }, [mentorId, menteeId]);

  return (
    <div>
      <div className="page-title">Remarks</div>
      <div className="page-sub">Read-only view of what a mentor has submitted for a mentee, across the whole semester</div>
      <Card>
        <div className="grid2">
          <div className="field">
            <label className="label">Mentor</label>
            <select className="input" value={mentorId} onChange={(e) => setMentorId(e.target.value)}>
              {mentors.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label">Mentee</label>
            <select className="input" value={menteeId} onChange={(e) => setMenteeId(e.target.value)}>
              {mentees.length === 0 && <option value="">No mentees</option>}
              {mentees.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>
      <Card title="Submitted remarks">
        {history.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)' }}>No remarks submitted yet for this pair.</div>}
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
