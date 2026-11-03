import { useEffect, useState } from 'react';
import { hodApi } from '../HodRoot.jsx';
import { Notice } from '../../components/ui.jsx';

export default function Dashboard() {
  const [dash, setDash] = useState(null);

  useEffect(() => {
    hodApi('/hod/dashboard').then(setDash);
  }, []);

  if (!dash) return null;

  return (
    <div>
      <div className="page-title">Dashboard</div>
      <div className="page-sub">{dash.hod.department} · Department overview</div>
      <div className="stats stats-3">
        <div className="stat"><div className="stat-label">Department mentees</div><div className="stat-value">{dash.stats.departmentMentees}</div></div>
        <div className="stat"><div className="stat-label">Mentors</div><div className="stat-value">{dash.stats.mentors}</div></div>
        <div className="stat"><div className="stat-label">Allocated students</div><div className="stat-value">{dash.stats.allocatedStudents}</div></div>
      </div>
      {dash.stats.awaitingApproval > 0 && (
        <Notice tone="amber">{dash.stats.awaitingApproval} item(s) awaiting your attention — open critical issues or pending connect requests.</Notice>
      )}
      <div className="grid2">
        <div className="card">
          <div className="card-title">Mentoring Session Policy</div>
          <div style={{ fontSize: 13, color: '#c3cbdb', lineHeight: 1.8 }}>
            <div>Minimum: <b>1 session / month</b></div>
            <div>Recommended: <b>Weekly</b></div>
            <div>Group size: <b>6–7 mentees</b></div>
          </div>
        </div>
        <div className="card">
          <div className="card-title">Record &amp; Confidentiality Status</div>
          <div style={{ fontSize: 13, color: '#c3cbdb', lineHeight: 1.8 }}>
            <div>Diaries: <span className="badge b-green">Up to date</span></div>
            <div>Repository: <span className="badge b-green">Institutional platform</span></div>
            <div>Confidentiality: <span className="badge b-amber">Need-to-know only</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
