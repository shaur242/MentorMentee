const express = require('express');
const cors = require('cors');
const path = require('path');
const data = require('./data');

const app = express();
app.use(cors());
app.use(express.json());

// Serves the built React app (frontend/dist) — one SPA covering all four
// portals via client-side routing (/mentee/*, /mentor/*, /coordinator/*,
// /hod/*), each with its own dedicated login route/page. The catch-all
// fallback that lets deep links like /mentee/dashboard survive a full page
// refresh is registered at the very bottom of this file, after every API
// route, so it never shadows the API.
app.use(express.static(path.join(__dirname, '..', 'frontend', 'dist')));

// ---- Very small in-memory session/token store -----------------------------
// Not real auth (no hashing, no expiry) — this is a synthetic demo backend.
const tokens = {}; // token -> { role, id }

function auth(requiredRole) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.replace('Bearer ', '').trim();
    const session = tokens[token];
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated. Please log in again.' });
    }
    if (requiredRole && session.role !== requiredRole) {
      return res.status(403).json({ error: `This action requires a ${requiredRole} login.` });
    }
    req.userId = session.id;
    req.userRole = session.role;
    next();
  };
}

// =============================================================
// AUTH — two fully separate endpoints, one per app. The Mentee
// app only ever calls /api/auth/mentee-login, the Mentor app only
// ever calls /api/auth/mentor-login. Neither page has a role
// picker and neither shares a login form or a login route.
// =============================================================
app.post('/api/auth/mentee-login', (req, res) => {
  const { registerNo, password } = req.body || {};
  const cred = data.credentials.find(
    (c) => c.role === 'mentee' && c.identifier === (registerNo || '').trim() && c.password === password
  );
  if (!cred) {
    return res.status(401).json({ error: 'Incorrect register number or password.' });
  }
  const token = `tok_${Math.random().toString(36).slice(2)}${Date.now()}`;
  tokens[token] = { role: 'mentee', id: cred.id };
  res.json({ token, mentee: data.mentees[cred.id] });
});

app.post('/api/auth/mentor-login', (req, res) => {
  const { employeeId, password } = req.body || {};
  const cred = data.credentials.find(
    (c) => c.role === 'mentor' && c.identifier === (employeeId || '').trim() && c.password === password
  );
  if (!cred) {
    return res.status(401).json({ error: 'Incorrect employee ID or password.' });
  }
  const token = `tok_${Math.random().toString(36).slice(2)}${Date.now()}`;
  tokens[token] = { role: 'mentor', id: cred.id };
  res.json({ token, mentor: data.mentors[cred.id] });
});

app.post('/api/auth/coordinator-login', (req, res) => {
  const { employeeId, password } = req.body || {};
  const cred = data.credentials.find(
    (c) => c.role === 'coordinator' && c.identifier === (employeeId || '').trim() && c.password === password
  );
  if (!cred) {
    return res.status(401).json({ error: 'Incorrect employee ID or password.' });
  }
  const token = `tok_${Math.random().toString(36).slice(2)}${Date.now()}`;
  tokens[token] = { role: 'coordinator', id: cred.id };
  res.json({ token, coordinator: data.coordinators[cred.id] });
});

app.post('/api/auth/hod-login', (req, res) => {
  const { employeeId, password } = req.body || {};
  const cred = data.credentials.find(
    (c) => c.role === 'hod' && c.identifier === (employeeId || '').trim() && c.password === password
  );
  if (!cred) {
    return res.status(401).json({ error: 'Incorrect employee ID or password.' });
  }
  const token = `tok_${Math.random().toString(36).slice(2)}${Date.now()}`;
  tokens[token] = { role: 'hod', id: cred.id };
  res.json({ token, hod: data.hods[cred.id] });
});

app.post('/api/auth/logout', auth(), (req, res) => {
  const header = req.headers.authorization || '';
  const token = header.replace('Bearer ', '').trim();
  delete tokens[token];
  res.json({ ok: true });
});

// helper shared by both sides
function decorateSession(s) {
  return {
    ...s,
    menteeName: data.mentees[s.menteeId]?.name,
    mentorName: data.mentors[s.mentorId]?.name
  };
}

// =============================================================
// MENTEE ROUTES
// =============================================================
const menteeAuth = auth('mentee');

app.get('/api/mentee/dashboard', menteeAuth, (req, res) => {
  const mentee = data.mentees[req.userId];
  const mentor = mentee.mentorId ? data.mentors[mentee.mentorId] : null;
  const mySessions = data.sessions.filter((s) => s.menteeId === mentee.id);
  const completed = mySessions.filter((s) => s.status === 'completed').length;
  const upcoming = mySessions.filter((s) => s.status === 'pending' || s.status === 'confirmed');
  const thisMonthCompleted = mySessions.filter(
    (s) => s.status === 'completed' && s.date.startsWith('2026-07')
  ).length;

  res.json({
    mentee,
    mentor,
    stats: {
      sessionsThisMonth: Math.max(thisMonthCompleted, mentee.mentorId ? 1 : 0),
      totalSessions: mySessions.length,
      attendance: mentee.attendance
    },
    upcoming,
    donut: {
      completedPct: Math.round((completed / Math.max(mySessions.length, 1)) * 100),
      completed,
      pending: upcoming.length
    }
  });
});

app.get('/api/mentee/mentors', menteeAuth, (req, res) => {
  res.json(
    Object.values(data.mentors).map((m) => ({ ...m, openSlots: data.openSlotsForMentor(m.id) }))
  );
});

app.get('/api/mentee/connect-mode', menteeAuth, (req, res) => {
  res.json({ enabled: data.settings.connectModeEnabled });
});

app.get('/api/mentee/mentor-requests', menteeAuth, (req, res) => {
  const incoming = data.mentorRequests
    .filter((r) => r.menteeId === req.userId && r.direction === 'mentor' && r.status === 'pending')
    .map((r) => ({ ...r, mentorName: data.mentors[r.mentorId]?.name, mentor: data.mentors[r.mentorId] }));
  res.json(incoming);
});

app.post('/api/mentee/mentor-requests/:id/respond', menteeAuth, (req, res) => {
  const request = data.mentorRequests.find((r) => r.id === req.params.id && r.menteeId === req.userId);
  if (!request) return res.status(404).json({ error: 'Request not found.' });
  const { action } = req.body || {}; // 'accept' | 'decline'
  const mentee = data.mentees[req.userId];
  if (action === 'accept') {
    if (mentee.mentorId) {
      request.status = 'declined';
      return res.status(400).json({ error: 'You already have a mentor assigned.' });
    }
    const mentor = data.mentors[request.mentorId];
    if (!mentor || data.openSlotsForMentor(request.mentorId) <= 0) {
      return res.status(400).json({ error: 'That mentor is no longer available (at capacity or removed).' });
    }
    mentee.mentorId = request.mentorId;
    request.status = 'accepted';
    return res.json({ ok: true, message: `${mentor.name} is now your mentor.` });
  }
  request.status = 'declined';
  res.json({ ok: true, message: 'Request declined.' });
});

