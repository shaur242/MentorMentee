import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { menteeApi } from '../MenteeRoot.jsx';
import { Card, Avatar, Badge, ProgressBar } from '../../components/ui.jsx';

export default function Dashboard({ ctx }) {
  const { mentee, mentor } = ctx;
  const [dash, setDash] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    menteeApi('/mentee/dashboard').then(setDash);
  }, []);

  if (!dash) return null;

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      <div className="page-title">{greet}, {mentee.name.split(' ')[0]} </div>
      <div className="page-sub">
        {mentee.programme} · Semester {mentee.semester} · Section {mentee.section}
      </div>

      <div className="stats stats-3">
        <div className="stat">
          <div className="stat-label">Sessions this month</div>
          <div className="stat-value">{dash.stats.sessionsThisMonth}</div>
          <div className="stat-note" style={{ color: 'var(--green)' }}>Monthly requirement met</div>
        </div>
        <div className="stat">
          <div className="stat-label">Total sessions</div>
          <div className="stat-value">{dash.stats.totalSessions}</div>
          <div className="stat-note" style={{ color: 'var(--muted)' }}>All time</div>
        </div>
        <div className="stat">
          <div className="stat-label">Attendance</div>
          <div className="stat-value">{dash.stats.attendance}%</div>
          <ProgressBar pct={dash.stats.attendance} color="var(--green)" />
        </div>
      </div>

      <div className="grid2">
        <div>
          <Card title="My Mentor">
            {mentor ? (
              <>
                <div className="row-start" style={{ marginBottom: 14 }}>
                  <Avatar name={mentor.name} size="lg" />
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{mentor.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{mentor.designation} · {mentor.department}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-accent" onClick={() => navigate('/mentee/book')}>Book session</button>
                  <button className="btn" onClick={() => navigate('/mentee/otp')}>Enter OTP</button>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>No mentor assigned yet</div>
                <button className="btn btn-accent" onClick={() => navigate('/mentee/find-mentor')}>Find a mentor</button>
              </>
            )}
          </Card>

          <Card title="Upcoming Sessions">
            {dash.upcoming.length ? (
              dash.upcoming.map((s) => (
                <div className="row" key={s.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{s.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{s.label} · {s.timeLabel} · {s.mode}</div>
                  </div>
                  <Badge tone={s.status === 'confirmed' ? 'blue' : 'amber'}>{s.status === 'confirmed' ? 'Confirmed' : 'Pending'}</Badge>
                </div>
              ))
            ) : (
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>No upcoming sessions. Book one from the Book Session page.</div>
            )}
          </Card>
        </div>

        <Card title="My Sessions — Done vs Pending">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            <div className="row"><span style={{ fontSize: 13, color: 'var(--green)' }}>● Completed</span><b>{dash.donut.completed}</b></div>
            <div className="row"><span style={{ fontSize: 13, color: 'var(--amber)' }}>● Pending</span><b>{dash.donut.pending}</b></div>
          </div>
          <hr className="div" />
          <div className="card-title" style={{ marginBottom: 10 }}>My Academic Status</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div className="row" style={{ marginBottom: 3 }}>
                <span style={{ fontSize: 13 }}>Attendance</span>
                <span style={{ fontWeight: 600, color: 'var(--green)' }}>{mentee.attendance}%</span>
              </div>
              <ProgressBar pct={mentee.attendance} color="var(--green)" />
            </div>
            <div>
              <div className="row" style={{ marginBottom: 3 }}>
                <span style={{ fontSize: 13 }}>CGPA</span>
                <span style={{ fontWeight: 600 }}>{mentee.cgpa} / 10</span>
              </div>
              <ProgressBar pct={mentee.cgpa * 10} color="var(--blue)" />
            </div>
            <div className="row">
              <span style={{ fontSize: 13 }}>Active backlogs</span>
              <Badge tone={mentee.backlogs > 0 ? 'red' : 'green'}>{mentee.backlogs > 0 ? mentee.backlogs : 'None'}</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
