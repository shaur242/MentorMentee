import { useEffect, useState } from 'react';
import { coordinatorApi } from '../CoordinatorRoot.jsx';
import { Card, StarRow, Notice } from '../../components/ui.jsx';

export default function Feedback() {
  const [rows, setRows] = useState(null);

  async function load() {
    const res = await coordinatorApi('/coordinator/feedback');
    setRows(res);
  }
  useEffect(() => { load(); }, []);

  if (!rows) return null;

  return (
    <div>
      <div className="page-title">Feedback</div>
      <div className="page-sub">Per-mentor feedback summary, mentee feedback, and your own rating of each mentor</div>
      {rows.map((r) => (
        <MentorFeedbackCard key={r.mentorId} row={r} onSaved={load} />
      ))}
    </div>
  );
}

function MentorFeedbackCard({ row, onSaved }) {
  const [stars, setStars] = useState(row.coordinatorFeedback ? row.coordinatorFeedback.stars : 5);
  const [comment, setComment] = useState(row.coordinatorFeedback ? row.coordinatorFeedback.comment : '');
  const [note, setNote] = useState(null);

  async function submit() {
    try {
      await coordinatorApi('/coordinator/feedback', { method: 'POST', body: JSON.stringify({ mentorId: row.mentorId, stars, comment }) });
      setNote({ tone: 'green', text: 'Feedback saved — the mentor will see this on their Feedback page.' });
      onSaved();
    } catch (e) {
      setNote({ tone: 'red', text: e.message });
    }
  }

  return (
    <Card title={<>{row.mentorName}</>}>
      <div className="grid2" style={{ marginBottom: 14 }}>
        {['availability', 'communication', 'guidance', 'overall'].map((k) => (
          <div key={k}>
            <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'capitalize' }}>{k}</div>
            <div style={{ fontWeight: 600 }}>{row.avgs[k] ?? '—'}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Mentee-wise feedback</div>
      <div style={{ marginBottom: 14 }}>
        {row.entries.length ? (
          row.entries.map((e) => (
            <div className="row" key={e.id} style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 12 }}>{e.menteeName}</span>
              <span style={{ fontSize: 12, color: 'var(--amber)' }}>{'★'.repeat(e.ratings.overall || 0)}</span>
            </div>
          ))
        ) : (
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>No mentee feedback yet.</div>
        )}
      </div>
      <hr className="div" />
      <div className="field"><label className="label">Your feedback to this mentor</label></div>
      <div style={{ marginBottom: 10 }}>
        <StarRow value={stars} onChange={setStars} />
      </div>
      <textarea className="input" rows={2} placeholder="Write your feedback..." value={comment} onChange={(e) => setComment(e.target.value)} />
      <button className="btn btn-accent btn-xs" style={{ marginTop: 8 }} onClick={submit}>Submit</button>
      {note && <div style={{ marginTop: 8 }}><Notice tone={note.tone}>{note.text}</Notice></div>}
    </Card>
  );
}
