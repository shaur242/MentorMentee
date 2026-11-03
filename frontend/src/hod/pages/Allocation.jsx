import { useEffect, useState } from 'react';
import { hodApi } from '../HodRoot.jsx';
import { Avatar, Badge } from '../../components/ui.jsx';

export default function Allocation() {
  const [data, setData] = useState(null);

  async function load() {
    const res = await hodApi('/hod/allocation');
    setData(res);
  }
  useEffect(() => { load(); }, []);

  async function pairingAction(menteeId, action) {
    try {
      const res = await hodApi(`/hod/pairings/${menteeId}/${action}`, { method: 'POST' });
      alert(res.message);
      load();
    } catch (e) {
      alert(e.message);
    }
  }

  if (!data) return null;

  return (
    <div>
      <div className="page-title">Mentee Allocation</div>
      <div className="page-sub">Click a mentor to see who they mentor. Unpair a mentee to send them back to the unassigned pool.</div>
      {data.overview.map((m) => (
        <div className="card" key={m.id}>
          <div className="row" style={{ marginBottom: 10 }}>
            <div className="row-start"><Avatar name={m.name} /><b>{m.name}</b></div>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{m.assigned} / {m.capacity} assigned · {m.openSlots} open</span>
          </div>
          {m.mentees.length ? (
            m.mentees.map((mn) => (
              <div className="row" key={mn.id} style={{ padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 13 }}>{mn.name} {mn.status === 'At risk' && <Badge tone="red">At risk</Badge>}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-xs btn-accent" onClick={() => pairingAction(mn.id, 'accept')}>Accept</button>
                  <button className="btn btn-xs btn-red" onClick={() => pairingAction(mn.id, 'decline')}>Decline / Unpair</button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>No mentees assigned yet.</div>
          )}
        </div>
      ))}
      {data.unassigned.length > 0 && (
        <div className="card">
          <div className="card-title">Currently Unassigned</div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>{data.unassigned.map((m) => m.name).join(', ')}</div>
        </div>
      )}
    </div>
  );
}
