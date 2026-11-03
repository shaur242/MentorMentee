import { useEffect, useState } from 'react';
import { coordinatorApi } from '../CoordinatorRoot.jsx';
import { Card, Avatar, Notice, Badge } from '../../components/ui.jsx';

export default function AssignMentees() {
  const [mode, setMode] = useState('manual');
  const [mentors, setMentors] = useState([]);

  useEffect(() => {
    coordinatorApi('/coordinator/mentors').then(setMentors);
  }, []);

  return (
    <div>
      <div className="page-title">Assign Mentees to Mentors</div>
      <div className="row" style={{ marginBottom: 16, gap: 8, justifyContent: 'flex-start' }}>
        {['manual', 'dynamic', 'connect'].map((m) => (
          <button key={m} className={`btn btn-xs ${mode === m ? 'btn-accent' : ''}`} onClick={() => setMode(m)}>
            {m === 'manual' ? 'Manual assign' : m === 'dynamic' ? 'Dynamic change' : 'Mentor ⇄ Mentee connect'}
          </button>
        ))}
      </div>
      {mode === 'manual' && <ManualAssign mentors={mentors} />}
      {mode === 'dynamic' && <DynamicChange mentors={mentors} reloadMentors={() => coordinatorApi('/coordinator/mentors').then(setMentors)} />}
      {mode === 'connect' && <ConnectMode />}
    </div>
  );
}

function ManualAssign({ mentors }) {
  const [unassigned, setUnassigned] = useState([]);
  const [search, setSearch] = useState('');
  const [picking, setPicking] = useState(null); // mentee object
  const [result, setResult] = useState(null);

  async function loadUnassigned() {
    const list = await coordinatorApi('/coordinator/mentees/unassigned');
    setUnassigned(list);
  }
  useEffect(() => { loadUnassigned(); }, []);

  const q = search.toLowerCase();
  const filtered = unassigned.filter((m) => !q || m.name.toLowerCase().includes(q) || m.programme.toLowerCase().includes(q));

  async function confirmAssign(mentorId) {
    try {
      const res = await coordinatorApi('/coordinator/assign', { method: 'POST', body: JSON.stringify({ menteeId: picking.id, mentorId }) });
      setResult({ tone: 'green', text: res.message });
      setPicking(null);
      loadUnassigned();
    } catch (e) {
      setResult({ tone: 'red', text: e.message });
    }
  }

  return (
    <div>
      <Card>
        <div className="field">
          <input className="input" placeholder="Search by name or programme..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <table>
          <thead><tr><th>Mentee</th><th>Programme</th><th>Sem</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={5} style={{ color: 'var(--muted)' }}>No unassigned mentees.</td></tr>}
            {filtered.map((m) => (
              <tr key={m.id}>
                <td>{m.name}</td><td>{m.programme}</td><td>{m.semester}</td>
                <td><Badge tone="amber">No mentor</Badge></td>
                <td><button className="btn btn-xs btn-accent" onClick={() => { setPicking(m); setResult(null); }}>Assign</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {picking && (
        <Card title={<>Select a mentor for {picking.name}</>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {mentors.map((m) => (
              <div className="row" key={m.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <div className="row-start"><Avatar name={m.name} /><span style={{ fontSize: 13 }}>{m.name}</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{m.overview.capacity - m.overview.menteeCount} open slots</span>
                  <button className="btn btn-accent btn-xs" onClick={() => confirmAssign(m.id)}>Assign</button>
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn-xs" style={{ marginTop: 10 }} onClick={() => setPicking(null)}>Back to search</button>
        </Card>
      )}
      {result && <Notice tone={result.tone}>{result.text}</Notice>}
    </div>
  );
}

function DynamicChange({ mentors, reloadMentors }) {
  const [classes, setClasses] = useState([]);
  const [className, setClassName] = useState('');
  const [selectedMentors, setSelectedMentors] = useState([]);
  const [result, setResult] = useState(null);

  async function loadClasses() {
    const list = await coordinatorApi('/coordinator/classes');
    setClasses(list);
    if (list.length) setClassName(list[0].className);
  }
  useEffect(() => { loadClasses(); }, []);

  function toggleMentor(id) {
    setSelectedMentors((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function split() {
    const cls = classes.find((c) => c.className === className);
    if (!cls || !selectedMentors.length) return setResult([{ tone: 'red', text: 'Pick a class and at least one mentor.' }]);
    try {
      const res = await coordinatorApi('/coordinator/dynamic-split', {
        method: 'POST',
        body: JSON.stringify({ menteeIds: cls.menteeIds, mentorIds: selectedMentors })
      });
      setResult(res.summary.map((s) => ({ tone: 'green', text: `${s.mentorName}: ${s.menteeNames.join(', ') || 'none'}` })));
      loadClasses();
      reloadMentors();
    } catch (e) {
      setResult([{ tone: 'red', text: e.message }]);
    }
  }

  return (
    <Card>
      <div className="field">
        <label className="label">Select a class</label>
        <select className="input" value={className} onChange={(e) => setClassName(e.target.value)}>
          {classes.map((c) => (
            <option key={c.className} value={c.className}>{c.className} · {c.count} students</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label className="label">Mentors to split across</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {mentors.map((m) => (
            <label key={m.id} style={{ fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="checkbox" checked={selectedMentors.includes(m.id)} onChange={() => toggleMentor(m.id)} />
              {m.name} ({m.overview.capacity - m.overview.menteeCount} open)
            </label>
          ))}
        </div>
      </div>
      <button className="btn btn-accent" onClick={split}>Divide class equally among selected mentors</button>
      <div style={{ marginTop: 12 }}>
        {result && result.map((r, i) => <Notice tone={r.tone} key={i}>{r.text}</Notice>)}
      </div>
    </Card>
  );
}

function ConnectMode() {
  const [enabled, setEnabled] = useState(true);
  const [requests, setRequests] = useState([]);

  async function load() {
    const cm = await coordinatorApi('/coordinator/connect-mode');
    setEnabled(cm.enabled);
    const reqs = await coordinatorApi('/coordinator/open-requests');
    setRequests(reqs);
  }
  useEffect(() => { load(); }, []);

  async function toggle(e) {
    const next = e.target.checked;
    await coordinatorApi('/coordinator/connect-mode', { method: 'PUT', body: JSON.stringify({ enabled: next }) });
    setEnabled(next);
  }

  return (
    <div>
      <Card>
        <div className="row">
          <div>
            <div className="card-title" style={{ marginBottom: 2 }}>Mentor ⇄ Mentee direct connect</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>When on, mentors and mentees can browse each other and connect directly without waiting for you to assign them.</div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={enabled} onChange={toggle} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>{enabled ? 'On' : 'Off'}</span>
          </label>
        </div>
      </Card>
      <Card title="Open Requests">
        {requests.length ? (
          requests.map((r) => (
            <div className="row" key={r.id} style={{ padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13 }}>
                {r.direction === 'mentee' ? `${r.menteeName} → requested ${r.mentorName}` : `${r.mentorName} → reached out to ${r.menteeName}`}
              </span>
              <Badge tone="amber">Awaiting response</Badge>
            </div>
          ))
        ) : (
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>No open requests right now.</div>
        )}
      </Card>
    </div>
  );
}
