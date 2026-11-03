import { useEffect, useState } from 'react';
import { menteeApi } from '../MenteeRoot.jsx';
import { Card, Notice, SlotGrid, DateField } from '../../components/ui.jsx';

function defaultDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}
function formatDateLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function BookSession({ ctx }) {
  const { mentor } = ctx;
  const [sessions, setSessions] = useState([]);

  // New session state
  const [newAfterClass, setNewAfterClass] = useState(false);
  const [newDate, setNewDate] = useState(defaultDate());
  const [newSlots, setNewSlots] = useState([]);
  const [newSelected, setNewSelected] = useState(null);
  const [newAcDate, setNewAcDate] = useState(defaultDate());
  const [newAcTime, setNewAcTime] = useState('16:30');
  const [duration, setDuration] = useState('30 minutes');
  const [mode, setMode] = useState('In-person');
  const [agenda, setAgenda] = useState('');
  const [newBanner, setNewBanner] = useState(null);

  // Reschedule state
  const [reschedSessionId, setReschedSessionId] = useState(null);
  const [reschedAfterClass, setReschedAfterClass] = useState(false);
  const [reschedDate, setReschedDate] = useState(defaultDate());
  const [reschedSlots, setReschedSlots] = useState([]);
  const [reschedSelected, setReschedSelected] = useState(null);
  const [reschedAcDate, setReschedAcDate] = useState(defaultDate());
  const [reschedAcTime, setReschedAcTime] = useState('16:30');
  const [reason, setReason] = useState('');

  async function loadSessions() {
    const list = await menteeApi('/mentee/sessions');
    setSessions(list);
  }
  async function fetchSlots(date, setter) {
    const list = await menteeApi(`/mentee/slots?date=${date}`);
    setter(list);
  }

  useEffect(() => {
    if (!mentor) return;
    loadSessions();
    fetchSlots(newDate, setNewSlots);
  }, [mentor]);

  useEffect(() => {
    if (!mentor) return;
    fetchSlots(newDate, setNewSlots);
    setNewSelected(null);
  }, [newDate]);

  useEffect(() => {
    if (reschedSessionId) {
      fetchSlots(reschedDate, setReschedSlots);
      setReschedSelected(null);
    }
  }, [reschedDate, reschedSessionId]);

  if (!mentor) {
    return (
      <div>
        <div className="page-title">Book a Session</div>
        <Notice tone="amber">You don't have a mentor assigned yet. Go to Find Mentor to request one — once they accept, you can book sessions here.</Notice>
      </div>
    );
  }

  async function submitNewSession() {
    let payload = { duration, mode, agenda, afterClass: newAfterClass };
    if (newAfterClass) {
      if (!newAcDate || !newAcTime) return setNewBanner({ tone: 'red', text: 'Pick a date and time for the after-class session.' });
      payload = { ...payload, date: newAcDate, label: formatDateLabel(newAcDate), time: newAcTime, timeLabel: `After class · ${newAcTime}` };
    } else {
      if (!newSelected) return setNewBanner({ tone: 'red', text: 'Pick a free slot before sending the request.' });
      payload = { ...payload, date: newDate, label: formatDateLabel(newDate), time: newSelected.time, timeLabel: newSelected.label };
    }
    try {
      const res = await menteeApi('/mentee/sessions', { method: 'POST', body: JSON.stringify(payload) });
      setNewBanner({ tone: 'green', text: `Session request sent to ${mentor.name} for ${res.session.label} · ${res.session.timeLabel}.` });
      setAgenda('');
      setNewSelected(null);
      loadSessions();
    } catch (e) {
      setNewBanner({ tone: 'red', text: e.message });
    }
  }

  function startReschedule(s) {
    setReschedSessionId(s.id);
    setReschedDate(defaultDate());
    setReschedAcDate(defaultDate());
    setReschedAfterClass(false);
    setReschedSelected(null);
    setReason('');
  }

  async function submitReschedule() {
    let payload = { reason, afterClass: reschedAfterClass };
    if (reschedAfterClass) {
      if (!reschedAcDate || !reschedAcTime) return alert('Pick a date and time for the after-class session.');
      payload = { ...payload, date: reschedAcDate, label: formatDateLabel(reschedAcDate), time: reschedAcTime, timeLabel: `After class · ${reschedAcTime}` };
    } else {
      if (!reschedSelected) return alert('Pick a free slot before confirming.');
      payload = { ...payload, date: reschedDate, label: formatDateLabel(reschedDate), time: reschedSelected.time, timeLabel: reschedSelected.label };
    }
    try {
      await menteeApi(`/mentee/sessions/${reschedSessionId}/reschedule`, { method: 'PUT', body: JSON.stringify(payload) });
      setReschedSessionId(null);
      loadSessions();
      alert('Session rescheduled — your mentor will see the updated time.');
    } catch (e) {
      alert(e.message);
    }
  }

  const upcoming = sessions.filter((s) => s.status === 'pending' || s.status === 'confirmed');
  const reschedulingSession = sessions.find((s) => s.id === reschedSessionId);

  return (
    <div>
      <div className="page-title">Book a Session</div>
      <div className="page-sub">
        With <b style={{ color: 'var(--text)' }}>{mentor.name}</b> · Green slots = both of you are free
      </div>

      <Card title="Book a New Session">
        {newBanner && <Notice tone={newBanner.tone}>{newBanner.text}</Notice>}
        <div className="row" style={{ marginBottom: 14 }}>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            <input type="checkbox" checked={newAfterClass} onChange={(e) => setNewAfterClass(e.target.checked)} />
            Request a session after class instead
          </label>
        </div>
        {!newAfterClass ? (
          <>
            <DateField value={newDate} onChange={setNewDate} />
            <div className="card-title" style={{ marginBottom: 10, fontSize: 13 }}>{formatDateLabel(newDate)} — Free Slots</div>
            <SlotGrid slots={newSlots} selected={newSelected} onPick={setNewSelected} />
          </>
        ) : (
          <div className="grid2">
            <DateField value={newAcDate} onChange={setNewAcDate} />
            <div className="field"><label className="label">Time after class</label><input className="input" type="time" value={newAcTime} onChange={(e) => setNewAcTime(e.target.value)} /></div>
          </div>
        )}
        <div className="field">
          <label className="label">Selected time</label>
          <input className="input" readOnly value={newAfterClass ? '' : newSelected ? newSelected.label : 'Click a green slot above'} style={{ color: newSelected ? undefined : 'var(--muted)' }} />
        </div>
        <div className="grid2">
          <div className="field">
            <label className="label">Duration</label>
            <select className="input" value={duration} onChange={(e) => setDuration(e.target.value)}>
              <option>30 minutes</option><option>45 minutes</option><option>60 minutes</option>
            </select>
          </div>
          <div className="field">
            <label className="label">Mode</label>
            <select className="input" value={mode} onChange={(e) => setMode(e.target.value)}>
              <option>In-person</option><option>Online — Jitsi Meet</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label className="label">Agenda</label>
          <textarea className="input" rows={3} placeholder="What do you want to discuss?" value={agenda} onChange={(e) => setAgenda(e.target.value)} />
        </div>
        <button className="btn btn-accent" onClick={submitNewSession}>Send session request</button>
      </Card>

      <Card title="Reschedule an Existing Session">
        {upcoming.length ? (
          upcoming.map((s) => (
            <div className="row" key={s.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{s.title}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{s.label} · {s.timeLabel} · {s.mode}</div>
              </div>
              <button className="btn btn-xs" style={{ background: 'var(--amber)', borderColor: 'var(--amber)', color: '#1a1200' }} onClick={() => startReschedule(s)}>Reschedule this</button>
            </div>
          ))
        ) : (
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>No upcoming sessions to reschedule.</div>
        )}
      </Card>

      {reschedulingSession && (
        <Card title={`Rescheduling: ${reschedulingSession.title} · ${reschedulingSession.label} · ${reschedulingSession.timeLabel}`}>
          <Notice tone="amber">Pick a new date and time below for "{reschedulingSession.title} · {reschedulingSession.label} · {reschedulingSession.timeLabel}".</Notice>
          <div className="row" style={{ marginBottom: 14 }}>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
              <input type="checkbox" checked={reschedAfterClass} onChange={(e) => setReschedAfterClass(e.target.checked)} />
              Request a session after class instead
            </label>
          </div>
          {!reschedAfterClass ? (
            <>
              <DateField value={reschedDate} onChange={setReschedDate} />
              <SlotGrid slots={reschedSlots} selected={reschedSelected} onPick={setReschedSelected} />
            </>
          ) : (
            <div className="grid2">
              <DateField value={reschedAcDate} onChange={setReschedAcDate} />
              <div className="field"><label className="label">Time after class</label><input className="input" type="time" value={reschedAcTime} onChange={(e) => setReschedAcTime(e.target.value)} /></div>
            </div>
          )}
          <div className="field">
            <label className="label">Selected time</label>
            <input className="input" readOnly value={reschedAfterClass ? '' : reschedSelected ? reschedSelected.label : 'Click a green slot above'} style={{ color: reschedSelected ? undefined : 'var(--muted)' }} />
          </div>
          <div className="field">
            <label className="label">Reason for reschedule (optional)</label>
            <textarea className="input" rows={2} placeholder="Let your mentor know why..." value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn" style={{ background: 'var(--amber)', borderColor: 'var(--amber)', color: '#1a1200' }} onClick={submitReschedule}>Confirm reschedule</button>
            <button className="btn" onClick={() => setReschedSessionId(null)}>Cancel</button>
          </div>
        </Card>
      )}
    </div>
  );
}
