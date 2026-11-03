import { useEffect, useState } from 'react';
import { menteeApi } from '../MenteeRoot.jsx';
import { Card, Notice, ProgressBar } from '../../components/ui.jsx';

const STATUSES = ['Not started', 'In progress', 'Achieved', 'Not achieved'];
const CATEGORIES = [
  { key: 'academic', label: 'Academic Goal' },
  { key: 'personal', label: 'Personal Goal' },
  { key: 'professional', label: 'Professional Goal' }
];

function blank() {
  return { text: '', status: 'Not started', progress: 0 };
}

export default function Goals({ ctx }) {
  const { mentee } = ctx;
  const [history, setHistory] = useState([]);
  const [semester, setSemester] = useState(mentee.semester);
  const [form, setForm] = useState({ academic: blank(), personal: blank(), professional: blank() });
  const [note, setNote] = useState(null);

  async function load() {
    const list = await menteeApi('/mentee/goals');
    setHistory(list);
    const current = list.find((g) => g.semester === semester);
    if (current) {
      setForm({
        academic: { text: current.academic.text, status: current.academic.status, progress: current.academic.progress },
        personal: { text: current.personal.text, status: current.personal.status, progress: current.personal.progress },
        professional: { text: current.professional.text, status: current.professional.status, progress: current.professional.progress }
      });
    } else {
      setForm({ academic: blank(), personal: blank(), professional: blank() });
    }
  }
  useEffect(() => { load(); }, [semester]);

  function update(category, key, value) {
    setForm({ ...form, [category]: { ...form[category], [key]: value } });
  }

  async function save() {
    try {
      await menteeApi('/mentee/goals', {
        method: 'POST',
        body: JSON.stringify({ semester, academic: form.academic, personal: form.personal, professional: form.professional })
      });
      setNote({ tone: 'green', text: `Goals saved for Semester ${semester}.` });
      load();
    } catch (e) {
      setNote({ tone: 'red', text: e.message });
    }
  }

  const pastEntries = history.filter((h) => h.semester !== semester);

  return (
    <div>
      <div className="page-title">My Goals</div>
      <div className="page-sub">Set your academic, personal, and professional goals — revisit and update them each semester. Your mentor can see your progress and leave comments.</div>

      <Card>
        <div className="field">
          <label className="label">Semester</label>
          <select className="input" value={semester} onChange={(e) => setSemester(Number(e.target.value))}>
            {Array.from({ length: 8 }, (_, i) => i + 1).map((s) => (
              <option key={s} value={s}>Semester {s}</option>
            ))}
          </select>
        </div>
      </Card>

      {CATEGORIES.map((cat) => (
        <Card title={cat.label} key={cat.key}>
          <div className="field">
            <label className="label">Goal</label>
            <textarea className="input" rows={2} value={form[cat.key].text} onChange={(e) => update(cat.key, 'text', e.target.value)} />
          </div>
          <div className="grid2">
            <div className="field">
              <label className="label">Status</label>
              <select className="input" value={form[cat.key].status} onChange={(e) => update(cat.key, 'status', e.target.value)}>
                {STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="label">Progress ({form[cat.key].progress}%)</label>
              <input
                className="input"
                type="range"
                min="0"
                max="100"
                value={form[cat.key].progress}
                onChange={(e) => update(cat.key, 'progress', Number(e.target.value))}
              />
            </div>
          </div>
          <ProgressBar pct={form[cat.key].progress} color="var(--blue)" />

          {history.find((h) => h.semester === semester)?.[cat.key]?.mentorComment && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Mentor's comment</div>
              <div style={{ fontSize: 13, color: '#c3cbdb', background: 'var(--panel-2)', padding: 10, borderRadius: 8 }}>
                {history.find((h) => h.semester === semester)[cat.key].mentorComment}
              </div>
            </div>
          )}
        </Card>
      ))}

      <button className="btn btn-accent" onClick={save}>Save goals for Semester {semester}</button>
      {note && <div style={{ marginTop: 10 }}><Notice tone={note.tone}>{note.text}</Notice></div>}

      {pastEntries.length > 0 && (
        <Card title="Previous semesters" className="" >
          {pastEntries.map((h) => (
            <div key={h.id} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Semester {h.semester}</div>
              {CATEGORIES.map((cat) => (
                <div key={cat.key} style={{ marginBottom: 8 }}>
                  <div className="row" style={{ marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>{cat.label}</span>
                    <span className="badge b-blue">{h[cat.key].status} · {h[cat.key].progress}%</span>
                  </div>
                  <div style={{ fontSize: 13 }}>{h[cat.key].text || '-'}</div>
                  {h[cat.key].mentorComment && (
                    <div style={{ fontSize: 12, color: '#c3cbdb', marginTop: 4, background: 'var(--panel-2)', padding: 8, borderRadius: 6 }}>
                      Mentor: {h[cat.key].mentorComment}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
