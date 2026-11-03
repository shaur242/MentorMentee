# MentorOne — Mentee + Mentor + Coordinator + HOD

A complete, four-role mentoring platform, rebuilt as a **React frontend +
Node.js/Express backend**. Four fully separate apps — Mentee, Mentor,
Coordinator, HOD — each with its own dedicated login page, sharing one
backend and one synthetic in-memory "database." They are genuinely
connected: an action in one app (a session request, an unpairing, a
notice) is visible in the others immediately, not simulated separately
per app.

**Every app has its own dedicated login page and its own login route. None
of them share a login form, a login endpoint, or a role picker:**

| App | Login route | Logs in with |
|---|---|---|
| Mentee | `POST /api/auth/mentee-login` | Register Number + password |
| Mentor | `POST /api/auth/mentor-login` | Employee ID + password |
| Coordinator | `POST /api/auth/coordinator-login` | Employee ID + password |
| HOD | `POST /api/auth/hod-login` | Employee ID + password |

## Goals and Self Validation (newest)

- **Mentee: My Goals.** Academic, personal and professional goals, each
  with a status (Not started / In progress / Achieved / Not achieved) and a
  0-100% progress slider. Goals are stored **per semester** - saving for a
  new semester creates a new entry and earlier semesters are kept (shown
  under "Previous semesters"), while re-saving the same semester updates
  it in place. The mentee can never edit the mentor's comments.
- **Mentor: Mentee Goals.** Pick a mentee, see their goals semester by
  semester with status and progress, and leave a comment on each category.
  Comments appear on the mentee's My Goals page.
- **Mentee: Self Validation.** Four reflective fields: "My strengths are",
  "I would like to improve upon", "I would like to continue doing", "I
  would like to stop doing". Below it, the mentee sees their mentor's
  response once given.
- **Mentor: Mentor Feedback** (a separate page from Mentee Goals). Shows the
  mentee's self-validation and four matching fields: "I noticed your
  strength in", "In my view you can improve in", "Keep continuing", "What
  can be discontinued".
- Access control: a mentor can only read or comment on goals and
  self-validations of mentees assigned to them (anyone else gets 403).
- New endpoints: `GET/POST /api/mentee/goals`, `GET/PUT
  /api/mentee/self-validation`, `GET /api/mentor/goals/:menteeId`, `PUT
  /api/mentor/goals/:menteeId/:goalId/comment`, `GET
  /api/mentor/self-validation/:menteeId`, `PUT
  /api/mentor/self-validation/:menteeId/feedback`.
- Self-validation is a single current snapshot per mentee (not versioned by
  semester, unlike goals) - an easy change if you want history there too.

## Latest round of changes

- **Session booking now uses a real constrained calendar.** Both the
  Mentee's Book Session page and the Mentor's reschedule flow use a date
  field that blocks past dates and anything more than 30 days out — this
  is enforced both in the UI (`min`/`max` on the picker) and again on the
  backend (`isWithinBookingWindow`), so it can't be bypassed. The Mentor's
  reschedule flow previously had a hardcoded date bug — fixed as part of
  this.
- **OTP verification now records real attendance data.** Confirming an
  OTP sets the session to `completed` and stamps `attendanceConfirmedAt`;
  every dashboard's "sessions this month" / "total sessions" counts are
  computed from completed sessions, so attendance is reflected everywhere
  automatically — no separate tracking needed.
- **Group Meet mentee selection is grouped by class** (e.g. `3MDS`), with
  one-click "select this class" buttons alongside individual checkboxes.
- **Remarks are now a persistent, append-only history**, not a single
  overwritable transcript/Q&A pair. A mentor can submit using a
  transcript, Q&A cells, or both per submission — every submission for a
  mentor-mentee pair is kept for the whole semester, viewable by the
  mentor (with full history), the Coordinator, and the HOD (read-only).
- **Critical Issues: Edit/Delete instead of just a status badge.** A
  mentor can now edit or delete their own submitted escalations.
- **Feedback page removed from the Mentor app** entirely, so mentee
  feedback can be honest without it visibly shaping the mentor's own view
  of the relationship — Coordinators can still see and act on it.
- **All emoji removed across all four apps** for a more professional
  look. The plain star character used for rating displays was kept (it's
  a standard rating convention, not decorative emoji).

## Architecture

- **Backend**: Node.js + Express (`backend/`). All routes, all synthetic
  data, all business logic. Unchanged in behavior from the previous
  version of this project — only the frontend was rebuilt.
- **Frontend**: React 18 + React Router 6, built with Vite (`frontend/`).
  One Vite project, one build, but organized as **four independent route
  trees** (`/mentee/*`, `/mentor/*`, `/coordinator/*`, `/hod/*`), each with
  its own login component, its own auth state (a separate token in
  `localStorage` per role — `mentee_token`, `mentor_token`, etc.), and its
  own set of pages. They only share generic, non-role-specific building
  blocks: presentational components (`Card`, `Badge`, `SlotGrid`, …), the
  page shell (`AppShell`), and the `LoginPage` layout — never any actual
  login logic or state between roles.
