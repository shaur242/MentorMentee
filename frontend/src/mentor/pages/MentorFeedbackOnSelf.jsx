import { useEffect, useState } from 'react';
import { mentorApi } from '../MentorRoot.jsx';
import { Card, Notice } from '../../components/ui.jsx';

const SELF_FIELDS = [
  { key: 'strengths', label: 'My strengths are' },
  { key: 'improve', label: 'I would like to improve upon' },
  { key: 'continueDoing', label: 'I would like to continue doing' },
  { key: 'stopDoing', label: 'I would like to stop doing' }
];
const FEEDBACK_FIELDS = [
  { key: 'strengths', label: 'I noticed your strength in' },
  { key: 'improve', label: 'In my view you can improve in' },
  { key: 'continueDoing', label: 'Keep continuing' },
  { key: 'stopDoing', label: 'What can be discontinued' }
];

export default function MentorFeedbackOnSelf() {
  const [mentees, setMentees] = useState([]);
  const [menteeId, setMenteeId] = useState('');
  const [selfRecord, setSelfRecord] = useState(null);
  const [form, setForm] = useState({ strengths: '', improve: '', continueDoing: '', stopDoing: '' });
  const [note, setNote] = useState(null);

  useEffect(() => {
    mentorApi('/mentor/mentees').then((list) => {
      setMentees(list);
      if (list.length) setMenteeId(list[0].id);
    });
  }, []);

  async function load() {
    if (!menteeId) return;
    const record = await mentorApi(`/mentor/self-validation/${menteeId}`);
    setSelfRecord(record);
    setForm({
      strengths: record.mentorFeedback.strengths,
      improve: record.mentorFeedback.improve,
      continueDoing: record.mentorFeedback.continueDoing,
      stopDoing: record.mentorFeedback.stopDoing
    });
    setNote(null);
  }
  useEffect(() => { load(); }, [menteeId]);

  async function submit() {
    try {
      await mentorApi(`/mentor/self-validation/${menteeId}/feedback`, { method: 'PUT', body: JSON.stringify(form) });
      setNote({ tone: 'green', text: 'Feedback saved — the mentee will see this on their Self Validation page.' });
      load();
    } catch (e) {
      setNote({ tone: 'red', text: e.message });
    }
  }

  const hasSelfData = selfRecord && (selfRecord.strengths || selfRecord.improve || selfRecord.continueDoing || selfRecord.stopDoing);

  return (
    <div>
      <div className="page-title">Mentor Feedback</div>
      <div className="page-sub">Review your mentee's self-validation and respond with your own view on each point.</div>

      <Card>
        <div className="field">
          <label className="label">Mentee</label>
          <select className="input" value={menteeId} onChange={(e) => setMenteeId(e.target.value)}>
            {mentees.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      </Card>

      <Card title="Mentee's self-validation">
        {!hasSelfData && <div style={{ fontSize: 13, color: 'var(--muted)' }}>This mentee hasn't submitted a self-validation yet.</div>}
        {hasSelfData &&
          SELF_FIELDS.map((f) => (
            <div className="field" key={f.key}>
              <label className="label">{f.label}</label>
              <div style={{ fontSize: 13, color: '#c3cbdb' }}>{selfRecord[f.key] || '-'}</div>
            </div>
          ))}
      </Card>

      <Card title="Your feedback">
        {FEEDBACK_FIELDS.map((f) => (
          <div className="field" key={f.key}>
            <label className="label">{f.label}</label>
            <textarea className="input" rows={3} value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
          </div>
        ))}
        <button className="btn btn-accent" onClick={submit}>Submit feedback</button>
        {note && <div style={{ marginTop: 10 }}><Notice tone={note.tone}>{note.text}</Notice></div>}
      </Card>
    </div>
  );
}
