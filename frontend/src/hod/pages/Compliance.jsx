import { useEffect, useState } from 'react';
import { hodApi } from '../HodRoot.jsx';
import { Card, Badge } from '../../components/ui.jsx';

export default function Compliance() {
  const [res, setRes] = useState(null);

  useEffect(() => {
    hodApi('/hod/compliance').then(setRes);
  }, []);

  if (!res) return null;

  return (
    <div>
      <div className="page-title">Session Compliance</div>
      <div className="stats stats-3">
        <div className="stat"><div className="stat-label">Monthly minimum</div><div className="stat-value">1</div></div>
        <div className="stat"><div className="stat-label">Recommended</div><div className="stat-value">Weekly</div></div>
        <div className="stat"><div className="stat-label">Compliant pairs</div><div className="stat-value">{res.compliantPct}%</div></div>
      </div>
      <Card>
        <table>
          <thead><tr><th>Mentor</th><th>Mentee</th><th>Sessions this month</th><th>Status</th></tr></thead>
          <tbody>
            {res.rows.length === 0 && <tr><td colSpan={4} style={{ color: 'var(--muted)' }}>No assigned pairs yet.</td></tr>}
            {res.rows.map((r, i) => (
              <tr key={i}>
                <td>{r.mentorName}</td><td>{r.menteeName}</td><td>{r.sessionsThisMonth}</td>
                <td>{r.met ? <Badge tone="green">Met</Badge> : <Badge tone="red">Action required</Badge>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
