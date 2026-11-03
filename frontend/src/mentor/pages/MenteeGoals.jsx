import { useEffect, useState } from 'react';
import { mentorApi } from '../MentorRoot.jsx';
import { Card, Notice } from '../../components/ui.jsx';

const CATEGORIES = [
  { key: 'academic', label: 'Academic Goal' },
  { key: 'personal', label: 'Personal Goal' },
  { key: 'professional', label: 'Professional Goal' }
];

export default function MenteeGoals() {
  const [mentees, setMentees] = useState([]);
  const [menteeId, setMenteeId] = useState('');
  const [history, setHistory] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [note, setNote] = useState(null);

  useEffect(() => {
    mentorApi('/mentor/mentees').then((list) => {
      setMentees(list);
      if (list.length) setMenteeId(list[0].id);
    });
  }, []);

  async function load() {
    if (!menteeId) return;
    const list = await mentorApi(`/mentor/goals/${menteeId}`);
    setHistory(list);
    const nextDrafts = {};
    list.forEach((entry) => {
      CATEGORIES.forEach((cat) => {
        nextDrafts[`${entry.id}:${cat.key}`] = entry[cat.key].mentorComment;
      });
    });
    setDrafts(nextDrafts);
  }
  useEffect(() => { load(); }, [menteeId]);

  async function saveComment(goalId, category) {
    try {
      await mentorApi(`/mentor/goals/${menteeId}/${goalId}/comment`, {
        method: 'PUT',
        body: JSON.stringify({ category, comment: drafts[`${goalId}:${category}`] || '' })
      });
      setNote({ tone: 'green', text: 'Comment saved.' });
      load();
    } catch (e) {
      setNote({ tone: 'red', text: e.message });
    }
  }

  return (
    <div>
      <div className="page-title">Mentee Goals</div>
      <div className="page-sub">See each mentee's academic, personal, and professional goals by semester, and leave a comment on any of them.</div>

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

      {note && <Notice tone={note.tone}>{note.text}</Notice>}

      {history.length === 0 && <div className="notice notice-blue">This mentee hasn't set any goals yet.</div>}

      {history.map((entry) => (
        <Card title={`Semester ${entry.semester}`} key={entry.id}>
          {CATEGORIES.map((cat) => (
            <div key={cat.key} style={{ marginBottom: 18, paddingBottom: 18, borderBottom: '1px solid var(--border)' }}>
              <div className="row" style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{cat.label}</span>
                <span className="badge b-blue">{entry[cat.key].status} · {entry[cat.key].progress}%</span>
              </div>
              <div style={{ fontSize: 13, color: '#c3cbdb', marginBottom: 10 }}>{entry[cat.key].text || 'Not set yet.'}</div>
              <div className="field">
                <label className="label">Your comment</label>
                <textarea
                  className="input"
                  rows={2}
                  value={drafts[`${entry.id}:${cat.key}`] || ''}
                  onChange={(e) => setDrafts({ ...drafts, [`${entry.id}:${cat.key}`]: e.target.value })}
                />
              </div>
              <button className="btn btn-accent btn-xs" onClick={() => saveComment(entry.id, cat.key)}>Save comment</button>
            </div>
          ))}
        </Card>
      ))}
    </div>
  );
}
