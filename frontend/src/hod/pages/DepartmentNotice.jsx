import { useState } from 'react';
import { hodApi } from '../HodRoot.jsx';
import { Card, Notice } from '../../components/ui.jsx';

const DEFAULT_MESSAGE =
  'All mentors shall schedule mentoring sessions for the entire semester during regular instruction days. Sessions may be one-on-one or in groups, according to departmental policy. The minimum periodicity is one session per month; weekly mentoring is recommended.';

export default function DepartmentNotice() {
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [result, setResult] = useState(null);

  async function publish() {
    try {
      const res = await hodApi('/hod/department-notice', { method: 'POST', body: JSON.stringify({ message }) });
      setResult({ tone: 'green', text: res.message });
    } catch (e) {
      setResult({ tone: 'red', text: e.message });
    }
  }

  return (
    <div>
      <div className="page-title">Department Notice</div>
      <div className="page-sub">Broadcast a notice to every mentor, mentee and coordinator in the department.</div>
      <Card>
        <div className="field">
          <label className="label">Departmental notice</label>
          <textarea className="input" rows={6} value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>
        <button className="btn btn-accent" onClick={publish}>Publish notice</button>
        {result && <div style={{ marginTop: 10 }}><Notice tone={result.tone}>{result.text}</Notice></div>}
      </Card>
    </div>
  );
}
