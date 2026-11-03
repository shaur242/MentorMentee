/**
 * Synthetic "database" shared by the Mentee, Mentor, Coordinator, and HOD
 * apps.
 *
 * This is the single source of truth all four frontends read/write through
 * the API in server.js. Everything is in-memory and resets when the server
 * restarts — swap this file for real DB queries later; server.js only ever
 * calls functions/objects exported here, so nothing else needs to change.
 */

let idCounter = 1000;
function nextId(prefix) {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

// ---- Login credentials, shared across roles ----
// (this is the "stored in the background" bit — neither app shows these,
// the person just types them into their own dedicated login page)
const credentials = [
  { role: 'mentee', identifier: '2548021', password: 'mentee123', id: 'MTE-001' },
  { role: 'mentee', identifier: '2548035', password: 'mentee123', id: 'MTE-002' },
  { role: 'mentee', identifier: '2548041', password: 'mentee123', id: 'MTE-003' },
  { role: 'mentee', identifier: '2548052', password: 'mentee123', id: 'MTE-004' },
  { role: 'mentor', identifier: 'EMP2010', password: 'mentor123', id: 'MEN-001' },
  { role: 'mentor', identifier: 'EMP2011', password: 'mentor123', id: 'MEN-002' },
  { role: 'mentor', identifier: 'EMP2012', password: 'mentor123', id: 'MEN-003' },
  { role: 'coordinator', identifier: 'EMP2001', password: 'coord123', id: 'COORD-001' },
  { role: 'hod', identifier: 'EMP1001', password: 'hod123', id: 'HOD-001' }
];

// ---- HODs ----
const hods = {
  'HOD-001': {
    id: 'HOD-001', name: 'Dr. Helen Mathew', employeeId: 'EMP1001', department: 'Data Science'
  }
};

// ---- Coordinators ----
const coordinators = {
  'COORD-001': {
    id: 'COORD-001', name: 'Dr. Meena S', employeeId: 'EMP2001', department: 'Data Science'
  }
};

// ---- Faculty roster the HOD picks a coordinator or mentor from, per
// department (a wider pool than just the three logged-in mentor accounts).
// Full profile fields are included so that "Assign Mentor" (below) can
// create a realistic mentor record instead of a blank placeholder.
const facultyStore = [
  {
    id: 'FAC-001', name: 'Dr. Meena S', employeeId: 'EMP2001', department: 'Data Science',
    designation: 'Assistant Professor', qualification: 'Ph.D Data Science, IISc Bangalore',
    tags: ['Statistics', 'Data Mining'], experienceYears: 9, papers: 6
  },
  {
    id: 'FAC-002', name: 'Dr. Ramesh Kumar', employeeId: 'EMP2010', department: 'Data Science',
    designation: 'Associate Professor', qualification: 'Ph.D Computer Science, IIT Madras',
    tags: ['Machine Learning', 'NLP'], experienceYears: 12, papers: 8
  },
  {
    id: 'FAC-003', name: 'Dr. Sunita Pillai', employeeId: 'EMP2011', department: 'Data Science',
    designation: 'Professor', qualification: 'Ph.D Computer Science',
    tags: ['Deep Learning', 'Computer Vision'], experienceYears: 18, papers: 20
  },
  {
    id: 'FAC-004', name: 'Mr. Arun Joseph', employeeId: 'EMP2012', department: 'Data Science',
    designation: 'Assistant Professor', qualification: 'M.Tech Data Science',
    tags: ['Federated Learning', 'Edge AI'], experienceYears: 4, papers: 2
  },
  {
    id: 'FAC-005', name: 'Dr. Anand P', employeeId: 'EMP2020', department: 'Computer Science',
    designation: 'Professor', qualification: 'Ph.D Computer Science',
    tags: ['Algorithms', 'Distributed Systems'], experienceYears: 15, papers: 14
  },
  {
    id: 'FAC-006', name: 'Dr. Priya R', employeeId: 'EMP2021', department: 'Computer Science',
    designation: 'Assistant Professor', qualification: 'Ph.D Software Engineering',
    tags: ['Software Engineering', 'Cloud Computing'], experienceYears: 6, papers: 4
  },
  {
    id: 'FAC-007', name: 'Dr. Riya P', employeeId: 'EMP2030', department: 'AI & ML',
    designation: 'Associate Professor', qualification: 'Ph.D Artificial Intelligence',
    tags: ['Reinforcement Learning', 'Robotics'], experienceYears: 10, papers: 9
  },
  {
    id: 'FAC-008', name: 'Mr. Suresh V', employeeId: 'EMP2031', department: 'AI & ML',
    designation: 'Assistant Professor', qualification: 'M.Tech AI & ML',
    tags: ['Computer Vision', 'MLOps'], experienceYears: 5, papers: 3
  }
];

// ---- Current coordinator assignment per department: dept -> { facultyId, courseType } ----
let coordinatorAssignments = {
  'Data Science': { facultyId: 'FAC-001', courseType: 'UG' }
};

// ---- Mentees ----
const mentees = {
  'MTE-001': {
    id: 'MTE-001', name: 'Jasmine A', registerNo: '2548021',
    programme: 'MSc Data Science', semester: 3, section: 'A', classCode: '3MDS',
    attendance: 87, cgpa: 8.1, backlogs: 0, mentorId: 'MEN-001', status: 'Good standing'
  },
  'MTE-002': {
    id: 'MTE-002', name: 'Sanjay K', registerNo: '2548035',
    programme: 'MSc Data Science', semester: 2, section: 'B', classCode: '2MDS',
    attendance: 62, cgpa: 5.4, backlogs: 1, mentorId: null, status: 'At risk'
  },
  'MTE-003': {
    id: 'MTE-003', name: 'Akhil Thomas', registerNo: '2548041',
    programme: 'MSc Data Science', semester: 1, section: 'A', classCode: '1MDS',
    attendance: 90, cgpa: 7.8, backlogs: 0, mentorId: null, status: 'Good standing'
  },
  'MTE-004': {
    id: 'MTE-004', name: 'Sandra Joseph', registerNo: '2548052',
    programme: 'B.Tech CS', semester: 3, section: 'C', classCode: '3BCS',
    attendance: 85, cgpa: 8.4, backlogs: 0, mentorId: null, status: 'Good standing'
  }
};

// ---- Mentors (faculty) ----
const mentors = {
  'MEN-001': {
    id: 'MEN-001', name: 'Dr. Ramesh Kumar', employeeId: 'EMP2010',
    designation: 'Associate Professor', department: 'Data Science',
    qualification: 'Ph.D Computer Science, IIT Madras',
    tags: ['Machine Learning', 'NLP', '12 yrs', '8 papers'],
    experienceYears: 12, papers: 8, totalSlots: 20, coordinator: 'Dr. Meena S'
  },
  'MEN-002': {
    id: 'MEN-002', name: 'Dr. Sunita Pillai', employeeId: 'EMP2011',
    designation: 'Professor', department: 'Data Science',
    qualification: 'Ph.D Computer Science',
    tags: ['Deep Learning', 'Computer Vision', '18 yrs', '20 papers'],
    experienceYears: 18, papers: 20, totalSlots: 20, coordinator: 'Dr. Meena S'
  },
  'MEN-003': {
    id: 'MEN-003', name: 'Mr. Arun Joseph', employeeId: 'EMP2012',
    designation: 'Assistant Professor', department: 'Data Science',
    qualification: 'M.Tech Data Science',
    tags: ['Federated Learning', 'Edge AI', '4 yrs', '2 papers'],
    experienceYears: 4, papers: 2, totalSlots: 20, coordinator: 'Dr. Meena S'
  }
};

function menteesOfMentor(mentorId) {
  return Object.values(mentees).filter((m) => m.mentorId === mentorId);
}
function unassignedMentees() {
  return Object.values(mentees).filter((m) => !m.mentorId);
}
function openSlotsForMentor(mentorId) {
  const mentor = mentors[mentorId];
  if (!mentor) return 0;
  return mentor.totalSlots - menteesOfMentor(mentorId).length;
}
function mentorRecordForFaculty(employeeId) {
  return Object.values(mentors).find((m) => m.employeeId === employeeId) || null;
}
function cancelActiveSessionsBetween(mentorId, menteeId) {
  let cancelled = 0;
  sessions.forEach((s) => {
    if (s.mentorId === mentorId && s.menteeId === menteeId && (s.status === 'pending' || s.status === 'confirmed')) {
      s.status = 'cancelled';
      cancelled += 1;
    }
  });
  return cancelled;
}
// Sessions (new bookings and reschedules) may only be placed for today
// through 30 days out — never in the past, never further than a month
// ahead. Used both client-side (calendar min/max) and here server-side.
function isWithinBookingWindow(dateStr) {
  if (!dateStr) return false;
  const day = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(day.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const max = new Date(today);
  max.setDate(max.getDate() + 30);
  return day >= today && day <= max;
}

// ---- Sessions (shared between both apps) ----
let sessions = [
  {
    id: 'SES-1', menteeId: 'MTE-001', mentorId: 'MEN-001',
    title: 'Academic progress review', date: '2026-07-23', label: 'Wed 23 Jul',
    time: '14:30', timeLabel: '2:30 PM', mode: 'In-person', duration: '30 minutes',
    agenda: '', status: 'confirmed', requestedBy: 'mentor'
  },
  {
    id: 'SES-2', menteeId: 'MTE-001', mentorId: 'MEN-001',
    title: 'Research paper discussion', date: '2026-07-28', label: 'Mon 28 Jul',
    time: '11:00', timeLabel: '11:00 AM', mode: 'Online', duration: '30 minutes',
    agenda: '', status: 'pending', requestedBy: 'mentee'
  },
  {
    id: 'SES-0', menteeId: 'MTE-001', mentorId: 'MEN-001',
    title: 'Orientation & goal setting', date: '2026-06-10', label: 'Wed 10 Jun',
    time: '10:00', timeLabel: '10:00 AM', mode: 'In-person', duration: '45 minutes',
    agenda: '', status: 'completed', requestedBy: 'mentor'
  }
];

// ---- Static free/busy slot template used by both booking UIs ----
const slotTemplate = [
  { time: '09:00', label: '9:00 AM', busy: true },
  { time: '10:00', label: '10:00 AM', busy: true },
  { time: '11:00', label: '11:00 AM', busy: false },
  { time: '12:00', label: '12:00 PM', busy: true },
  { time: '14:00', label: '2:00 PM', busy: false },
  { time: '14:30', label: '2:30 PM', busy: false },
  { time: '15:30', label: '3:30 PM', busy: true },
  { time: '16:00', label: '4:00 PM', busy: false }
];

// ---- Department-wide settings the Coordinator controls ----
// (kept as a mutable object so other modules always see live updates)
let settings = {
  connectModeEnabled: true // when false, mentees/mentors can't send direct connect requests — the Coordinator must assign manually
};
// direction 'mentee' = a mentee asked to be taken on by this mentor (shows
// up on the mentor's dashboard as "Mentee Requests"); direction 'mentor' =
// the mentor reached out to an unassigned mentee (from Find Mentees).
let mentorRequests = [
  {
    id: 'REQ-1', menteeId: 'MTE-002', mentorId: 'MEN-001',
    direction: 'mentee', status: 'pending', createdAt: '2026-07-14'
  }
];

// ---- Remarks: each submission is an appended history entry, never
// overwritten, keyed by "mentorId|menteeId". A mentor can submit using a
// transcript, Q&A cells, or both — whichever they choose per submission.
let remarksHistory = {
  'MEN-001|MTE-001': [
    {
      id: 'RMK-1',
      date: '2026-06-15',
      mode: 'qa',
      transcript: '',
      cells: [{ question: 'How are your assignments progressing?', answer: 'On track, finished 2 of 3 this week.' }],
      createdAt: '2026-06-15T10:00:00.000Z'
    }
  ]
};

// ---- Critical issues escalated by mentors ----
let criticalIssues = [];

// ---- OTP store: sessionId -> { code, expiresAt } ----
let otpStore = {
  'SES-0': { code: '482913', expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 365 } // long-lived demo code
};

// ---- HOD notices, addressed by role ----
let hodNotices = [
  {
    id: 'HOD-001',
    title: 'Departmental Notice',
    message:
      'All mentors shall schedule mentoring sessions for the entire semester during regular instruction days. Sessions may be one-on-one or in groups, according to departmental policy. The minimum periodicity is one session per month; weekly mentoring is recommended.',
    from: 'Dr. Helen Mathew · HOD',
    date: '2026-07-10',
    recipients: ['mentee-group', 'mentor', 'coordinator']
  },
  {
    id: 'HOD-002',
    title: 'Compliance reminder',
    message:
      'Please ensure the Session Compliance report for Semester 3 is submitted by the end of this month. Any mentor-mentee pair with zero sessions should be flagged and followed up on.',
    from: 'Dr. Helen Mathew · HOD',
    date: '2026-07-20',
    recipients: ['coordinator']
  }
];

// ---- Feedback (mentee -> mentor) ----
let feedbackHistory = [
  {
    id: 'FB-1', menteeId: 'MTE-001', mentorId: 'MEN-001', sessionId: 'SES-0',
    ratings: { availability: 5, communication: 5, guidance: 5, overall: 5 },
    comment: 'Dr. Ramesh is very approachable and always makes time for sessions.',
    date: '2026-06-11T09:00:00.000Z'
  }
];

// ---- Coordinator feedback about a mentor (static, matches original prototype) ----
const coordinatorFeedback = {
  'MEN-001': {
    coordinatorName: 'Dr. Meena S',
    stars: 5,
    comment:
      'Dr. Ramesh consistently meets with all his mentees and maintains excellent session quality. His students show measurable improvement.'
  }
};

// ---- Group meets scheduled by a mentor ----
let groupMeets = [];

// ---- Goals: one entry per mentee per semester (never overwritten across
// semesters — each new semester gets its own entry, but a mentee can keep
// revising the current semester's entry before it's "locked in" by time
// passing). Each of the three goal categories carries the mentee's own
// text/status/progress, plus a separate mentor comment field.
function blankGoalCategory() {
  return { text: '', status: 'Not started', progress: 0, mentorComment: '' };
}
let goalsStore = {
  'MTE-001': [
    {
      id: 'GOAL-1',
      semester: 3,
      academic: { text: 'Finish the applied ML capstone with a working prototype.', status: 'In progress', progress: 55, mentorComment: 'Good pace — make sure the evaluation section has real metrics.' },
      personal: { text: 'Build a more consistent sleep schedule during exam weeks.', status: 'In progress', progress: 30, mentorComment: '' },
      professional: { text: 'Apply to at least 3 summer research internships.', status: 'Not started', progress: 0, mentorComment: '' },
      createdAt: '2026-07-01T09:00:00.000Z',
      updatedAt: '2026-07-01T09:00:00.000Z'
    }
  ]
};

// ---- Self-validation: one current record per mentee, with the mentor's
// parallel feedback attached. Updating it replaces the current snapshot
// (this one is not semester-versioned, unlike goals).
let selfValidationStore = {};
function blankSelfValidation() {
  return {
    strengths: '',
    improve: '',
    continueDoing: '',
    stopDoing: '',
    updatedAt: null,
    mentorFeedback: {
      strengths: '',
      improve: '',
      continueDoing: '',
      stopDoing: '',
      updatedAt: null
    }
  };
}

module.exports = {
  nextId,
  credentials,
  hods,
  coordinators,
  facultyStore,
  coordinatorAssignments,
  mentees,
  mentors,
  menteesOfMentor,
  unassignedMentees,
  openSlotsForMentor,
  mentorRecordForFaculty,
  cancelActiveSessionsBetween,
  isWithinBookingWindow,
  sessions,
  slotTemplate,
  mentorRequests,
  settings,
  remarksHistory,
  criticalIssues,
  otpStore,
  hodNotices,
  feedbackHistory,
  coordinatorFeedback,
  groupMeets,
  goalsStore,
  blankGoalCategory,
  selfValidationStore,
  blankSelfValidation
};
