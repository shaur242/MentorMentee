import { useEffect, useState } from 'react';
import { hodApi } from '../HodRoot.jsx';

export default function Peer() {
  const [res, setRes] = useState(null);

  useEffect(() => {
    hodApi('/hod/peer-mentoring').then(setRes);
  }, []);

  if (!res) return null;

  return (
    <div>
      <div className="page-title">Peer Mentoring</div>
      <div className="stats stats-3">
        <div className="stat"><div className="stat-label">Trained peer mentors</div><div className="stat-value">{res.trainedPeerMentors}</div></div>
        <div className="stat"><div className="stat-label">Peer mentor groups</div><div className="stat-value">{res.peerGroups}</div></div>
        <div className="stat"><div className="stat-label">Training status</div><div className="stat-value">{res.trainingCompletePct}%</div></div>
      </div>
      <div className="card">
        <div className="card-title">Programme Principle</div>
        <div style={{ fontSize: 13, color: '#c3cbdb', lineHeight: 1.7 }}>{res.principle}</div>
      </div>
    </div>
  );
}
