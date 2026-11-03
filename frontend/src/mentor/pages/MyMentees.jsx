import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mentorApi } from '../MentorRoot.jsx';
import { Avatar, Badge, ProgressBar } from '../../components/ui.jsx';

export default function MyMentees() {
  const [mentees, setMentees] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    mentorApi('/mentor/mentees').then(setMentees);
  }, []);

  if (!mentees) return null;

  return (
    <div>
      <div className="page-title">My Mentees</div>
      <div className="page-sub">Everyone currently assigned to you</div>
      {mentees.length === 0 && <div className="notice notice-blue">You have no mentees yet — visit Find Mentees to take on new ones.</div>}
      {mentees.map((m) => (
        <div className="card" key={m.id}>
          <div className="row" style={{ marginBottom: 10 }}>
            <div className="row-start">
              <Avatar name={m.name} size="lg" />
              <div>
                <div style={{ fontWeight: 600 }}>{m.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{m.programme} · Sem {m.semester} · Sec {m.section} · Reg {m.registerNo}</div>
              </div>
            </div>
            {m.status === 'At risk' ? <Badge tone="red">At risk</Badge> : <Badge tone="green">Good standing</Badge>}
          </div>
          <div className="grid2" style={{ marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>Attendance</div>
              <div style={{ fontWeight: 600 }}>{m.attendance}%</div>
              <ProgressBar pct={m.attendance} color={m.attendance < 75 ? 'var(--red)' : 'var(--green)'} />
            </div>
            <div><div style={{ fontSize: 11, color: 'var(--muted)' }}>CGPA</div><div style={{ fontWeight: 600 }}>{m.cgpa} / 10</div></div>
            <div><div style={{ fontSize: 11, color: 'var(--muted)' }}>Backlogs</div><div style={{ fontWeight: 600 }}>{m.backlogs}</div></div>
            <div><div style={{ fontSize: 11, color: 'var(--muted)' }}>Sessions completed</div><div style={{ fontWeight: 600 }}>{m.sessionCount}</div></div>
          </div>
          <button className="btn btn-accent btn-xs" onClick={() => navigate(`/mentor/remarks?mentee=${m.id}`)}>Remarks</button>
        </div>
      ))}
    </div>
  );
}
