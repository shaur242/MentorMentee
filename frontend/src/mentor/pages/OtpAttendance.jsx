import { useEffect, useState } from 'react';
import { mentorApi } from '../MentorRoot.jsx';
import { Card, Notice } from '../../components/ui.jsx';

export default function OtpAttendance() {
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    mentorApi('/mentor/sessions').then((list) => {
      const eligible = list.filter((s) => s.status !== 'declined' && s.status !== 'cancelled');
      setSessions(eligible);
      if (eligible.length) setSessionId(eligible[0].id);
    });
  }, []);

  async function generate() {
    if (!sessionId) return;
    try {
      const res = await mentorApi('/mentor/otp/generate', { method: 'POST', body: JSON.stringify({ sessionId }) });
      const mins = Math.round((res.expiresAt - Date.now()) / 60000);
      setResult({ code: res.code, mins });
    } catch (e) {
      setResult({ error: e.message });
    }
  }

  return (
    <div>
      <div className="page-title">OTP Attendance</div>
      <div className="page-sub">Generate a one-time code and read it aloud to confirm in-person attendance</div>
      <Card>
        <div className="field">
          <label className="label">Which session?</label>
          <select className="input" value={sessionId} onChange={(e) => setSessionId(e.target.value)}>
            {sessions.length === 0 && <option value="">No sessions available</option>}
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>{s.title} · {s.menteeName} · {s.label}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-accent" onClick={generate}>Request OTP</button>
        {result && (
          <div style={{ marginTop: 16 }}>
            {result.error ? (
              <Notice tone="red">{result.error}</Notice>
            ) : (
              <Notice tone="blue">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>Read this code aloud to your mentee:</div>
                  <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: 6, color: 'var(--text)' }}>{result.code}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>Expires in ~{result.mins} minutes</div>
                </div>
              </Notice>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
