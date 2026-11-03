import { useEffect, useState } from 'react';
import { coordinatorApi } from '../CoordinatorRoot.jsx';
import { Avatar, Badge } from '../../components/ui.jsx';

export default function MyMentors() {
  const [mentors, setMentors] = useState(null);

  useEffect(() => {
    coordinatorApi('/coordinator/mentors').then(setMentors);
  }, []);

  if (!mentors) return null;

  return (
    <div>
      <div className="page-title">My Mentors</div>
      <div className="page-sub">Faculty in your department</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {mentors.map((m) => (
          <div className="card" key={m.id}>
            <div className="row" style={{ marginBottom: 10 }}>
              <div className="row-start">
                <Avatar name={m.name} size="lg" />
                <div>
                  <div style={{ fontWeight: 600 }}>{m.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{m.designation} · {m.department}</div>
                </div>
              </div>
              {m.overview.compliant ? <Badge tone="green">Compliant</Badge> : <Badge tone="red">Action needed</Badge>}
            </div>
            <div className="tags" style={{ marginBottom: 10 }}>
              {m.tags.map((t) => (
                <span className="tag" key={t}>{t}</span>
              ))}
            </div>
            <div className="grid2">
              <div><div style={{ fontSize: 11, color: 'var(--muted)' }}>Active mentees</div><div style={{ fontWeight: 600 }}>{m.overview.menteeCount} / {m.overview.capacity}</div></div>
              <div><div style={{ fontSize: 11, color: 'var(--muted)' }}>Sessions this month</div><div style={{ fontWeight: 600 }}>{m.overview.sessionsThisMonth}</div></div>
              <div><div style={{ fontSize: 11, color: 'var(--muted)' }}>Avg feedback</div><div style={{ fontWeight: 600 }}>{m.overview.avgFeedback ? `★ ${m.overview.avgFeedback}` : '—'}</div></div>
              <div><div style={{ fontSize: 11, color: 'var(--muted)' }}>Experience</div><div style={{ fontWeight: 600 }}>{m.experienceYears} yrs · {m.papers} papers</div></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
