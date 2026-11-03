import { useEffect, useState } from 'react';
import { mentorApi } from '../MentorRoot.jsx';
import { Card, Notice } from '../../components/ui.jsx';

export default function Profile({ ctx }) {
  const { setMentor } = ctx;
  const [form, setForm] = useState(null);
  const [note, setNote] = useState(null);

  useEffect(() => {
    mentorApi('/mentor/profile').then((p) =>
      setForm({ ...p, tagsText: p.tags.join(', ') })
    );
  }, []);

  if (!form) return null;

  function set(key, value) {
    setForm({ ...form, [key]: value });
  }

  async function save() {
    const payload = {
      name: form.name,
      designation: form.designation,
      department: form.department,
      qualification: form.qualification,
      tags: form.tagsText.split(',').map((t) => t.trim()).filter(Boolean),
      experienceYears: form.experienceYears,
      papers: form.papers
    };
    try {
      const res = await mentorApi('/mentor/profile', { method: 'PUT', body: JSON.stringify(payload) });
      setMentor(res.mentor);
      setNote({ tone: 'green', text: 'Profile saved.' });
    } catch (e) {
      setNote({ tone: 'red', text: e.message });
    }
  }

  return (
    <div>
      <div className="page-title">My Profile</div>
      <Card>
        <div className="grid2">
          <div className="field"><label className="label">Full name</label><input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} /></div>
          <div className="field"><label className="label">Designation</label><input className="input" value={form.designation} onChange={(e) => set('designation', e.target.value)} /></div>
        </div>
        <div className="grid2">
          <div className="field"><label className="label">Department</label><input className="input" value={form.department} onChange={(e) => set('department', e.target.value)} /></div>
          <div className="field"><label className="label">Qualification</label><input className="input" value={form.qualification} onChange={(e) => set('qualification', e.target.value)} /></div>
        </div>
        <div className="field"><label className="label">Keywords / Specialisation (comma separated)</label><input className="input" value={form.tagsText} onChange={(e) => set('tagsText', e.target.value)} /></div>
        <div className="grid2">
          <div className="field"><label className="label">Teaching experience (years)</label><input className="input" type="number" value={form.experienceYears} onChange={(e) => set('experienceYears', e.target.value)} /></div>
          <div className="field"><label className="label">Papers published</label><input className="input" type="number" value={form.papers} onChange={(e) => set('papers', e.target.value)} /></div>
        </div>
        <button className="btn btn-accent" onClick={save}>Save profile</button>
        {note && <div style={{ marginTop: 10 }}><Notice tone={note.tone}>{note.text}</Notice></div>}
      </Card>
    </div>
  );
}