app.post('/api/mentee/mentor-requests', menteeAuth, (req, res) => {
  if (!data.settings.connectModeEnabled) {
    return res.status(403).json({
      error: 'Direct mentor requests are currently switched off by your coordinator. Your coordinator will assign you a mentor directly.'
    });
  }
  const { mentorId } = req.body || {};
  const mentor = data.mentors[mentorId];
  if (!mentor) return res.status(404).json({ error: 'Mentor not found.' });
  const mentee = data.mentees[req.userId];
  if (mentee.mentorId) {
    return res.status(400).json({ error: 'You already have a mentor assigned.' });
  }
  const existing = data.mentorRequests.find(
    (r) => r.menteeId === mentee.id && r.mentorId === mentorId && r.status === 'pending'
  );
  if (existing) {
    return res.json({ ok: true, message: `You already have a pending request with ${mentor.name}.` });
  }
  const request = {
    id: data.nextId('REQ'),
    menteeId: mentee.id,
    mentorId,
    direction: 'mentee',
    status: 'pending',
    createdAt: new Date().toISOString().slice(0, 10)
  };
  data.mentorRequests.push(request);
  res.json({ ok: true, message: `Request sent to ${mentor.name} — you'll be paired once they accept.` });
});

app.get('/api/mentee/sessions', menteeAuth, (req, res) => {
  const mySessions = data.sessions
    .filter((s) => s.menteeId === req.userId)
    .map(decorateSession)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  res.json(mySessions);
});

app.get('/api/mentee/slots', menteeAuth, (req, res) => {
  res.json(data.slotTemplate);
});

app.post('/api/mentee/sessions', menteeAuth, (req, res) => {
  const mentee = data.mentees[req.userId];
  if (!mentee.mentorId) {
    return res.status(400).json({ error: 'You need a mentor before you can book a session. Visit Find Mentor first.' });
  }
  const { date, label, time, timeLabel, duration, mode, agenda, afterClass } = req.body || {};
  if (!time && !afterClass) {
    return res.status(400).json({ error: 'Pick a time slot before sending the request.' });
  }
  if (!data.isWithinBookingWindow(date)) {
    return res.status(400).json({ error: 'Pick a date between today and 30 days from now.' });
  }
  const session = {
    id: data.nextId('SES'),
    menteeId: mentee.id,
    mentorId: mentee.mentorId,
    title: agenda ? agenda.slice(0, 60) : 'New mentoring session',
    date: date || '',
    label: label || '',
    time: time || '',
    timeLabel: timeLabel || 'After class',
    duration: duration || '30 minutes',
    mode: mode || 'In-person',
    agenda: agenda || '',
    afterClass: !!afterClass,
    status: 'pending',
    requestedBy: 'mentee'
  };
  data.sessions.push(session);
  res.json({ ok: true, session: decorateSession(session) });
});

app.put('/api/mentee/sessions/:id/reschedule', menteeAuth, (req, res) => {
  const session = data.sessions.find((s) => s.id === req.params.id && s.menteeId === req.userId);
  if (!session) return res.status(404).json({ error: 'Session not found.' });
  const { date, label, time, timeLabel, reason, afterClass } = req.body || {};
  if (!time && !afterClass) {
    return res.status(400).json({ error: 'Pick a new time slot before confirming.' });
  }
  if (!data.isWithinBookingWindow(date)) {
    return res.status(400).json({ error: 'Pick a date between today and 30 days from now.' });
  }
  session.date = date || session.date;
  session.label = label || session.label;
  session.time = time || session.time;
  session.timeLabel = timeLabel || session.timeLabel;
  session.status = 'pending';
  session.afterClass = !!afterClass;
  session.rescheduleReason = reason || '';
  session.requestedBy = 'mentee';
  res.json({ ok: true, session: decorateSession(session) });
});

app.post('/api/mentee/otp/verify', menteeAuth, (req, res) => {
  const { sessionId, code } = req.body || {};
  const entry = data.otpStore[sessionId];
  if (!entry) {
    return res.status(404).json({ ok: false, message: 'No active OTP for this session. Ask your mentor to generate one.' });
  }
  if (Date.now() > entry.expiresAt) {
    return res.status(400).json({ ok: false, message: 'This OTP has expired. Ask your mentor to generate a new one.' });
  }
  if (code === entry.code) {
    const session = data.sessions.find((s) => s.id === sessionId);
    if (session) {
      session.status = 'completed';
      session.attendanceConfirmedAt = new Date().toISOString();
    }
    return res.json({ ok: true, message: 'Attendance confirmed for this session.' });
  }
  res.status(400).json({ ok: false, message: 'Incorrect OTP. Please check the code and try again.' });
});

app.get('/api/mentee/otp/status/:sessionId', menteeAuth, (req, res) => {
  const entry = data.otpStore[req.params.sessionId];
  if (!entry || Date.now() > entry.expiresAt) {
    return res.json({ active: false });
  }
  res.json({ active: true, expiresAt: entry.expiresAt });
});

app.get('/api/mentee/hod-notices', menteeAuth, (req, res) => {
  const notices = data.hodNotices.filter(
    (n) =>
      n.recipients.includes('mentee-group') ||
      n.recipients.includes('mentee') ||
      n.recipients.includes(`mentee:${req.userId}`)
  );
  res.json(notices);
});

app.post('/api/mentee/feedback', menteeAuth, (req, res) => {
  const mentee = data.mentees[req.userId];
  const { sessionId, ratings, comment } = req.body || {};
  const entry = {
    id: data.nextId('FB'),
    menteeId: mentee.id,
    mentorId: mentee.mentorId,
    sessionId: sessionId || null,
    ratings: ratings || {},
    comment: comment || '',
    date: new Date().toISOString()
  };
  data.feedbackHistory.push(entry);
  res.json({ ok: true, entry });
});

app.get('/api/mentee/feedback', menteeAuth, (req, res) => {
  res.json(data.feedbackHistory.filter((f) => f.menteeId === req.userId));
});

