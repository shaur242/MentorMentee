import { Routes, Route } from 'react-router-dom';
import MenteeRoot from './mentee/MenteeRoot.jsx';
import MentorRoot from './mentor/MentorRoot.jsx';
import CoordinatorRoot from './coordinator/CoordinatorRoot.jsx';
import HodRoot from './hod/HodRoot.jsx';

function Landing() {
  return (
    <div className="landing-wrap">
      <div className="landing-card">
        <h2 style={{ margin: '0 0 4px' }}>MentorOne</h2>
        <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>
          This page is just a local dev convenience, not part of any portal.
        </p>
        <div className="landing-links">
          <a href="/mentee/">Open Mentee app</a>
          <a href="/mentor/">Open Mentor app</a>
          <a href="/coordinator/">Open Coordinator app</a>
          <a href="/hod/">Open HOD app</a>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/mentee/*" element={<MenteeRoot />} />
      <Route path="/mentor/*" element={<MentorRoot />} />
      <Route path="/coordinator/*" element={<CoordinatorRoot />} />
      <Route path="/hod/*" element={<HodRoot />} />
      <Route path="*" element={<Landing />} />
    </Routes>
  );
}
