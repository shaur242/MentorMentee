import { useEffect, useState } from 'react';
import { coordinatorApi } from '../CoordinatorRoot.jsx';
import { Card, ProgressBar, Badge } from '../../components/ui.jsx';

export default function Reports() {
  const [res, setRes] = useState(null);

  useEffect(() => {
    coordinatorApi('/coordinator/reports').then(setRes);
  }, []);

  if (!res) return null;

  return (
    <div>
      <div className="page-title">Reports</div>
      <Card title="Sessions Done vs Pending">
        <div className="row"><span style={{ color: 'var(--green)' }}>● Completed</span><b>{res.donut.completed}</b></div>
        <div className="row"><span style={{ color: 'var(--amber)' }}>● Pending</span><b>{res.donut.pending}</b></div>
      </Card>
      <Card title="Sessions per Mentor">
        {res.overview.map((m) => (
          <div key={m.id} style={{ marginBottom: 10 }}>
            <div className="row" style={{ marginBottom: 3 }}><span style={{ fontSize: 13 }}>{m.name}</span><b>{m.sessionsThisMonth}</b></div>
            <ProgressBar pct={Math.min(m.sessionsThisMonth * 20, 100)} color="var(--blue)" />
          </div>
        ))}
      </Card>
      <Card title="Compliance Matrix">
        <table>
          <thead><tr><th>Mentor</th><th>Mentee</th><th>Sessions this month</th><th>Status</th></tr></thead>
          <tbody>
            {res.compliance.length === 0 && <tr><td colSpan={4} style={{ color: 'var(--muted)' }}>No assigned pairs yet.</td></tr>}
            {res.compliance.map((c, i) => (
              <tr key={i}>
                <td>{c.mentorName}</td><td>{c.menteeName}</td><td>{c.sessionsThisMonth}</td>
                <td>{c.met ? <Badge tone="green">Met</Badge> : <Badge tone="red">Unmet</Badge>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
