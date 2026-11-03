import { useEffect, useState } from 'react';
import { menteeApi } from '../MenteeRoot.jsx';
import { Card, Notice } from '../../components/ui.jsx';

const FIELDS = [
  { key: 'strengths', label: 'My strengths are' },
  { key: 'improve', label: 'I would like to improve upon' },
  { key: 'continueDoing', label: 'I would like to continue doing' },
  { key: 'stopDoing', label: 'I would like to stop doing' }
];

export default function SelfValidation() {
  const [form, setForm] = useState({ strengths: '', improve: '', continueDoing: '', stopDoing: '' });
  const [mentorFeedback, setMentorFeedback] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [note, setNote] = useState(null);

  async function load() {
    const record = await menteeApi('/mentee/self-validation');
    setForm({
      strengths: record.strengths,
      improve: record.improve,
      continueDoing: record.continueDoing,
      stopDoing: record.stopDoing
    });
    setUpdatedAt(record.updatedAt);
    setMentorFeedback(record.mentorFeedback && record.mentorFeedback.updatedAt ? record.mentorFeedback : null);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    try {
      await menteeApi('/mentee/self-validation', { method: 'PUT', body: JSON.stringify(form) });
      setNote({ tone: 'green', text: 'Self-validation saved.' });
      load();
    } catch (e) {
      setNote({ tone: 'red', text: e.message });
    }
  }

  return (
    <div>
      <div className="page-title">Self Validation</div>
      <div className="page-sub">A reflective check-in on yourself. Your mentor will see this and respond with their own view on a separate page.</div>

      <Card>
        {FIELDS.map((f) => (
          <div className="field" key={f.key}>
            <label className="label">{f.label}</label>
            <textarea className="input" rows={3} value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
          </div>
        ))}
        <button className="btn btn-accent" onClick={save}>Save</button>
        {updatedAt && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>Last updated {new Date(updatedAt).toLocaleString()}</div>}
        {note && <div style={{ marginTop: 10 }}><Notice tone={note.tone}>{note.text}</Notice></div>}
      </Card>

      <Card title="Your mentor's view">
        {!mentorFeedback && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Your mentor hasn't responded yet.</div>}
        {mentorFeedback && (
          <div>
            <div className="field"><label className="label">I noticed your strength in</label><div style={{ fontSize: 13 }}>{mentorFeedback.strengths || '-'}</div></div>
            <div className="field"><label className="label">In my view you can improve in</label><div style={{ fontSize: 13 }}>{mentorFeedback.improve || '-'}</div></div>
            <div className="field"><label className="label">Keep continuing</label><div style={{ fontSize: 13 }}>{mentorFeedback.continueDoing || '-'}</div></div>
            <div className="field" style={{ marginBottom: 0 }}><label className="label">What can be discontinued</label><div style={{ fontSize: 13 }}>{mentorFeedback.stopDoing || '-'}</div></div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 10 }}>Last updated {new Date(mentorFeedback.updatedAt).toLocaleString()}</div>
          </div>
        )}
      </Card>
    </div>
  );
}
