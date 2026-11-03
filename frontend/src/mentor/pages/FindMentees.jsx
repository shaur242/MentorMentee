import { useEffect, useState } from 'react';
import { mentorApi } from '../MentorRoot.jsx';
import { Avatar, Badge, Notice } from '../../components/ui.jsx';

export default function FindMentees() {
  const [list, setList] = useState(null);

  async function load() {
    const res = await mentorApi('/mentor/find-mentees');
    setList(res);
  }
  useEffect(() => { load(); }, []);

  async function send(menteeId) {
    try {
      const res = await mentorApi('/mentor/mentee-requests', { method: 'POST', body: JSON.stringify({ menteeId }) });
      alert(res.message);
      load();
    } catch (e) {
      alert(e.message);
    }
  }

  if (!list) return null;

  return (
    <div>
      <div className="page-title">Find Mentees</div>
      <div className="page-sub">Unassigned students you could take on as mentees</div>
      {list.length === 0 && <Notice tone="green">Every student in the department currently has a mentor.</Notice>}
      {list.map((m) => (
        <div className="card" key={m.id}>
          <div className="row">
            <div className="row-start">
              <Avatar name={m.name} />
              <div>
                <b style={{ fontSize: 13 }}>{m.name}</b>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{m.programme} · Sem {m.semester} · No mentor yet</div>
              </div>
            </div>
            {m.requested ? (
              <Badge tone="amber">Requested — awaiting response</Badge>
            ) : (
              <button className="btn btn-accent btn-xs" onClick={() => send(m.id)}>Send request</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
