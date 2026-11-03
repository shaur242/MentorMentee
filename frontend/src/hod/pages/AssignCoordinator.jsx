import { useEffect, useState } from 'react';
import { hodApi } from '../HodRoot.jsx';
import { Card, Avatar, Badge, Notice } from '../../components/ui.jsx';

export default function AssignCoordinator() {
  const [departments, setDepartments] = useState([]);
  const [department, setDepartment] = useState('');
  const [faculty, setFaculty] = useState([]);
  const [current, setCurrent] = useState(null);
  const [facultyId, setFacultyId] = useState('');
  const [courseType, setCourseType] = useState('UG');
  const [acResult, setAcResult] = useState(null);
  const [mentorResult, setMentorResult] = useState(null);

  useEffect(() => {
    hodApi('/hod/departments').then((list) => {
      setDepartments(list);
      if (list.length) setDepartment(list[0]);
    });
  }, []);

  async function loadDept(dept) {
    if (!dept) return;
    const [facultyList, currentAssignment] = await Promise.all([
      hodApi(`/hod/faculty?department=${encodeURIComponent(dept)}`),
      hodApi(`/hod/coordinator-assignment?department=${encodeURIComponent(dept)}`)
    ]);
    setFaculty(facultyList);
    setCurrent(currentAssignment);
    if (currentAssignment) {
      setFacultyId(currentAssignment.facultyId);
      setCourseType(currentAssignment.courseType);
    } else if (facultyList.length) {
      setFacultyId(facultyList[0].id);
    }
    setAcResult(null);
    setMentorResult(null);
  }

  useEffect(() => { loadDept(department); }, [department]);

  async function assignCoordinator() {
    try {
      const res = await hodApi('/hod/assign-coordinator', { method: 'POST', body: JSON.stringify({ department, facultyId, courseType }) });
      setAcResult({ tone: 'green', text: res.message });
      loadDept(department);
    } catch (e) {
      setAcResult({ tone: 'red', text: e.message });
    }
  }

  async function assignMentor(fid) {
    try {
      const res = await hodApi('/hod/assign-mentor', { method: 'POST', body: JSON.stringify({ facultyId: fid }) });
      setMentorResult({ tone: 'green', text: res.message });
      loadDept(department);
    } catch (e) {
      setMentorResult({ tone: 'red', text: e.message });
    }
  }
  async function removeMentor(mentorId) {
    try {
      const res = await hodApi('/hod/remove-mentor', { method: 'POST', body: JSON.stringify({ mentorId }) });
      setMentorResult({ tone: 'green', text: res.message });
      loadDept(department);
    } catch (e) {
      setMentorResult({ tone: 'red', text: e.message });
    }
  }

  return (
    <div>
      <div className="page-title">Assign Coordinator &amp; Mentors</div>
      <div className="page-sub">Select a department to see its faculty, then choose who coordinates it and who acts as a mentor.</div>

      <Card>
        <div className="field">
          <label className="label">Department</label>
          <select className="input" value={department} onChange={(e) => setDepartment(e.target.value)}>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </Card>

      <Card title="Currently Assigned Coordinator">
        {current && current.faculty ? (
          <div className="row-start">
            <Avatar name={current.faculty.name} size="lg" />
            <div>
              <div style={{ fontWeight: 600 }}>{current.faculty.name}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{current.faculty.employeeId}</div>
            </div>
            <Badge tone="blue">{current.courseType}</Badge>
            <Badge tone="green">Assigned</Badge>
          </div>
        ) : (
          <Notice tone="amber">No coordinator assigned yet for this department.</Notice>
        )}
      </Card>

      <Card title="Assign a Coordinator">
        <div className="grid2">
          <div className="field">
            <label className="label">Faculty member</label>
            <select className="input" value={facultyId} onChange={(e) => setFacultyId(e.target.value)}>
              {faculty.map((f) => (
                <option key={f.id} value={f.id}>{f.name} — {f.employeeId}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label">Course level</label>
            <select className="input" value={courseType} onChange={(e) => setCourseType(e.target.value)}>
              <option value="UG">UG</option>
              <option value="PG">PG</option>
            </select>
          </div>
        </div>
        <button className="btn btn-accent" onClick={assignCoordinator}>Assign as Department Coordinator</button>
        {acResult && <div style={{ marginTop: 10 }}><Notice tone={acResult.tone}>{acResult.text}</Notice></div>}
      </Card>

      <Card title="Assign Mentors">
        <div className="page-sub" style={{ marginBottom: 10 }}>Faculty must be made a mentor here before mentees can be paired with them, or before they can sign in to the Mentor app.</div>
        {faculty.map((f) => (
          <div className="row" key={f.id} style={{ padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
            <div className="row-start">
              <Avatar name={f.name} />
              <div>
                <b style={{ fontSize: 13 }}>{f.name}</b>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{f.designation} · {f.employeeId}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {f.isMentor ? (
                <>
                  <Badge tone="green">Mentor · {f.menteeCount} mentee(s)</Badge>
                  <button className="btn btn-xs btn-red" onClick={() => removeMentor(f.mentorId)}>Remove</button>
                </>
              ) : (
                <button className="btn btn-xs btn-accent" onClick={() => assignMentor(f.id)}>Make Mentor</button>
              )}
            </div>
          </div>
        ))}
        {mentorResult && <div style={{ marginTop: 10 }}><Notice tone={mentorResult.tone}>{mentorResult.text}</Notice></div>}
      </Card>
    </div>
  );
}