- The backend serves the built React app as static files and falls back to
  `index.html` for any unmatched route (so a hard refresh on, say,
  `/mentor/session-requests` still works) — but every route under `/api/*`
  is matched first, so the fallback never shadows the API.

## Running it

Requires Node.js 18+.

```bash
# 1. Build the frontend
cd frontend
npm install
npm run build

# 2. Run the backend (serves the build + the API)
cd ../backend
npm install
npm start
```

Then open **http://localhost:4000** — the root page is a simple landing
screen with links to all four apps:

- **Mentee app:** http://localhost:4000/mentee/
- **Mentor app:** http://localhost:4000/mentor/
- **Coordinator app:** http://localhost:4000/coordinator/
- **HOD app:** http://localhost:4000/hod/

### Developing the frontend with hot reload

```bash
cd frontend
npm run dev
```

This runs a Vite dev server (default `http://localhost:5173`) that proxies
`/api/*` to `http://localhost:4000` (see `vite.config.js`) — run the
backend separately alongside it. For anything other than active frontend
development, the built-and-served setup above (`npm run build` +
`npm start`) is simpler: one process, one port.

## Demo logins (every role)

| App | Login ID | Password | Who |
|---|---|---|---|
| Mentee | `2548021` | `mentee123` | Jasmine A — already has a mentor (Dr. Ramesh Kumar) |
| Mentee | `2548035` | `mentee123` | Sanjay K — unassigned, has a pending request to Dr. Ramesh Kumar |
| Mentee | `2548041` | `mentee123` | Akhil Thomas — unassigned |
| Mentee | `2548052` | `mentee123` | Sandra Joseph — unassigned |
| Mentor | `EMP2010` | `mentor123` | Dr. Ramesh Kumar |
| Mentor | `EMP2011` | `mentor123` | Dr. Sunita Pillai |
| Mentor | `EMP2012` | `mentor123` | Mr. Arun Joseph |
| Coordinator | `EMP2001` | `coord123` | Dr. Meena S — Data Science |
| HOD | `EMP1001` | `hod123` | Dr. Helen Mathew — HOD, Data Science |

