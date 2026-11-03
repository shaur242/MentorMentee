import { useEffect, useState } from 'react';
import { mentorApi } from '../MentorRoot.jsx';
import { Card, Notice } from '../../components/ui.jsx';

const CATEGORIES = ['Attendance shortage', 'Academic / personal concern', 'Ragging / harassment report', 'Other critical concern'];

export default function CriticalIssue() {
  const [mentees, setMentees] = useState([]);
  const [menteeId, setMenteeId] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [details, setDetails] = useState('');
  const [note, setNote] = useState(null);
  const [history, setHistory] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editCategory, setEditCategory] = useState(CATEGORIES[0]);
  const [editDetails, setEditDetails] = useState('');

  async function loadHistory() {
    const list = await mentorApi('/mentor/critical-issues');
    setHistory(list);
  }
  useEffect(() => {
    mentorApi('/mentor/mentees').then((list) => {
      setMentees(list);
      if (list.length) setMenteeId(list[0].id);
    });
    loadHistory();
  }, []);

  async function submit() {
    if (!menteeId || !details.trim()) return setNote({ tone: 'red', text: 'Select a mentee and describe the issue.' });
    try {
      await mentorApi('/mentor/critical-issues', { method: 'POST', body: JSON.stringify({ menteeId, category, details }) });
      setNote({ tone: 'green', text: 'Escalation submitted to the HOD.' });
      setDetails('');
      loadHistory();
    } catch (e) {
      setNote({ tone: 'red', text: e.message });
    }
  }

  function startEdit(issue) {
    setEditingId(issue.id);
    setEditCategory(issue.category);
    setEditDetails(issue.details);
  }
  async function saveEdit(id) {
    try {
      await mentorApi(`/mentor/critical-issues/${id}`, { method: 'PUT', body: JSON.stringify({ category: editCategory, details: editDetails }) });
      setEditingId(null);
      loadHistory();
    } catch (e) {
      alert(e.message);
    }
  }
  async function deleteIssue(id) {
    if (!confirm('Delete this escalation? This cannot be undone.')) return;
    try {
      await mentorApi(`/mentor/critical-issues/${id}`, { method: 'DELETE' });
      loadHistory();
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div>
      <div className="page-title">Report Critical Issue</div>
      <Notice tone="amber">Confidential — shared with the HOD on a need-to-know basis, for matters beyond normal mentoring scope.</Notice>
      <Card>
        <div className="field">
          <label className="label">Mentee</label>
          <select className="input" value={menteeId} onChange={(e) => setMenteeId(e.target.value)}>
            {mentees.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="label">Issue category</label>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="label">Details</label>
          <textarea className="input" rows={4} value={details} onChange={(e) => setDetails(e.target.value)} />
        </div>
        <button className="btn btn-red" onClick={submit}>Submit confidential escalation</button>
        {note && <div style={{ marginTop: 10 }}><Notice tone={note.tone}>{note.text}</Notice></div>}
      </Card>
      <Card title="My submitted escalations">
        {history.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)' }}>No escalations submitted yet.</div>}
        {history.map((i) =>
          editingId === i.id ? (
            <div className="card" key={i.id} style={{ marginBottom: 10 }}>
              <div className="field">
                <label className="label">Issue category</label>
                <select className="input" value={editCategory} onChange={(e) => setEditCategory(e.target.value)}>
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="field" style={{ marginBottom: 10 }}>
                <label className="label">Details</label>
                <textarea className="input" rows={3} value={editDetails} onChange={(e) => setEditDetails(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-accent btn-xs" onClick={() => saveEdit(i.id)}>Save</button>
                <button className="btn btn-xs" onClick={() => setEditingId(null)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="row" key={i.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <b style={{ fontSize: 13 }}>{i.category}</b>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{i.id} · {i.menteeName} · {i.date}</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-xs" onClick={() => startEdit(i)}>Edit</button>
                <button className="btn btn-xs btn-red" onClick={() => deleteIssue(i.id)}>Delete</button>
              </div>
            </div>
          )
        )}
      </Card>
    </div>
  );
}
