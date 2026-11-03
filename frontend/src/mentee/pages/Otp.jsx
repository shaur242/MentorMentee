import { useEffect, useState } from 'react';
import { menteeApi } from '../MenteeRoot.jsx';
import { Card, Notice, OtpBoxes } from '../../components/ui.jsx';

export default function Otp() {
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState('');
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    menteeApi('/mentee/sessions').then((list) => {
      const eligible = list.filter((s) => s.status === 'pending' || s.status === 'confirmed');
      setSessions(eligible);
      if (eligible.length) setSessionId(eligible[0].id);
    });
  }, []);

  async function verify() {
    if (code.length < 6) return setResult({ tone: 'red', text: 'Enter all 6 digits of the OTP.' });
    try {
      const res = await menteeApi('/mentee/otp/verify', { method: 'POST', body: JSON.stringify({ sessionId, code }) });
      setResult({ tone: 'green', text: res.message });
    } catch (e) {
      setResult({ tone: 'red', text: e.body?.message || e.message });
    }
  }

  return (
    <div>
      <div className="page-title">OTP</div>
      <div className="page-sub">Enter the one-time code your mentor shares with you at the start of a session</div>
      <Card>
        <div className="field">
          <label className="label">Which session is this for?</label>
          <select className="input" value={sessionId} onChange={(e) => setSessionId(e.target.value)}>
            {sessions.length === 0 && <option value="">No sessions available</option>}
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>{s.title} · {s.label}</option>
            ))}
          </select>
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>
          Your mentor generates a 6-digit OTP on their end and reads it out to you in person — enter it below to confirm attendance.
        </div>
        <OtpBoxes value={code} onChange={setCode} />
        <button className="btn" style={{ background: 'var(--amber)', borderColor: 'var(--amber)', color: '#1a1200' }} onClick={verify}>Verify OTP</button>
        {result && <div style={{ marginTop: 14 }}><Notice tone={result.tone}>{result.text}</Notice></div>}
        <div style={{ marginTop: 16 }}>
          <Notice tone="blue">
            Demo backend note: a sample code has been pre-seeded on the backend for the "Orientation & goal setting" session so you can test this flow end to end.
          </Notice>
        </div>
      </Card>
    </div>
  );
}
