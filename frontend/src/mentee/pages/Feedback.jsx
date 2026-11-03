import { useEffect, useState } from 'react';
import { menteeApi } from '../MenteeRoot.jsx';
import { Card, Notice, StarRow } from '../../components/ui.jsx';

const METRICS = [
  { key: 'availability', label: 'Availability & punctuality' },
  { key: 'communication', label: 'Communication quality' },
  { key: 'guidance', label: 'Academic guidance' },
  { key: 'overall', label: 'Overall experience' }
];

export default function Feedback({ ctx }) {
  const { mentor } = ctx;
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState('');
  const [ratings, setRatings] = useState({ availability: 5, communication: 5, guidance: 5, overall: 5 });
  const [comment, setComment] = useState('');
  const [note, setNote] = useState(null);

  useEffect(() => {
    menteeApi('/mentee/sessions').then((list) => {
      setSessions(list);
      if (list.length) setSessionId(list[0].id);
    });
  }, []);

  async function submit() {
    try {
      await menteeApi('/mentee/feedback', { method: 'POST', body: JSON.stringify({ sessionId, ratings, comment }) });
      setNote({ tone: 'green', text: 'Thanks — your feedback has been recorded.' });
    } catch (e) {
      setNote({ tone: 'red', text: e.message });
    }
  }

  return (
    <div>
      <div className="page-title">Give Feedback</div>
      <div className="page-sub">Rate your mentor after each session</div>
      <Card title={<>Feedback for {mentor?.name || 'your mentor'}</>}>
        <div className="field">
          <label className="label">Which session?</label>
          <select className="input" value={sessionId} onChange={(e) => setSessionId(e.target.value)}>
            {sessions.length === 0 && <option value="">No sessions yet</option>}
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>{s.title} · {s.label}</option>
            ))}
          </select>
        </div>
        <hr className="div" />
        {METRICS.map((m) => (
          <div className="field" key={m.key}>
            <label className="label">{m.label}</label>
            <StarRow value={ratings[m.key]} onChange={(v) => setRatings({ ...ratings, [m.key]: v })} />
          </div>
        ))}
        <div className="field">
          <label className="label">Comments</label>
          <textarea className="input" rows={3} placeholder="Share your experience..." value={comment} onChange={(e) => setComment(e.target.value)} />
        </div>
        <button className="btn" style={{ background: 'var(--amber)', borderColor: 'var(--amber)', color: '#1a1200' }} onClick={submit}>Submit feedback</button>
        {note && <div style={{ marginTop: 10 }}><Notice tone={note.tone}>{note.text}</Notice></div>}
      </Card>
    </div>
  );
}