Nothing is shown in the UI — these are only here so you can test the
system; the credentials live in `backend/data.js` ("stored in the
background," per the original requirement).

### A good way to see all four apps connect live

Open all four in separate tabs:

1. **HOD sets the department up first.** In the HOD app → "Assign
   Coordinator & Mentors," assign a coordinator for a department, then
   click "Make Mentor" next to a faculty member — they instantly get a
   real mentor profile and a working Mentor-app login (shown in the
   response, e.g. `EMP2020` / `mentor123`).
2. **Mentee → Mentor pairing.** Log in as Sanjay K (`2548035`, unassigned)
   — Find Mentor shows the browse list. In the Mentor app, Dr. Ramesh
   Kumar's Home page already shows a pending "Mentee Requests" entry for
   Sanjay K. Accept it, then refresh Sanjay's Mentee dashboard — he now
   has a mentor instead of a browse list.
3. **HOD unpairs a mentee.** HOD app → Mentee Allocation → "Decline /
   Unpair" on Jasmine A under Dr. Ramesh Kumar. Her Mentee dashboard loses
   its mentor, and any pending/confirmed sessions between that exact pair
   are automatically cancelled (not silently left dangling on the
   mentor's side).
4. **Mentor-initiated request, visible to the mentee.** As a mentor, Find
   Mentees → send a request to an unassigned mentee. Log in as that
   mentee — Find Mentor now shows a "Mentors who want to mentor you" card
   with Accept/Decline.
5. **Coordinator switches off direct requests.** Coordinator app → Assign
   Mentees → "Mentor ⇄ Mentee connect" → toggle off. An unassigned
   mentee's Find Mentor page now shows a notice and disables Request
   buttons.
6. **Session request → OTP → feedback**, all cross-app: book a session as
   a mentee, accept it as the mentor, generate an OTP as the mentor, enter
   it as the mentee, then submit feedback as the mentee and watch it
   appear on the mentor's Feedback page — and a coordinator's own rating
   of a mentor shows up there too.
7. **HOD sends a precisely targeted notice** (Critical Issues → Notify):
   pick just "Mentee" + a specific name (not "Notify All") — only that
   mentee sees it in their HOD Notices, no one else does.

## Project structure

```
mentorone-app/
├── backend/
│   ├── server.js       All routes: /api/auth/*, /api/mentee/*, /api/mentor/*,
│   │                  /api/coordinator/*, /api/hod/*, plus static + SPA fallback
│   ├── data.js          Synthetic in-memory "database" shared by all four apps
│   └── package.json
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    ├── dist/             Production build (served by the backend)
    └── src/
        ├── main.jsx        Entry point
        ├── App.jsx          Top-level router: landing page + 4 role route trees
        ├── api/client.js    Per-role fetch client factory (own token, own storage key)
        ├── components/      Shared, role-agnostic UI: AppShell, LoginPage, ui.jsx
        ├── styles/global.css  One stylesheet; --accent swaps per role via [data-role]
        ├── mentee/          MenteeRoot.jsx + pages/ (Dashboard, FindMentor, BookSession, Otp, HodNotices, Feedback)
        ├── mentor/          MentorRoot.jsx + pages/ (Home, MyMentees, FindMentees, SessionRequests, GroupMeet, OtpAttendance, Remarks, CriticalIssue, HodNotices, Feedback, Profile)
        ├── coordinator/     CoordinatorRoot.jsx + pages/ (Dashboard, MyMentors, AssignMentees, Notifications, HodNotices, Remarks, Feedback, Reports)
        └── hod/             HodRoot.jsx + pages/ (Dashboard, AssignCoordinator, Allocation, Capacity, Compliance, Diaries, CriticalIssues, DepartmentNotice, Peer)
```

## API summary

All routes below require `Authorization: Bearer <token>` from the matching
login, and are role-checked (e.g. a mentee token cannot call a
`/api/hod/*` route).

### Auth
| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/api/auth/mentee-login` | `{ registerNo, password }` | `{ token, mentee }` |
| POST | `/api/auth/mentor-login` | `{ employeeId, password }` | `{ token, mentor }` |
| POST | `/api/auth/coordinator-login` | `{ employeeId, password }` | `{ token, coordinator }` |
| POST | `/api/auth/hod-login` | `{ employeeId, password }` | `{ token, hod }` |
| POST | `/api/auth/logout` | — | `{ ok:true }` |

### Mentee (`/api/mentee/*`)
`dashboard` · `mentors` (Find Mentor) · `connect-mode` (GET) ·
`mentor-requests` (GET incoming / POST send) ·
`mentor-requests/:id/respond` (POST accept/decline) · `sessions` (GET /
POST book new) · `sessions/:id/reschedule` (PUT) ·
`slots?date=YYYY-MM-DD` · `otp/verify` (POST) · `otp/status/:sessionId` ·
`hod-notices` · `feedback` (GET / POST)

### Mentor (`/api/mentor/*`)
`dashboard` · `mentees` · `find-mentees` · `connect-mode` (GET) ·
`mentee-requests` (POST) · `mentee-requests/:id/respond` (POST) ·
`sessions` (GET / POST) · `sessions/:id/respond` (POST) ·
`sessions/:id/reschedule` (PUT) · `otp/generate` (POST) ·
`remarks-history/:menteeId` (GET full history / POST append a new
submission — transcript, Q&A cells, or both) · `critical-issues` (GET /
POST / PUT /:id / DELETE /:id) · `group-meets` (POST) · `hod-notices`
(GET) · `profile` (GET / PUT)

Note: the Mentor app has no Feedback page (removed by design), but
`GET /api/mentor/feedback` still exists on the backend if you want to
reintroduce it later.

### Coordinator (`/api/coordinator/*`)
`dashboard` · `mentors` · `mentees/unassigned` · `assign` (POST) ·
`classes` · `dynamic-split` (POST) · `connect-mode` (GET / PUT) ·
`open-requests` · `notifications` · `hod-notices` ·
`remarks?mentorId=&menteeId=` (GET) · `feedback` (GET / POST) · `reports`

### HOD (`/api/hod/*`)
`dashboard` · `departments` · `faculty?department=` · `coordinator-
assignment?department=` · `assign-coordinator` (POST) · `assign-mentor`
(POST) · `remove-mentor` (POST) · `allocation` ·
`pairings/:menteeId/accept|decline` (POST) · `capacity` · `compliance` ·
`remarks?mentorId=&menteeId=` (GET) · `critical-issues` · `mentors-list` /
`mentees-list` / `coordinators-list` · `notify` (POST) ·
`department-notice` (POST) · `peer-mentoring`

## Notes for whoever continues this build

- Auth is intentionally minimal (random in-memory token per login, no
  expiry, no password hashing) — a synthetic demo backend, not production
  auth.
- `data.js` is the entire "database," shared by all four apps' routes.
  Moving to a real one means rewriting the functions/objects in `data.js`
  — `server.js` never touches the storage format directly.
- Only Data Science ships with pre-seeded, already-logged-in Mentor and
  Coordinator accounts. Computer Science and AI & ML exist as departments
  with a full faculty roster — the HOD can promote any of them to mentor
  on the spot (Assign Coordinator & Mentors), but coordinator assignment
  for a new department doesn't yet spin up a live Coordinator-app login
  the way mentor assignment does.
- The slot grid is still a static template regardless of which date is
  picked — wiring real per-date availability is a good next increment.
- Recording in the Mentor's Remarks page is a simple start/stop timer with
  a manually editable transcript box — no real microphone capture.
- The HOD's Peer Mentoring page is intentionally static/illustrative — that
  program isn't backed by the academic mentor/mentee data model here.
- **Frontend-specific**: no global state library (Redux/Zustand/etc.) —
  each role's `*Root.jsx` holds its own auth/dashboard state and passes a
  small `ctx` object down to pages via route `element` props. That's
  deliberately simple for an app this size; if it grows, React Context or
  a small state library per role would be the natural next step. There's
  no automated test suite yet either — everything here was verified by
  hand against the running backend.
