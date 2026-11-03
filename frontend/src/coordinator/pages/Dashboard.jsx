import { useEffect, useState } from 'react';
import { coordinatorApi } from '../CoordinatorRoot.jsx';
import { Card, Badge, Notice } from '../../components/ui.jsx';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [dash, setDash] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    coordinatorApi('/coordinator/dashboard').then(setDash);
  }, []);

  if (!dash) return null;

  return (
    <div>
      <div className="page-title">Dashboard</div>
      <div className="page-sub">{dash.coordinator.department} · Coordinator overview</div>
      <div className="stats stats-3">
        <div className="stat"><div className="stat-label">Mentors under me</div><div className="stat-value">{dash.stats.mentorsCount}</div></div>
        <div className="stat"><div className="stat-label">Total mentees</div><div className="stat-value">{dash.stats.totalMentees}</div></div>
        <div className="stat"><div className="stat-label">Sessions this month</div><div className="stat-value">{dash.stats.sessionsThisMonth}</div></div>
      </div>
      {dash.stats.unmetPairs > 0 && (
        <Notice tone="amber">
          {dash.stats.unmetPairs} mentor-mentee pair(s) have had zero sessions this month.{' '}
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/coordinator/notifications'); }} style={{ color: 'inherit', textDecoration: 'underline' }}>
            View in Notifications
          </a>
        </Notice>
      )}
      <Card title="Mentor Overview">
        <table>
          <thead>
            <tr><th>Mentor</th><th>Mentees</th><th>Sessions this month</th><th>Avg feedback</th><th>Compliance</th></tr>
          </thead>
          <tbody>
            {dash.mentorOverview.map((m) => (
              <tr key={m.id}>
                <td>{m.name}</td>
                <td>{m.menteeCount} / {m.capacity}</td>
                <td>{m.sessionsThisMonth}</td>
                <td>{m.avgFeedback ? `★ ${m.avgFeedback}` : '—'}</td>
                <td>{m.compliant ? <Badge tone="green">Compliant</Badge> : <Badge tone="red">Action needed</Badge>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
