# TherapyConnect Pro — Phase 1: Foundation & Working Platform

> Source of truth: MASTER.md
> Goal: Fully working app with auth, role-based routing, and all core CRUDs.
> Deploy to Vercel at the END of this phase. If hackathon stops here — you still demo.
> Estimated time: ~2 hours

---

## Phase 1 Checklist

- [ ] Next.js 14 project scaffolded with TypeScript
- [ ] Prisma schema created and pushed to Supabase
- [ ] NextAuth configured with PRACTITIONER / CLIENT / ADMIN roles
- [ ] Practitioner dashboard page
- [ ] Appointment scheduling (create, list, cancel)
- [ ] Client portal page
- [ ] Digital intake form
- [ ] Basic progress notes CRUD
- [ ] Basic EHR — patient profile
- [ ] Admin user management page
- [ ] Seed data script working
- [ ] Deployed to Vercel with all env vars set

---

## Features to Build

### 1. Auth + User Roles

**What it does:**
- Email + password login for all roles
- Role stored on User model: PRACTITIONER | CLIENT | ADMIN
- NextAuth session includes role
- Middleware redirects based on role:
  - PRACTITIONER → /dashboard
  - CLIENT → /portal
  - ADMIN → /admin

**Prisma model:** `User` (see MASTER.md schema)

**Pages:**
- `/login` — shared login page, redirects by role after auth
- `/register` — new user registration, role selected on signup

**API routes:**
- `/api/auth/[...nextauth]` — NextAuth handler
- `/api/users` — POST create user (registration)

**NextAuth config requirements:**
```typescript
// lib/auth.ts
// - CredentialsProvider with email + password
// - bcrypt password hashing
// - Include role in JWT token and session
// - Session strategy: "jwt"
// - callbacks: jwt adds role, session exposes role
```

**Middleware requirements:**
```typescript
// middleware.ts
// - Protect /dashboard/* — PRACTITIONER only
// - Protect /portal/* — CLIENT only
// - Protect /admin/* — ADMIN only
// - Redirect unauthenticated to /login
// - Redirect wrong role to their correct home
```

**shadcn components to use:** Card, Input, Button, Form, Label

---

### 2. Practitioner Dashboard

**What it does:**
- Shows today's appointments (sorted by time)
- Shows recent clients (last 5 seen)
- Shows quick stats: total clients, this week's sessions, pending payments
- Placeholder card for AI insights (populated in Phase 2)

**Page:** `/dashboard`

**API routes:**
- `GET /api/appointments?date=today&practitionerId=` — today's appointments
- `GET /api/clients?practitionerId=&limit=5` — recent clients

**Data displayed:**
- Appointment card: client name, time, status badge, "Join Session" button (disabled until Phase 2)
- Client card: name, last seen date, PHQ-9 score badge (Phase 2)
- Stats row: total clients count, sessions this week, revenue this month

**shadcn components:** Card, CardHeader, CardContent, Badge, Avatar, Separator

---

### 3. Online Scheduling

**What it does:**
- Practitioner views calendar with all appointments
- Practitioner creates new appointment for a client
- Client self-books available slots
- Cancel appointment (changes status to CANCELLED)
- Appointment statuses: SCHEDULED, WAITING, IN_SESSION, COMPLETED, CANCELLED, NO_SHOW

**Pages:**
- `/appointments` — calendar + list view
- `/appointments/new` — create appointment form
- `/appointments/[id]` — appointment detail page

**API routes:**
- `GET /api/appointments` — list with filters (practitionerId, clientId, date range, status)
- `POST /api/appointments` — create appointment, auto-generate jitsiRoomUrl
- `PATCH /api/appointments/[id]` — update status, reschedule
- `DELETE /api/appointments/[id]` — cancel

