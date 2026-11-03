import { useEffect, useState } from 'react';
import { mentorApi } from '../MentorRoot.jsx';
import { Card, Notice } from '../../components/ui.jsx';

export default function HodNotices() {
  const [notices, setNotices] = useState(null);

  useEffect(() => {
    mentorApi('/mentor/hod-notices').then(setNotices);
  }, []);

  return (
    <div>
      <div className="page-title">HOD Notices</div>
      <div className="page-sub">Notices sent by the Head of Department addressed to mentors.</div>
      {notices && notices.length === 0 && <Notice tone="blue">No notices from the HOD right now.</Notice>}
      {notices &&
        notices.map((n) => (
          <Card key={n.id}>
            <div className="row" style={{ marginBottom: 6 }}>
              <b>{n.title}</b>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>{n.date}</span>
            </div>
            <div style={{ fontSize: 13, color: '#c3cbdb', lineHeight: 1.6, marginBottom: 8 }}>{n.message}</div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>— {n.from}</div>
          </Card>
        ))}
    </div>
  );
}