// ---- Goals: one entry per semester, never overwritten across semesters ----
app.get('/api/mentee/goals', menteeAuth, (req, res) => {
  const list = (data.goalsStore[req.userId] || []).slice().sort((a, b) => b.semester - a.semester);
  res.json(list);
});
app.post('/api/mentee/goals', menteeAuth, (req, res) => {
  const { semester, academic, personal, professional } = req.body || {};
  const sem = Number(semester) || data.mentees[req.userId].semester;
  if (!data.goalsStore[req.userId]) data.goalsStore[req.userId] = [];
  let entry = data.goalsStore[req.userId].find((g) => g.semester === sem);
  function mergeCategory(existing, incoming) {
    const base = existing || data.blankGoalCategory();
    return {
      text: incoming?.text !== undefined ? incoming.text : base.text,
      status: incoming?.status !== undefined ? incoming.status : base.status,
      progress: incoming?.progress !== undefined ? Number(incoming.progress) : base.progress,
      mentorComment: base.mentorComment // the mentee can never edit the mentor's comment
    };
  }
  if (entry) {
    entry.academic = mergeCategory(entry.academic, academic);
    entry.personal = mergeCategory(entry.personal, personal);
    entry.professional = mergeCategory(entry.professional, professional);
    entry.updatedAt = new Date().toISOString();
  } else {
    entry = {
      id: data.nextId('GOAL'),
      semester: sem,
      academic: mergeCategory(null, academic),
      personal: mergeCategory(null, personal),
      professional: mergeCategory(null, professional),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.goalsStore[req.userId].push(entry);
  }
  res.json({ ok: true, entry });
});

// ---- Self-validation: one current snapshot + the mentor's parallel feedback ----
app.get('/api/mentee/self-validation', menteeAuth, (req, res) => {
  res.json(data.selfValidationStore[req.userId] || data.blankSelfValidation());
});
app.put('/api/mentee/self-validation', menteeAuth, (req, res) => {
  const { strengths, improve, continueDoing, stopDoing } = req.body || {};
  const existing = data.selfValidationStore[req.userId] || data.blankSelfValidation();
  data.selfValidationStore[req.userId] = {
    ...existing,
    strengths: strengths ?? existing.strengths,
    improve: improve ?? existing.improve,
    continueDoing: continueDoing ?? existing.continueDoing,
    stopDoing: stopDoing ?? existing.stopDoing,
    updatedAt: new Date().toISOString()
  };
  res.json({ ok: true, record: data.selfValidationStore[req.userId] });
});

// =============================================================
// MENTOR ROUTES
// =============================================================
const mentorAuth = auth('mentor');

app.get('/api/mentor/dashboard', mentorAuth, (req, res) => {
  const mentor = data.mentors[req.userId];
  const myMentees = data.menteesOfMentor(mentor.id);
  const mySessions = data.sessions.filter((s) => s.mentorId === mentor.id);
  const pendingSessions = mySessions.filter((s) => s.status === 'pending');
  const thisMonthCompleted = mySessions.filter(
    (s) => s.status === 'completed' && s.date.startsWith('2026-07')
  ).length;
  const menteeRequests = data.mentorRequests.filter(
    (r) => r.mentorId === mentor.id && r.direction === 'mentee' && r.status === 'pending'
  );

  res.json({
    mentor: { ...mentor, openSlots: data.openSlotsForMentor(mentor.id) },
    stats: {
      activeMentees: myMentees.length,
      capacity: mentor.totalSlots,
      sessionsThisMonth: thisMonthCompleted,
      pendingRequests: pendingSessions.length + menteeRequests.length
    },
    pendingSessions: pendingSessions.map(decorateSession),
    menteeRequests: menteeRequests.map((r) => ({ ...r, menteeName: data.mentees[r.menteeId]?.name, mentee: data.mentees[r.menteeId] })),
    mentees: myMentees
  });
});

app.get('/api/mentor/mentees', mentorAuth, (req, res) => {
  const myMentees = data.menteesOfMentor(req.userId).map((m) => {
    const mySessions = data.sessions.filter((s) => s.menteeId === m.id && s.mentorId === req.userId);
    return { ...m, sessionCount: mySessions.filter((s) => s.status === 'completed').length };
  });
  res.json(myMentees);
});

app.get('/api/mentor/find-mentees', mentorAuth, (req, res) => {
  const list = data.unassignedMentees().map((m) => {
    const pending = data.mentorRequests.find(
      (r) => r.menteeId === m.id && r.mentorId === req.userId && r.direction === 'mentor' && r.status === 'pending'
    );
    return { ...m, requested: !!pending };
  });
  res.json(list);
});

app.get('/api/mentor/connect-mode', mentorAuth, (req, res) => {
  res.json({ enabled: data.settings.connectModeEnabled });
});

app.post('/api/mentor/mentee-requests', mentorAuth, (req, res) => {
  if (!data.settings.connectModeEnabled) {
    return res.status(403).json({
      error: 'Direct mentee requests are currently switched off by your coordinator.'
    });
  }
  const { menteeId } = req.body || {};
  const mentee = data.mentees[menteeId];
  if (!mentee) return res.status(404).json({ error: 'Mentee not found.' });
  if (mentee.mentorId) return res.status(400).json({ error: 'This mentee already has a mentor.' });
  const existing = data.mentorRequests.find(
    (r) => r.menteeId === menteeId && r.mentorId === req.userId && r.direction === 'mentor' && r.status === 'pending'
  );
  if (existing) {
    return res.json({ ok: true, message: `You already have a pending request with ${mentee.name}.` });
  }
  const request = {
    id: data.nextId('REQ'),
    menteeId,
    mentorId: req.userId,
    direction: 'mentor',
    status: 'pending',
    createdAt: new Date().toISOString().slice(0, 10)
  };
  data.mentorRequests.push(request);
  res.json({ ok: true, message: `Request sent to ${mentee.name}.` });
});

app.post('/api/mentor/mentee-requests/:id/respond', mentorAuth, (req, res) => {
  const request = data.mentorRequests.find((r) => r.id === req.params.id && r.mentorId === req.userId);
  if (!request) return res.status(404).json({ error: 'Request not found.' });
  const { action } = req.body || {}; // 'accept' | 'decline'
  if (action === 'accept') {
    const mentee = data.mentees[request.menteeId];
    if (mentee.mentorId) {
      request.status = 'declined';
      return res.status(400).json({ error: `${mentee.name} already has a mentor.` });
    }
    if (data.openSlotsForMentor(req.userId) <= 0) {
      return res.status(400).json({ error: 'You are at your 20-mentee capacity.' });
    }
    mentee.mentorId = req.userId;
    request.status = 'accepted';
    return res.json({ ok: true, message: `${mentee.name} is now your mentee.` });
  }
  request.status = 'declined';
  res.json({ ok: true, message: 'Request declined.' });
});

app.get('/api/mentor/sessions', mentorAuth, (req, res) => {
  const mySessions = data.sessions
    .filter((s) => s.mentorId === req.userId)
    .map(decorateSession)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  res.json(mySessions);
});

app.get('/api/mentor/slots', mentorAuth, (req, res) => {
  res.json(data.slotTemplate);
});

app.post('/api/mentor/sessions/:id/respond', mentorAuth, (req, res) => {
  const session = data.sessions.find((s) => s.id === req.params.id && s.mentorId === req.userId);
  if (!session) return res.status(404).json({ error: 'Session not found.' });
  const { action } = req.body || {}; // 'accept' | 'decline'
  session.status = action === 'accept' ? 'confirmed' : 'declined';
  res.json({ ok: true, session: decorateSession(session) });
});

app.put('/api/mentor/sessions/:id/reschedule', mentorAuth, (req, res) => {
  const session = data.sessions.find((s) => s.id === req.params.id && s.mentorId === req.userId);
  if (!session) return res.status(404).json({ error: 'Session not found.' });
  const { date, label, time, timeLabel, reason, afterClass } = req.body || {};
  if (!time && !afterClass) {
    return res.status(400).json({ error: 'Pick a new time slot before confirming.' });
  }
  if (!data.isWithinBookingWindow(date)) {
    return res.status(400).json({ error: 'Pick a date between today and 30 days from now.' });
  }
  session.date = date || session.date;
  session.label = label || session.label;
  session.time = time || session.time;
  session.timeLabel = timeLabel || session.timeLabel;
  session.status = 'pending';
  session.afterClass = !!afterClass;
  session.rescheduleReason = reason || '';
  session.requestedBy = 'mentor';
  res.json({ ok: true, session: decorateSession(session) });
});

app.post('/api/mentor/sessions', mentorAuth, (req, res) => {
  const { menteeId, date, label, time, timeLabel, duration, mode, agenda } = req.body || {};
  const mentee = data.mentees[menteeId];
  if (!mentee || mentee.mentorId !== req.userId) {
    return res.status(400).json({ error: 'This mentee is not assigned to you.' });
  }
  if (!data.isWithinBookingWindow(date)) {
    return res.status(400).json({ error: 'Pick a date between today and 30 days from now.' });
  }
  const session = {
    id: data.nextId('SES'),
    menteeId,
    mentorId: req.userId,
    title: agenda ? agenda.slice(0, 60) : 'New mentoring session',
    date, label, time, timeLabel,
    duration: duration || '30 minutes',
    mode: mode || 'In-person',
    agenda: agenda || '',
    status: 'confirmed', // mentor-initiated sessions are auto-confirmed (mentor invites mentee)
    requestedBy: 'mentor'
  };
  data.sessions.push(session);
  res.json({ ok: true, session: decorateSession(session) });
});

// ---- OTP: the mentor generates it, the mentee verifies it ----
app.post('/api/mentor/otp/generate', mentorAuth, (req, res) => {
  const { sessionId } = req.body || {};
  const session = data.sessions.find((s) => s.id === sessionId && s.mentorId === req.userId);
  if (!session) return res.status(404).json({ error: 'Session not found.' });
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  data.otpStore[sessionId] = { code, expiresAt };
  res.json({ ok: true, code, expiresAt });
});

// ---- Remarks: append-only submission history per mentor|mentee pair.
// A mentor can submit using a transcript, Q&A cells, or both — whichever
// they filled in — and every submission is kept (never overwritten), so
// the record accumulates across the whole semester.
app.get('/api/mentor/remarks-history/:menteeId', mentorAuth, (req, res) => {
  const key = `${req.userId}|${req.params.menteeId}`;
  const history = (data.remarksHistory[key] || []).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json(history);
});
app.post('/api/mentor/remarks-history/:menteeId', mentorAuth, (req, res) => {
  const key = `${req.userId}|${req.params.menteeId}`;
  const { mode, transcript, cells } = req.body || {};
  const cleanCells = Array.isArray(cells) ? cells.filter((c) => (c.question || '').trim() || (c.answer || '').trim()) : [];
  const cleanTranscript = (transcript || '').trim();
  if (!cleanTranscript && cleanCells.length === 0) {
    return res.status(400).json({ error: 'Add a transcript, at least one question/answer, or both before submitting.' });
  }
  const entry = {
    id: data.nextId('RMK'),
    date: new Date().toISOString().slice(0, 10),
    mode: mode || (cleanTranscript && cleanCells.length ? 'both' : cleanTranscript ? 'transcript' : 'qa'),
    transcript: cleanTranscript,
    cells: cleanCells,
    createdAt: new Date().toISOString()
  };
  if (!data.remarksHistory[key]) data.remarksHistory[key] = [];
  data.remarksHistory[key].push(entry);
  res.json({ ok: true, entry });
});

// ---- Report a critical issue (mentor can edit/delete their own) ----
app.post('/api/mentor/critical-issues', mentorAuth, (req, res) => {
  const { menteeId, category, details } = req.body || {};
  const mentee = data.mentees[menteeId];
  if (!mentee) return res.status(404).json({ error: 'Mentee not found.' });
  const issue = {
    id: data.nextId('ISS'),
    mentorId: req.userId,
    menteeId,
    category: category || 'Other critical concern',
    details: details || '',
    status: 'Open',
    date: new Date().toISOString().slice(0, 10)
  };
  data.criticalIssues.push(issue);
  res.json({ ok: true, issue });
});
app.get('/api/mentor/critical-issues', mentorAuth, (req, res) => {
  res.json(
    data.criticalIssues
      .filter((i) => i.mentorId === req.userId)
      .map((i) => ({ ...i, menteeName: data.mentees[i.menteeId]?.name }))
  );
});
app.put('/api/mentor/critical-issues/:id', mentorAuth, (req, res) => {
  const issue = data.criticalIssues.find((i) => i.id === req.params.id && i.mentorId === req.userId);
  if (!issue) return res.status(404).json({ error: 'Escalation not found.' });
  const { category, details } = req.body || {};
  if (category) issue.category = category;
  if (details !== undefined) issue.details = details;
  res.json({ ok: true, issue });
});
app.delete('/api/mentor/critical-issues/:id', mentorAuth, (req, res) => {
  const idx = data.criticalIssues.findIndex((i) => i.id === req.params.id && i.mentorId === req.userId);
  if (idx === -1) return res.status(404).json({ error: 'Escalation not found.' });
  data.criticalIssues.splice(idx, 1);
  res.json({ ok: true });
});

// ---- Group meet ----
app.post('/api/mentor/group-meets', mentorAuth, (req, res) => {
  const { menteeIds, date, time, mode, duration, agenda } = req.body || {};
  const meet = {
    id: data.nextId('GM'),
    mentorId: req.userId,
    menteeIds: menteeIds || [],
    date, time, mode, duration, agenda,
    createdAt: new Date().toISOString()
  };
  data.groupMeets.push(meet);
  res.json({ ok: true, meet });
});

// ---- HOD notices ----
app.get('/api/mentor/hod-notices', mentorAuth, (req, res) => {
  res.json(
    data.hodNotices.filter(
      (n) => n.recipients.includes('mentor') || n.recipients.includes(`mentor:${req.userId}`)
    )
  );
});

// ---- Feedback received ----
app.get('/api/mentor/feedback', mentorAuth, (req, res) => {
  const entries = data.feedbackHistory
    .filter((f) => f.mentorId === req.userId)
    .map((f) => ({ ...f, menteeName: data.mentees[f.menteeId]?.name }));
  res.json({ entries, coordinatorFeedback: data.coordinatorFeedback[req.userId] || null });
});

// ---- Profile ----
app.get('/api/mentor/profile', mentorAuth, (req, res) => {
  res.json(data.mentors[req.userId]);
});
app.put('/api/mentor/profile', mentorAuth, (req, res) => {
  const mentor = data.mentors[req.userId];
  const { name, designation, department, qualification, tags, experienceYears, papers } = req.body || {};
  if (name) mentor.name = name;
  if (designation) mentor.designation = designation;
  if (department) mentor.department = department;
  if (qualification) mentor.qualification = qualification;
  if (Array.isArray(tags)) mentor.tags = tags;
  if (experienceYears !== undefined) mentor.experienceYears = Number(experienceYears);
  if (papers !== undefined) mentor.papers = Number(papers);
  res.json({ ok: true, mentor });
});

function requireOwnMentee(req, res) {
  const mentee = data.mentees[req.params.menteeId];
  if (!mentee || mentee.mentorId !== req.userId) {
    res.status(403).json({ error: 'This mentee is not assigned to you.' });
    return null;
  }
  return mentee;
}

// ---- Goals: mentor views a mentee's semester-by-semester goals and can
// comment on each category (text/status/progress stay the mentee's own) ----
app.get('/api/mentor/goals/:menteeId', mentorAuth, (req, res) => {
  if (!requireOwnMentee(req, res)) return;
  const list = (data.goalsStore[req.params.menteeId] || []).slice().sort((a, b) => b.semester - a.semester);
  res.json(list);
});
app.put('/api/mentor/goals/:menteeId/:goalId/comment', mentorAuth, (req, res) => {
  if (!requireOwnMentee(req, res)) return;
  const entry = (data.goalsStore[req.params.menteeId] || []).find((g) => g.id === req.params.goalId);
  if (!entry) return res.status(404).json({ error: 'Goal entry not found.' });
  const { category, comment } = req.body || {};
  if (!['academic', 'personal', 'professional'].includes(category)) {
    return res.status(400).json({ error: 'category must be academic, personal, or professional.' });
  }
  entry[category].mentorComment = comment || '';
  entry.updatedAt = new Date().toISOString();
  res.json({ ok: true, entry });
});

// ---- Self-validation: mentor reads a mentee's snapshot and writes the
// parallel feedback (on a page separate from Goals) ----
app.get('/api/mentor/self-validation/:menteeId', mentorAuth, (req, res) => {
  if (!requireOwnMentee(req, res)) return;
  res.json(data.selfValidationStore[req.params.menteeId] || data.blankSelfValidation());
});
app.put('/api/mentor/self-validation/:menteeId/feedback', mentorAuth, (req, res) => {
  if (!requireOwnMentee(req, res)) return;
  const existing = data.selfValidationStore[req.params.menteeId] || data.blankSelfValidation();
  const { strengths, improve, continueDoing, stopDoing } = req.body || {};
  existing.mentorFeedback = {
    strengths: strengths ?? existing.mentorFeedback.strengths,
    improve: improve ?? existing.mentorFeedback.improve,
    continueDoing: continueDoing ?? existing.mentorFeedback.continueDoing,
    stopDoing: stopDoing ?? existing.mentorFeedback.stopDoing,
    updatedAt: new Date().toISOString()
  };
  data.selfValidationStore[req.params.menteeId] = existing;
  res.json({ ok: true, record: existing });
});

// =============================================================
// COORDINATOR ROUTES
// =============================================================
const coordinatorAuth = auth('coordinator');

function sessionsThisMonthFor(mentorId, menteeId) {
  return data.sessions.filter(
    (s) =>
      s.mentorId === mentorId &&
      (menteeId ? s.menteeId === menteeId : true) &&
      s.status === 'completed' &&
      s.date.startsWith('2026-07')
  ).length;
}
function avgFeedbackForMentor(mentorId) {
  const entries = data.feedbackHistory.filter((f) => f.mentorId === mentorId);
  if (!entries.length) return null;
  const vals = entries.map((e) => e.ratings.overall).filter((v) => typeof v === 'number');
  return vals.length ? Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)) : null;
}
function mentorOverviewRow(mentor) {
  const myMentees = data.menteesOfMentor(mentor.id);
  const sessionsThisMonth = data.sessions.filter(
    (s) => s.mentorId === mentor.id && s.status === 'completed' && s.date.startsWith('2026-07')
  ).length;
  return {
    id: mentor.id,
    name: mentor.name,
    designation: mentor.designation,
    menteeCount: myMentees.length,
    capacity: mentor.totalSlots,
    sessionsThisMonth,
    avgFeedback: avgFeedbackForMentor(mentor.id),
    compliant: myMentees.every((m) => sessionsThisMonthFor(mentor.id, m.id) > 0) || myMentees.length === 0,
    mentees: myMentees.map((m) => ({ id: m.id, name: m.name }))
  };
}

