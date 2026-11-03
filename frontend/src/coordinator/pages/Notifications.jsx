import { useEffect, useState } from 'react';
import { coordinatorApi } from '../CoordinatorRoot.jsx';
import { Notice } from '../../components/ui.jsx';

const BADGE_TONE = { unmet: 'red', 'at-risk': 'amber', feedback: 'blue' };
const LABEL = { unmet: 'Unmet', 'at-risk': 'At risk', feedback: 'Feedback' };

export default function Notifications() {
  const [items, setItems] = useState(null);

  useEffect(() => {
    coordinatorApi('/coordinator/notifications').then(setItems);
  }, []);

  return (
    <div>
      <div className="page-title">Notifications</div>
      <div className="page-sub">Alerts about unmet pairs, at-risk mentees, and recent activity</div>
      {items && items.length === 0 && <Notice tone="green">No alerts right now.</Notice>}
      {items &&
        items.map((n, i) => (
          <div className="card" key={i}>
            <div className="row" style={{ marginBottom: 4 }}>
              <b style={{ fontSize: 13 }}>{n.title}</b>
              <span className={`badge b-${BADGE_TONE[n.type] === 'red' ? 'red' : BADGE_TONE[n.type] === 'amber' ? 'amber' : 'blue'}`}>{LABEL[n.type] || n.type}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{n.detail} · {n.date}</div>
          </div>
        ))}
    </div>
  );
}