**Jitsi room URL generation (Phase 1 — store it now, use it in Phase 2):**
```typescript
const jitsiRoomUrl = `https://meet.jit.si/therapyconnect-${appointmentId}`;
// Store in DB on creation. Do not render the embed yet — that's Phase 2.
```

**Validation (Zod):**
```typescript
const AppointmentSchema = z.object({
  clientId: z.string().cuid(),
  datetime: z.string().datetime(),
  duration: z.number().min(30).max(120).default(50),
})
```

**shadcn components:** Calendar, Select, Button, Dialog, Badge, Table

---

### 4. Client Portal

**What it does:**
- Client's home screen after login
- Shows upcoming appointments with join button (disabled until Phase 2)
- Shows pending intake form prompt (if not completed)
- Shows pending assessment prompt (if due — Phase 2)
- Shows recent session history

**Page:** `/portal`

**API routes:**
- `GET /api/appointments?clientId=&status=SCHEDULED` — upcoming appointments
- `GET /api/intake/[clientId]` — check if intake complete

**UI sections:**
1. Welcome header with client name
2. Intake form banner (dismisses once completed)
3. Upcoming appointments list
4. Past sessions list

**shadcn components:** Card, Alert, Badge, Button, Separator

---

### 5. Digital Intake Form

**What it does:**
- One-time form filled by client before first session
- Stores answers as JSON in IntakeForm model
- Once submitted, sets `ClientProfile.intakeComplete = true`
- Practitioner can view intake answers on client profile page

**Questions (fixed set):**
1. What brings you to therapy today?
2. Have you been in therapy before? (yes/no + details)
3. Are you currently taking any medications? (yes/no + list)
4. Do you have any current diagnoses we should know about?
5. Emergency contact name and phone number
6. What are your main goals for therapy?
7. Any recent major life events (loss, trauma, transition)?
8. How would you rate your sleep quality? (1-10)
9. How would you rate your stress level? (1-10)
10. Is there anything else you'd like your therapist to know?

**Page:** `/portal/intake`

**API routes:**
- `POST /api/intake` — submit intake form
- `GET /api/intake/[clientId]` — get intake answers (practitioner only)

**Validation:** All fields optional except emergency contact. Mark as complete regardless.

**shadcn components:** Form, Input, Textarea, RadioGroup, Slider, Button, Progress

---

### 6. Progress Notes — Basic CRUD

**What it does:**
- Practitioner creates a note attached to an appointment
- SOAP format fields: Subjective, Objective, Assessment, Plan
- Can be typed manually (Phase 1) or AI-generated (Phase 2)
- Note is linked to appointment and client

**Pages:**
- `/clients/[id]/notes/new` — create note (linked to appointmentId in query param)
- `/clients/[id]/notes/[noteId]` — view / edit note

**API routes:**
- `GET /api/notes?appointmentId=` — get notes for appointment
- `GET /api/notes?clientId=` — get all notes for client
- `POST /api/notes` — create note
- `PATCH /api/notes/[id]` — update note
- `DELETE /api/notes/[id]` — delete note

**Note form fields:**
- Subjective: "What did the client report?" (Textarea)
- Objective: "Observable facts, mental status" (Textarea)
- Assessment: "Clinical impression and diagnosis" (Textarea)
- Plan: "Treatment plan, next steps, homework" (Textarea)
- Raw Transcript: hidden field (populated by AI in Phase 2)
- AI Generated: boolean flag (shown as badge on note card)

**shadcn components:** Textarea, Form, Button, Badge, Separator, Card

---

### 7. Basic EHR — Patient Profile

**What it does:**
- Practitioner views and edits a client's clinical profile
- Separate from user account — this is the clinical record
- Displays on `/clients/[id]` page

**Data fields (ClientProfile model):**
- Date of birth
- Phone number
- Emergency contact
- Primary diagnosis (free text)
- Current medications (free text)
- Treatment history summary (free text)
- Intake form responses (read-only section)
- Assessment score history (placeholder in Phase 1, populated in Phase 2)

**Pages:**
- `/clients` — list of all clients for practitioner
- `/clients/[id]` — full client profile + EHR

**API routes:**
- `GET /api/clients?practitionerId=` — list clients
- `GET /api/clients/[id]` — full client profile
- `PATCH /api/clients/[id]` — update EHR fields

**shadcn components:** Tabs (Profile / Notes / Assessments / Prescriptions), Card, Input, Textarea, Button, Badge, Avatar

---

### 8. User Role Management (Admin)

**What it does:**
- Admin can view all users
- Admin can change a user's role
- Admin can deactivate/reactivate a user
- Simple table view — no complex permissions needed

**Page:** `/admin/users`

**API routes:**
- `GET /api/users` — list all users (admin only)
- `PATCH /api/users/[id]` — update role or status (admin only)

**shadcn components:** Table, TableHeader, TableRow, TableCell, Select, Badge, Button

---

## Seed Data Script

Create `/prisma/seed.ts` with:

```typescript
// Create 1 admin user
// Create 2 practitioners (Dr. Sarah Chen, Dr. James Wilson)
// Create 5 clients (linked to Dr. Sarah Chen)
// Create 10 appointments (mix of past COMPLETED and future SCHEDULED)
// Create 8 progress notes on past appointments
// Create intake forms for all 5 clients
// Create ClientProfile records for all clients with sample diagnosis/medications
```

Run with: `npx prisma db seed`

---

## Phase 1 Codex Prompt

Paste this into Codex to scaffold Phase 1 in one shot:

```
Create a full-stack Next.js 14 App Router application called "TherapyConnect Pro".

