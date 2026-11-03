import { useEffect, useState } from 'react';
import { hodApi } from '../HodRoot.jsx';
import { Card, Badge } from '../../components/ui.jsx';

export default function Capacity() {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    hodApi('/hod/capacity').then(setRows);
  }, []);

  if (!rows) return null;

  return (
    <div>
      <div className="page-title">Mentor Capacity</div>
      <div className="page-sub">20-mentee cap per mentor, department-wide</div>
      <Card>
        <table>
          <thead><tr><th>Mentor</th><th>Assigned</th><th>Capacity</th><th>Open slots</th><th>Status</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{r.name}</td><td>{r.assigned}</td><td>{r.capacity}</td><td>{r.openSlots}</td>
                <td>{r.compliant ? <Badge tone="green">Within policy</Badge> : <Badge tone="red">Over capacity</Badge>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
