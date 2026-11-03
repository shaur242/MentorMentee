import { useEffect, useMemo, useState } from 'react';
import { mentorApi } from '../MentorRoot.jsx';
import { Card, Notice, DateField } from '../../components/ui.jsx';

function defaultDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default function GroupMeet() {
  const [mentees, setMentees] = useState([]);
  const [selected, setSelected] = useState([]);
  const [date, setDate] = useState(defaultDate());
  const [time, setTime] = useState('15:00');
  const [mode, setMode] = useState('In-person — Seminar Hall');
  const [duration, setDuration] = useState('30 minutes');
  const [agenda, setAgenda] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    mentorApi('/mentor/mentees').then(setMentees);
  }, []);

  const byClass = useMemo(() => {
    const groups = {};
    mentees.forEach((m) => {
      const key = m.classCode || 'Unassigned';
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    });
    return groups;
  }, [mentees]);
  const classCodes = Object.keys(byClass).sort();

  function toggle(id) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }
  function toggleAll(checked) {
    setSelected(checked ? mentees.map((m) => m.id) : []);
  }
  function selectClass(classCode) {
    const ids = byClass[classCode].map((m) => m.id);
    const allSelected = ids.every((id) => selected.includes(id));
    setSelected((s) => (allSelected ? s.filter((id) => !ids.includes(id)) : Array.from(new Set([...s, ...ids]))));
  }

  async function schedule() {
    if (!selected.length || !date) return setResult({ tone: 'red', text: 'Select at least one mentee and a date.' });
    try {
      await mentorApi('/mentor/group-meets', { method: 'POST', body: JSON.stringify({ menteeIds: selected, date, time, mode, duration, agenda }) });
      setResult({ tone: 'green', text: `Group meet scheduled with ${selected.length} mentee(s) on ${date}.` });
    } catch (e) {
      setResult({ tone: 'red', text: e.message });
    }
  }

  return (
    <div>
      <div className="page-title">Group Meet</div>
      <div className="page-sub">Schedule a mentoring session with several mentees at once</div>
      <Card>
        <div className="field">
          <label className="label">Select mentees</label>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 12, color: 'var(--muted)' }}>
              <input type="checkbox" checked={selected.length === mentees.length && mentees.length > 0} onChange={(e) => toggleAll(e.target.checked)} /> Select all
            </label>
            <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 8 }}>{selected.length} selected</span>
          </div>

          {mentees.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)' }}>You have no mentees to invite yet.</div>}

          {classCodes.length > 1 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {classCodes.map((code) => {
                const ids = byClass[code].map((m) => m.id);
                const allSelected = ids.every((id) => selected.includes(id));
                return (
                  <button
                    key={code}
                    type="button"
                    className={`btn btn-xs ${allSelected ? 'btn-accent' : ''}`}
                    onClick={() => selectClass(code)}
                  >
                    Select {code} ({ids.length})
                  </button>
                );
              })}
            </div>
          )}

          {classCodes.map((code) => (
            <div key={code} style={{ marginBottom: 10 }}>
              {classCodes.length > 1 && <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 4 }}>{code}</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {byClass[code].map((m) => (
                  <label key={m.id} style={{ fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="checkbox" checked={selected.includes(m.id)} onChange={() => toggle(m.id)} /> {m.name}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="grid2">
          <DateField value={date} onChange={setDate} />
          <div className="field"><label className="label">Time</label><input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div>
        </div>
        <div className="grid2">
          <div className="field">
            <label className="label">Mode</label>
            <select className="input" value={mode} onChange={(e) => setMode(e.target.value)}>
              <option>In-person — Seminar Hall</option><option>Online — Jitsi Meet</option>
            </select>
          </div>
          <div className="field">
            <label className="label">Duration</label>
            <select className="input" value={duration} onChange={(e) => setDuration(e.target.value)}>
              <option>30 minutes</option><option>45 minutes</option><option>60 minutes</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label className="label">Agenda</label>
          <textarea className="input" rows={3} value={agenda} onChange={(e) => setAgenda(e.target.value)} />
        </div>
        <button className="btn btn-accent" onClick={schedule}>Schedule group meet</button>
        {result && <div style={{ marginTop: 10 }}><Notice tone={result.tone}>{result.text}</Notice></div>}
      </Card>
    </div>
  );
}