STACK:
- Next.js 14 with TypeScript and App Router
- Tailwind CSS + shadcn/ui (install: npx shadcn@latest init)
- Prisma ORM connected to PostgreSQL (Supabase)
- NextAuth.js v5 with CredentialsProvider
- Zod for validation
- bcrypt for password hashing

PRISMA SCHEMA:
Create the following models exactly:
[paste schema from MASTER.md section 5]

PAGES TO CREATE:
1. /login — email/password login, redirects by role
2. /register — signup with role selection
3. /dashboard — practitioner home (today's appts, recent clients, stats)
4. /appointments — list + calendar view
5. /appointments/new — create appointment form
6. /appointments/[id] — appointment detail
7. /clients — practitioner's client list
8. /clients/[id] — client profile with tabs: Profile / Notes / Assessments
9. /clients/[id]/notes/new — create SOAP note form
10. /portal — client home
11. /portal/intake — intake form (10 questions)
12. /admin/users — user management table

API ROUTES TO CREATE:
[paste API routes from MASTER.md section 6 — Phase 1 routes only]

MIDDLEWARE:
- /dashboard/* → PRACTITIONER only
- /portal/* → CLIENT only
- /admin/* → ADMIN only
- Redirect unauthenticated → /login

AUTH CONFIG:
- CredentialsProvider with email + password
- bcrypt password comparison
- Role included in JWT and session
- Session strategy: jwt

SEED SCRIPT:
Create prisma/seed.ts with 1 admin, 2 practitioners, 5 clients,
10 appointments, 8 notes, 5 intake forms, 5 client profiles.

ENV EXAMPLE:
Create .env.example with all variables from MASTER.md section 8.

README:
Include setup steps: npm install, prisma generate, prisma db push, prisma db seed, npm run dev.

IMPORTANT RULES:
- Use shadcn/ui components for all UI
- All API routes validate input with Zod
- All DB queries use Prisma client singleton from lib/prisma.ts
- Role-based access enforced in both middleware and API routes
- No placeholder pages — every page must have real data from DB
- TypeScript strict mode — no 'any' types
```

---

## Definition of Done — Phase 1

Before moving to Phase 2, verify ALL of these:

- [ ] `npm run dev` starts without errors
- [ ] Can register as practitioner, client, and admin
- [ ] Login redirects each role to correct home
- [ ] Practitioner can create, view, and cancel appointments
- [ ] Practitioner can view client list and open client profile
- [ ] Practitioner can create and view SOAP notes
- [ ] Client can login and see their portal with appointments
- [ ] Client can complete intake form
- [ ] Admin can view and update user roles
- [ ] Seed script populates realistic demo data
- [ ] App deployed to Vercel with all env vars configured
- [ ] Vercel deployment URL is live and accessible

---

*Phase 1 of 4 — TherapyConnect Pro Hackathon*
*Next: PHASE2.md — Hero features + AI*