app.get('/api/coordinator/dashboard', coordinatorAuth, (req, res) => {
  const mentorList = Object.values(data.mentors);
  const overview = mentorList.map(mentorOverviewRow);
  const totalMentees = Object.keys(data.mentees).length;
  const sessionsThisMonth = overview.reduce((sum, m) => sum + m.sessionsThisMonth, 0);
  let unmetPairs = 0;
  mentorList.forEach((mentor) => {
    data.menteesOfMentor(mentor.id).forEach((mentee) => {
      if (sessionsThisMonthFor(mentor.id, mentee.id) === 0) unmetPairs += 1;
    });
  });
  res.json({
    coordinator: data.coordinators[req.userId],
    stats: { mentorsCount: mentorList.length, totalMentees, sessionsThisMonth, unmetPairs },
    mentorOverview: overview
  });
});

app.get('/api/coordinator/mentors', coordinatorAuth, (req, res) => {
  res.json(Object.values(data.mentors).map((m) => ({ ...m, overview: mentorOverviewRow(m) })));
});

app.get('/api/coordinator/mentees/unassigned', coordinatorAuth, (req, res) => {
  res.json(data.unassignedMentees());
});

app.post('/api/coordinator/assign', coordinatorAuth, (req, res) => {
  const { menteeId, mentorId } = req.body || {};
  const mentee = data.mentees[menteeId];
  const mentor = data.mentors[mentorId];
  if (!mentee || !mentor) return res.status(404).json({ error: 'Mentee or mentor not found.' });
  if (data.openSlotsForMentor(mentorId) <= 0) {
    return res.status(400).json({ error: `${mentor.name} is already at the 20-mentee capacity.` });
  }
  mentee.mentorId = mentorId;
  // clean up any pending requests this mentee had, now that they're placed directly
  data.mentorRequests.forEach((r) => {
    if (r.menteeId === menteeId && r.status === 'pending') r.status = 'accepted';
  });
  res.json({ ok: true, message: `${mentee.name} has been assigned to ${mentor.name}.` });
});

