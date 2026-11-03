import { useEffect, useState } from 'react';
import { mentorApi } from '../MentorRoot.jsx';
import { Card, SlotGrid, DateField } from '../../components/ui.jsx';
import { SessionRow } from './Home.jsx';

function defaultDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}
function formatDateLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function SessionRequests({ ctx }) {
  const { refreshDashboard } = ctx;
  const [sessions, setSessions] = useState([]);
  const [reschedId, setReschedId] = useState(null);
  const [reschedDate, setReschedDate] = useState(defaultDate());
  const [slots, setSlots] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reason, setReason] = useState('');

  async function load() {
    const list = await mentorApi('/mentor/sessions');
    setSessions(list);
  }
  useEffect(() => { load(); }, []);

  async function respond(sessionId, action) {
    try {
      await mentorApi(`/mentor/sessions/${sessionId}/respond`, { method: 'POST', body: JSON.stringify({ action }) });
      await load();
      await refreshDashboard();
    } catch (e) {
      alert(e.message);
    }
  }

  async function fetchSlots(date) {
    const list = await mentorApi(`/mentor/slots?date=${date}`);
    setSlots(list);
  }

  function startReschedule(s) {
    setReschedId(s.id);
    setSelected(null);
    setReason('');
    const d = defaultDate();
    setReschedDate(d);
    fetchSlots(d);
  }

  useEffect(() => {
    if (reschedId) fetchSlots(reschedDate);
  }, [reschedDate, reschedId]);

  async function submitReschedule() {
    if (!selected) return alert('Pick a free slot first.');
    try {
      await mentorApi(`/mentor/sessions/${reschedId}/reschedule`, {
        method: 'PUT',
        body: JSON.stringify({ date: reschedDate, label: formatDateLabel(reschedDate), time: selected.time, timeLabel: selected.label, reason })
      });
      setReschedId(null);
      await load();
      await refreshDashboard();
      alert('Session rescheduled — the mentee will see the updated time.');
    } catch (e) {
      alert(e.message);
    }
  }

  const pending = sessions.filter((s) => s.status === 'pending');
  const reschedulingSession = sessions.find((s) => s.id === reschedId);

  return (
    <div>
      <div className="page-title">Session Requests</div>
      <div className="page-sub">Sessions awaiting your response, plus any you've proposed to a mentee</div>

      <Card title="Incoming Requests">
        {pending.length ? pending.map((s) => <SessionRow key={s.id} s={s} onRespond={respond} onReschedule={startReschedule} />) : <div style={{ fontSize: 13, color: 'var(--muted)' }}>Nothing waiting on you right now.</div>}
      </Card>

      <Card title="All Sessions">
        {sessions.length ? sessions.map((s) => <SessionRow key={s.id} s={s} onRespond={respond} onReschedule={startReschedule} />) : <div style={{ fontSize: 13, color: 'var(--muted)' }}>No sessions yet.</div>}
      </Card>

      {reschedulingSession && (
        <Card title={`Rescheduling: ${reschedulingSession.title} · ${reschedulingSession.menteeName}`}>
          <DateField value={reschedDate} onChange={setReschedDate} />
          <SlotGrid slots={slots} selected={selected} onPick={setSelected} />
          <div className="field">
            <label className="label">Selected time</label>
            <input className="input" readOnly value={selected ? selected.label : 'Click a green slot above'} style={{ color: selected ? undefined : 'var(--muted)' }} />
          </div>
          <div className="field">
            <label className="label">Reason (optional)</label>
            <textarea className="input" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-accent" onClick={submitReschedule}>Confirm reschedule</button>
            <button className="btn" onClick={() => setReschedId(null)}>Cancel</button>
          </div>
        </Card>
      )}
    </div>
  );
}