app.get('/api/coordinator/classes', coordinatorAuth, (req, res) => {
  // Groups every mentee by "programme · semester" as a stand-in for a class roster
  const groups = {};
  Object.values(data.mentees).forEach((m) => {
    const key = `${m.programme} — Sem ${m.semester}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(m.id);
  });
  res.json(Object.entries(groups).map(([className, menteeIds]) => ({ className, menteeIds, count: menteeIds.length })));
});

app.post('/api/coordinator/dynamic-split', coordinatorAuth, (req, res) => {
  const { menteeIds, mentorIds } = req.body || {};
  if (!Array.isArray(menteeIds) || !menteeIds.length || !Array.isArray(mentorIds) || !mentorIds.length) {
    return res.status(400).json({ error: 'Pick at least one mentee and one mentor.' });
  }
  const assignment = {};
  mentorIds.forEach((id) => (assignment[id] = []));
  menteeIds.forEach((menteeId, i) => {
    const mentorId = mentorIds[i % mentorIds.length];
    assignment[mentorId].push(menteeId);
  });
  // apply
  Object.entries(assignment).forEach(([mentorId, ids]) => {
    ids.forEach((menteeId) => {
      if (data.mentees[menteeId]) data.mentees[menteeId].mentorId = mentorId;
    });
  });
  const summary = Object.entries(assignment).map(([mentorId, ids]) => ({
    mentorId,
    mentorName: data.mentors[mentorId]?.name,
    menteeNames: ids.map((id) => data.mentees[id]?.name)
  }));
  res.json({ ok: true, summary });
});

app.get('/api/coordinator/connect-mode', coordinatorAuth, (req, res) => {
  res.json({ enabled: data.settings.connectModeEnabled });
});
app.put('/api/coordinator/connect-mode', coordinatorAuth, (req, res) => {
  data.settings.connectModeEnabled = !!(req.body || {}).enabled;
  res.json({ ok: true, enabled: data.settings.connectModeEnabled });
});

app.get('/api/coordinator/open-requests', coordinatorAuth, (req, res) => {
  const open = data.mentorRequests
    .filter((r) => r.status === 'pending')
    .map((r) => ({
      ...r,
      menteeName: data.mentees[r.menteeId]?.name,
      mentorName: data.mentors[r.mentorId]?.name
    }));
  res.json(open);
});

app.get('/api/coordinator/notifications', coordinatorAuth, (req, res) => {
  const notifications = [];
  Object.values(data.mentors).forEach((mentor) => {
    data.menteesOfMentor(mentor.id).forEach((mentee) => {
      const count = sessionsThisMonthFor(mentor.id, mentee.id);
      if (count === 0) {
        notifications.push({
          type: 'unmet', title: `${mentor.name} · ${mentee.name}`,
          detail: 'No sessions logged this month.', date: 'This month'
        });
      }
    });
  });
  Object.values(data.mentees).forEach((mentee) => {
    if (mentee.status === 'At risk') {
      notifications.push({
        type: 'at-risk', title: mentee.name,
        detail: `${mentee.attendance}% attendance — flagged as at risk.`, date: 'Ongoing'
      });
    }
  });
  data.feedbackHistory.slice(-5).reverse().forEach((f) => {
    notifications.push({
      type: 'feedback', title: `${data.mentees[f.menteeId]?.name} → ${data.mentors[f.mentorId]?.name}`,
      detail: f.comment || 'New feedback submitted.', date: (f.date || '').slice(0, 10)
    });
  });
  res.json(notifications);
});

app.get('/api/coordinator/hod-notices', coordinatorAuth, (req, res) => {
  res.json(
    data.hodNotices.filter(
      (n) => n.recipients.includes('coordinator') || n.recipients.includes(`coordinator:${req.userId}`)
    )
  );
});

app.get('/api/coordinator/remarks', coordinatorAuth, (req, res) => {
  const { mentorId, menteeId } = req.query;
  if (!mentorId || !menteeId) return res.status(400).json({ error: 'mentorId and menteeId are required.' });
  const key = `${mentorId}|${menteeId}`;
  const history = (data.remarksHistory[key] || []).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json(history);
});

app.get('/api/coordinator/feedback', coordinatorAuth, (req, res) => {
  const perMentor = Object.values(data.mentors).map((mentor) => {
    const entries = data.feedbackHistory
      .filter((f) => f.mentorId === mentor.id)
      .map((f) => ({ ...f, menteeName: data.mentees[f.menteeId]?.name }));
    const keys = ['availability', 'communication', 'guidance', 'overall'];
    const avgs = {};
    keys.forEach((k) => {
      const vals = entries.map((e) => e.ratings[k]).filter((v) => typeof v === 'number');
      avgs[k] = vals.length ? Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)) : null;
    });
    return {
      mentorId: mentor.id, mentorName: mentor.name, avgs, entries,
      coordinatorFeedback: data.coordinatorFeedback[mentor.id] || null
    };
  });
  res.json(perMentor);
});

app.post('/api/coordinator/feedback', coordinatorAuth, (req, res) => {
  const { mentorId, stars, comment } = req.body || {};
  const mentor = data.mentors[mentorId];
  if (!mentor) return res.status(404).json({ error: 'Mentor not found.' });
  const coordinator = data.coordinators[req.userId];
  data.coordinatorFeedback[mentorId] = {
    coordinatorName: coordinator.name,
    stars: Number(stars) || 5,
    comment: comment || ''
  };
  res.json({ ok: true });
});

app.get('/api/coordinator/reports', coordinatorAuth, (req, res) => {
  const overview = Object.values(data.mentors).map(mentorOverviewRow);
  const compliance = [];
  Object.values(data.mentors).forEach((mentor) => {
    data.menteesOfMentor(mentor.id).forEach((mentee) => {
      const count = sessionsThisMonthFor(mentor.id, mentee.id);
      compliance.push({
        mentorName: mentor.name, menteeName: mentee.name,
        sessionsThisMonth: count, met: count > 0
      });
    });
  });
  const totalCompleted = data.sessions.filter((s) => s.status === 'completed').length;
  const totalPending = data.sessions.filter((s) => s.status === 'pending' || s.status === 'confirmed').length;
  res.json({ overview, compliance, donut: { completed: totalCompleted, pending: totalPending } });
});

// =============================================================
// HOD ROUTES
// =============================================================
const hodAuth = auth('hod');

app.get('/api/hod/dashboard', hodAuth, (req, res) => {
  const hod = data.hods[req.userId];
  const mentorList = Object.values(data.mentors).filter((m) => m.department === hod.department);
  const totalMentees = Object.keys(data.mentees).length;
  const allocated = Object.values(data.mentees).filter((m) => m.mentorId).length;
  const awaitingApproval = data.criticalIssues.filter((i) => i.status === 'Open').length + data.mentorRequests.filter((r) => r.status === 'pending').length;
  res.json({
    hod,
    stats: {
      departmentMentees: totalMentees,
      mentors: mentorList.length,
      allocatedStudents: allocated,
      awaitingApproval
    }
  });
});

app.get('/api/hod/departments', hodAuth, (req, res) => {
  const depts = [];
  data.facultyStore.forEach((f) => {
    if (!depts.includes(f.department)) depts.push(f.department);
  });
  res.json(depts);
});

app.get('/api/hod/faculty', hodAuth, (req, res) => {
  const dept = req.query.department;
  const list = dept ? data.facultyStore.filter((f) => f.department === dept) : data.facultyStore;
  res.json(
    list.map((f) => {
      const mentorRecord = data.mentorRecordForFaculty(f.employeeId);
      return {
        ...f,
        isMentor: !!mentorRecord,
        mentorId: mentorRecord ? mentorRecord.id : null,
        menteeCount: mentorRecord ? data.menteesOfMentor(mentorRecord.id).length : 0
      };
    })
  );
});

app.post('/api/hod/assign-mentor', hodAuth, (req, res) => {
  const { facultyId } = req.body || {};
  const faculty = data.facultyStore.find((f) => f.id === facultyId);
  if (!faculty) return res.status(404).json({ error: 'Faculty member not found.' });
  if (data.mentorRecordForFaculty(faculty.employeeId)) {
    return res.status(400).json({ error: `${faculty.name} is already a mentor.` });
  }
  const assignment = data.coordinatorAssignments[faculty.department];
  const coordinatorName = assignment
    ? data.facultyStore.find((f) => f.id === assignment.facultyId)?.name || '—'
    : '—';
  const mentorId = data.nextId('MEN');
  data.mentors[mentorId] = {
    id: mentorId,
    name: faculty.name,
    employeeId: faculty.employeeId,
    designation: faculty.designation,
    department: faculty.department,
    qualification: faculty.qualification,
    tags: faculty.tags,
    experienceYears: faculty.experienceYears,
    papers: faculty.papers,
    totalSlots: 20,
    coordinator: coordinatorName
  };
  // create a login so they can actually sign in to the Mentor app
  let cred = data.credentials.find((c) => c.role === 'mentor' && c.identifier === faculty.employeeId);
  if (!cred) {
    cred = { role: 'mentor', identifier: faculty.employeeId, password: 'mentor123', id: mentorId };
    data.credentials.push(cred);
  } else {
    cred.id = mentorId;
  }
  res.json({
    ok: true,
    mentor: data.mentors[mentorId],
    message: `${faculty.name} is now a mentor. They can sign in to the Mentor app with Employee ID ${faculty.employeeId} and password "mentor123".`
  });
});

app.post('/api/hod/remove-mentor', hodAuth, (req, res) => {
  const { mentorId } = req.body || {};
  const mentor = data.mentors[mentorId];
  if (!mentor) return res.status(404).json({ error: 'Mentor not found.' });
  const menteeCount = data.menteesOfMentor(mentorId).length;
  if (menteeCount > 0) {
    return res.status(400).json({ error: `${mentor.name} still has ${menteeCount} mentee(s) assigned. Unpair them first from Mentee Allocation.` });
  }
  delete data.mentors[mentorId];
  const credIndex = data.credentials.findIndex((c) => c.role === 'mentor' && c.id === mentorId);
  if (credIndex !== -1) data.credentials.splice(credIndex, 1);
  res.json({ ok: true, message: `${mentor.name} is no longer a mentor.` });
});

app.get('/api/hod/coordinator-assignment', hodAuth, (req, res) => {
  const dept = req.query.department;
  const assignment = data.coordinatorAssignments[dept];
  if (!assignment) return res.json(null);
  const faculty = data.facultyStore.find((f) => f.id === assignment.facultyId);
  res.json({ ...assignment, faculty });
});

app.post('/api/hod/assign-coordinator', hodAuth, (req, res) => {
  const { department, facultyId, courseType } = req.body || {};
  const faculty = data.facultyStore.find((f) => f.id === facultyId && f.department === department);
  if (!faculty) return res.status(404).json({ error: 'Pick a faculty member from that department.' });
  data.coordinatorAssignments[department] = { facultyId, courseType: courseType || 'UG' };
  // if this faculty member also happens to be the live Coordinator account, keep their name/department in sync
  const coordAccount = Object.values(data.coordinators).find((c) => c.employeeId === faculty.employeeId);
  if (coordAccount) coordAccount.department = department;
  res.json({ ok: true, message: `${faculty.name} is now the ${courseType || 'UG'} coordinator for ${department}.` });
});

app.get('/api/hod/allocation', hodAuth, (req, res) => {
  const overview = Object.values(data.mentors).map((mentor) => ({
    id: mentor.id,
    name: mentor.name,
    capacity: mentor.totalSlots,
    assigned: data.menteesOfMentor(mentor.id).length,
    openSlots: data.openSlotsForMentor(mentor.id),
    mentees: data.menteesOfMentor(mentor.id).map((m) => ({ id: m.id, name: m.name, status: m.status }))
  }));
  res.json({ overview, unassigned: data.unassignedMentees() });
});

app.post('/api/hod/pairings/:menteeId/decline', hodAuth, (req, res) => {
  const mentee = data.mentees[req.params.menteeId];
  if (!mentee) return res.status(404).json({ error: 'Mentee not found.' });
  const previousMentorId = mentee.mentorId;
  const previousMentor = previousMentorId ? data.mentors[previousMentorId]?.name : null;
  mentee.mentorId = null;
  let cancelledCount = 0;
  if (previousMentorId) cancelledCount = data.cancelActiveSessionsBetween(previousMentorId, mentee.id);
  const suffix = cancelledCount ? ` ${cancelledCount} pending/confirmed session(s) with them were cancelled too.` : '';
  res.json({
    ok: true,
    message: previousMentor ? `${mentee.name} has been unpaired from ${previousMentor}.${suffix}` : `${mentee.name} had no mentor to unpair.`
  });
});
app.post('/api/hod/pairings/:menteeId/accept', hodAuth, (req, res) => {
  const mentee = data.mentees[req.params.menteeId];
  if (!mentee) return res.status(404).json({ error: 'Mentee not found.' });
  res.json({ ok: true, message: `Pairing for ${mentee.name} confirmed.` });
});

app.get('/api/hod/capacity', hodAuth, (req, res) => {
  const rows = Object.values(data.mentors).map((mentor) => {
    const assigned = data.menteesOfMentor(mentor.id).length;
    return {
      name: mentor.name, capacity: mentor.totalSlots, assigned,
      openSlots: mentor.totalSlots - assigned,
      compliant: assigned <= mentor.totalSlots
    };
  });
  res.json(rows);
});

app.get('/api/hod/compliance', hodAuth, (req, res) => {
  const rows = [];
  Object.values(data.mentors).forEach((mentor) => {
    data.menteesOfMentor(mentor.id).forEach((mentee) => {
      const count = data.sessions.filter(
        (s) => s.mentorId === mentor.id && s.menteeId === mentee.id && s.status === 'completed' && s.date.startsWith('2026-07')
      ).length;
      rows.push({ mentorName: mentor.name, menteeName: mentee.name, sessionsThisMonth: count, met: count > 0 });
    });
  });
  const compliantPct = rows.length ? Math.round((rows.filter((r) => r.met).length / rows.length) * 100) : 100;
  res.json({ rows, compliantPct });
});

app.get('/api/hod/remarks', hodAuth, (req, res) => {
  const { mentorId, menteeId } = req.query;
  if (!mentorId || !menteeId) return res.status(400).json({ error: 'mentorId and menteeId are required.' });
  const key = `${mentorId}|${menteeId}`;
  const history = (data.remarksHistory[key] || []).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json(history);
});

app.get('/api/hod/critical-issues', hodAuth, (req, res) => {
  res.json(
    data.criticalIssues.map((i) => ({
      ...i,
      mentorName: data.mentors[i.mentorId]?.name,
      menteeName: data.mentees[i.menteeId]?.name
    }))
  );
});

app.get('/api/hod/mentors-list', hodAuth, (req, res) => res.json(Object.values(data.mentors)));
app.get('/api/hod/mentees-list', hodAuth, (req, res) => res.json(Object.values(data.mentees)));
app.get('/api/hod/coordinators-list', hodAuth, (req, res) => res.json(Object.values(data.coordinators)));

app.post('/api/hod/notify', hodAuth, (req, res) => {
  const hod = data.hods[req.userId];
  const { all, mentorId, menteeId, coordinatorId, message } = req.body || {};
  if (!message || !message.trim()) return res.status(400).json({ error: 'Write a message before sending.' });

  let recipients = [];
  const labels = [];
  if (all) {
    recipients = ['mentee-group', 'mentor', 'coordinator'];
    labels.push('Everyone — all mentors, mentees & coordinators');
  } else {
    if (mentorId) {
      const mentor = data.mentors[mentorId];
      if (!mentor) return res.status(404).json({ error: 'Mentor not found.' });
      recipients.push(`mentor:${mentorId}`);
      labels.push(`Mentor — ${mentor.name}`);
    }
    if (menteeId) {
      const mentee = data.mentees[menteeId];
      if (!mentee) return res.status(404).json({ error: 'Mentee not found.' });
      recipients.push(`mentee:${menteeId}`);
      labels.push(`Mentee — ${mentee.name}`);
    }
    if (coordinatorId) {
      const coordinator = data.coordinators[coordinatorId];
      if (!coordinator) return res.status(404).json({ error: 'Coordinator not found.' });
      recipients.push(`coordinator:${coordinatorId}`);
      labels.push(`Coordinator — ${coordinator.name}`);
    }
  }
  if (!recipients.length) return res.status(400).json({ error: 'Select at least one recipient.' });

  const notice = {
    id: data.nextId('HOD'),
    title: 'HOD Notice',
    message: message.trim(),
    from: `${hod.name} · HOD`,
    date: new Date().toISOString().slice(0, 10),
    recipients
  };
  data.hodNotices.push(notice);
  res.json({ ok: true, message: `Notice sent to: ${labels.join('; ')}.` });
});

app.post('/api/hod/department-notice', hodAuth, (req, res) => {
  const hod = data.hods[req.userId];
  const { message } = req.body || {};
  if (!message || !message.trim()) return res.status(400).json({ error: 'Write the departmental notice before publishing.' });
  const notice = {
    id: data.nextId('HOD'),
    title: 'Departmental Notice',
    message: message.trim(),
    from: `${hod.name} · HOD`,
    date: new Date().toISOString().slice(0, 10),
    recipients: ['mentee-group', 'mentor', 'coordinator']
  };
  data.hodNotices.push(notice);
  res.json({ ok: true, message: 'Notice published to the department.' });
});

app.get('/api/hod/peer-mentoring', hodAuth, (req, res) => {
  // Informational only — this program isn't backed by the academic mentor/
  // mentee data model, so these figures are illustrative, not computed.
  res.json({
    trainedPeerMentors: 12,
    peerGroups: 4,
    trainingCompletePct: 100,
    principle:
      'Peer mentoring complements the faculty mentoring system. Peer mentors are formally trained before being paired with junior students, and always operate alongside — not instead of — a faculty mentor.'
  });
});

// SPA fallback — must be last so it never shadows an /api/* route above.
// Any other GET (e.g. /mentee/dashboard on a hard refresh) gets the React
// shell, and React Router takes over from there client-side.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`MentorOne backend running at http://localhost:${PORT}`);
  console.log(`  Mentee app: http://localhost:${PORT}/mentee/`);
  console.log(`  Mentor app: http://localhost:${PORT}/mentor/`);
});
