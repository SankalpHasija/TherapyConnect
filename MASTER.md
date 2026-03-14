# TherapyConnect Pro — Master Source of Truth

> This document is the single source of truth for the entire project.
> Every Codex prompt, every agent, every phase file must align with this.
> Do not deviate from the stack, scope, or decisions recorded here.

---

## 1. Project Overview

| Field | Value |
|---|---|
| App name | TherapyConnect Pro |
| Domain | Healthcare — Telehealth & Mental Health |
| Type | Full-stack CRUD + AI-powered SaaS |
| Target user | Solo & small group therapy practitioners + their clients |
| Hackathon constraint | 8 hours, everything built by AI (Codex) |
| Inspiration | SimplePractice — but smarter with AI |

### Elevator pitch
A HIPAA-aware telehealth practice management platform for therapists.
Practitioners manage appointments, EHR, billing, and clinical notes.
Clients book sessions, complete assessments, and join video calls.
AI writes SOAP notes from voice recordings and surfaces clinical insights from session history.

---

## 2. User Roles

### Practitioner
- Books and manages appointments
- Views and manages all client profiles
- Creates and edits progress notes (SOAP format)
- Views PHQ-9 / GAD-7 scores per client
- Receives AI-generated clinical insights
- Generates AI SOAP notes from session audio
- Views payment history
- Manages prescriptions (Phase 3)
- Views analytics dashboard (Phase 3)

### Client
- Self-books appointments with their practitioner
- Completes digital intake form (once, on first login)
- Completes PHQ-9 / GAD-7 assessments per session
- Joins video sessions via Jitsi embed
- Views their appointments and session history
- Views their prescriptions (Phase 3)
- Logs daily mood (Phase 3)

### Admin
- Manages practitioners and clients
- Views platform-wide analytics
- Manages user roles and access

---

## 3. Confirmed Tech Stack

### Frontend
| Tool | Version | Purpose |
|---|---|---|
| Next.js | 14 (App Router) | Full-stack framework, routing, server components |
| TypeScript | Latest | Type safety — reduces Codex errors |
| Tailwind CSS | 3.x | Utility-first styling |
| shadcn/ui | Latest | Component library — Calendar, Table, Form, Dialog, Card |
| Zod | Latest | Schema validation for all API inputs |

### Backend
| Tool | Version | Purpose |
|---|---|---|
| Next.js API Routes | 14 | REST endpoints — same repo, no separate server |
| NextAuth.js | v5 | Auth + sessions + role-based access |
| Prisma ORM | Latest | Type-safe DB queries, auto-generated types |

### Database & Storage
| Tool | Plan | Purpose |
|---|---|---|
| Supabase | Free tier | Postgres database (500MB, 50K MAU) |
| Supabase Storage | Free tier | File uploads — documents, attachments (Phase 3) |
| Upstash Redis | Free tier | Waiting room state, real-time session status (256MB, 500K cmd/mo) |

### AI Layer
| Tool | Cost | Purpose |
|---|---|---|
| OpenAI Whisper | ~$0.006/min | Voice-to-text transcription |
| GPT-4o-mini | ~$0.15/1M tokens | SOAP note gen, clinical insights, treatment plans |
| Vercel AI SDK | Free | Streaming AI responses, useCompletion hook |

> Set a $5 hard spending limit in OpenAI dashboard before starting.
> Estimated total AI cost for entire hackathon: $1–3.

### Third-Party Services
| Tool | Plan | Purpose |
|---|---|---|
| Stripe | Test mode (free) | Payment processing — no real charges |
| Resend | Free tier (3K emails/mo) | Appointment reminder emails |
| Jitsi Meet | Free, open source | Embedded video calling per appointment |

### Video Architecture (Jitsi)
- Room URL pattern: `https://meet.jit.si/therapyconnect-{appointmentId}`
- No API key required
- Embedded via `@jitsi/react-sdk` or iframe directly in app
- Waiting room UI built custom — Jitsi lobby mode enabled
- Upstash Redis tracks waiting room state (client_waiting, session_active, session_ended)

### DevOps
| Tool | Plan | Purpose |
|---|---|---|
| Vercel | Free tier | Hosting, CI/CD — push to GitHub = live deploy |
| GitHub | Free | Version control, Codex integration |
| Capacitor | Free, open source | WebView mobile wrapper (Phase 4) |

---

## 4. Confirmed Feature Scope

### In Scope (30 features across 4 phases)

#### Phase 1 — Foundation (8 features)
1. Auth + user roles (Practitioner / Client / Admin)
2. Practitioner dashboard
3. Online scheduling (book, view, cancel)
4. Client portal
5. Digital intake forms
6. Progress notes — basic CRUD
7. Basic EHR (patient profile, diagnosis, medication list, treatment history)
8. User role management (admin view)

#### Phase 2 — Hero Features (7 features)
9. HIPAA video — Jitsi embed per appointment
10. Waiting room UI
11. Payment processing — Stripe test mode
12. Appointment reminders — email via Resend
13. Voice-to-text → SOAP note (Whisper + GPT-4o-mini) ← WOW #1
14. PHQ-9 & GAD-7 assessments with auto-scoring
15. AI clinical insights (mood trends, risk flags from note history) ← WOW #2

#### Phase 3 — Bonus Round A (6 features)
16. AI treatment plan generator
17. Prescription management
18. Wellness tracking (client daily mood log + chart)
19. Automated compliance monitoring (missing notes, overdue assessments)
20. Basic analytics dashboard (MRR, session counts, retention)
21. Document management (upload, store, share via Supabase Storage)

#### Phase 4 — Bonus Round B / Heroic (5 features)
22. Voice emotion analysis (tone tracking across sessions)
23. AI therapist matching (intake → best-fit practitioner)
24. Gamified client engagement (streaks, homework tasks)
25. Peer consultation network (anonymised case sharing)
26. Multi-device native app — Capacitor WebView wrapping Next.js

### Out of Scope (permanently excluded)
- Full WebRTC from scratch (use Jitsi instead)
- Insurance billing & claims (Change Healthcare API — too complex)
- Prescription ePrescribing regulation (CRUD only, no DEA integration)
- Group video sessions (multi-party WebRTC — post-hackathon)
- Multi-language / real-time translation
- VR therapy modules
- Blockchain patient data ownership
- Wearable device integration
- Smart home / ambient therapy
- Telehealth kiosk network
- Automated insurance pre-authorization
- Peer support community (needs moderation infra)
- Smart scheduling AI (needs historical data)
- Custom branding / white-label

---

## 5. Data Models (Prisma Schema)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  PRACTITIONER
  CLIENT
  ADMIN
}

enum AppointmentStatus {
  SCHEDULED
  WAITING
  IN_SESSION
  COMPLETED
  CANCELLED
  NO_SHOW
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
}

enum NoteType {
  SOAP
  PROGRESS
  INTAKE
  ASSESSMENT
}

model User {
  id              String        @id @default(cuid())
  name            String
  email           String        @unique
  password        String
  role            Role
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  // Practitioner relations
  clientProfiles  ClientProfile[] @relation("PractitionerClients")
  appointments    Appointment[]   @relation("PractitionerAppointments")
  notes           ProgressNote[]  @relation("PractitionerNotes")

  // Client relations
  clientProfile   ClientProfile?  @relation("ClientUser")
  clientAppts     Appointment[]   @relation("ClientAppointments")
  assessments     Assessment[]
  moodLogs        MoodLog[]
  payments        Payment[]
}

model ClientProfile {
  id               String      @id @default(cuid())
  userId           String      @unique
  practitionerId   String
  dateOfBirth      DateTime?
  phone            String?
  emergencyContact String?
  diagnosis        String?
  medications      String?
  treatmentHistory String?
  intakeComplete   Boolean     @default(false)
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt

  user             User        @relation("ClientUser", fields: [userId], references: [id])
  practitioner     User        @relation("PractitionerClients", fields: [practitionerId], references: [id])
  intakeForms      IntakeForm[]
  prescriptions    Prescription[]
}

model Appointment {
  id               String            @id @default(cuid())
  practitionerId   String
  clientId         String
  datetime         DateTime
  duration         Int               @default(50) // minutes
  status           AppointmentStatus @default(SCHEDULED)
  jitsiRoomUrl     String?
  reminderSent     Boolean           @default(false)
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt

  practitioner     User              @relation("PractitionerAppointments", fields: [practitionerId], references: [id])
  client           User              @relation("ClientAppointments", fields: [clientId], references: [id])
  notes            ProgressNote[]
  assessments      Assessment[]
  payment          Payment?
}

model ProgressNote {
  id               String      @id @default(cuid())
  appointmentId    String
  practitionerId   String
  type             NoteType    @default(SOAP)
  rawTranscript    String?     // voice recording transcript
  subjective       String?     // SOAP - S
  objective        String?     // SOAP - O
  assessment       String?     // SOAP - A
  plan             String?     // SOAP - P
  aiGenerated      Boolean     @default(false)
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt

  appointment      Appointment @relation(fields: [appointmentId], references: [id])
  practitioner     User        @relation("PractitionerNotes", fields: [practitionerId], references: [id])
}

model IntakeForm {
  id               String        @id @default(cuid())
  clientProfileId  String
  answers          Json          // flexible key-value answers
  submittedAt      DateTime      @default(now())

  clientProfile    ClientProfile @relation(fields: [clientProfileId], references: [id])
}

model Assessment {
  id               String      @id @default(cuid())
  clientId         String
  appointmentId    String?
  type             String      // "PHQ9" | "GAD7"
  answers          Json        // array of 0-3 scores per question
  totalScore       Int
  severity         String      // "minimal" | "mild" | "moderate" | "moderately-severe" | "severe"
  createdAt        DateTime    @default(now())

  client           User        @relation(fields: [clientId], references: [id])
  appointment      Appointment? @relation(fields: [appointmentId], references: [id])
}

model Payment {
  id               String        @id @default(cuid())
  clientId         String
  appointmentId    String        @unique
  amount           Int           // in cents
  currency         String        @default("usd")
  stripeSessionId  String?
  status           PaymentStatus @default(PENDING)
  createdAt        DateTime      @default(now())

  client           User          @relation(fields: [clientId], references: [id])
  appointment      Appointment   @relation(fields: [appointmentId], references: [id])
}

model Prescription {
  id               String        @id @default(cuid())
  clientProfileId  String
  medication       String
  dosage           String
  frequency        String
  startDate        DateTime
  endDate          DateTime?
  notes            String?
  active           Boolean       @default(true)
  createdAt        DateTime      @default(now())

  clientProfile    ClientProfile @relation(fields: [clientProfileId], references: [id])
}

model MoodLog {
  id               String      @id @default(cuid())
  clientId         String
  score            Int         // 1-10
  notes            String?
  loggedAt         DateTime    @default(now())

  client           User        @relation(fields: [clientId], references: [id])
}
```

---

## 6. API Endpoint Map

```
/api/auth/[...nextauth]     — NextAuth handler
/api/users                  — GET list, POST create
/api/users/[id]             — GET, PATCH, DELETE

/api/appointments           — GET list, POST create
/api/appointments/[id]      — GET, PATCH, DELETE
/api/appointments/[id]/join — GET jitsi room URL + update status

/api/clients                — GET practitioner's client list
/api/clients/[id]           — GET client profile + EHR
/api/clients/[id]/notes     — GET all notes for client
/api/clients/[id]/insights  — GET AI clinical insights (Phase 2)

/api/notes                  — POST create note
/api/notes/[id]             — GET, PATCH, DELETE

/api/intake                 — POST submit intake form
/api/intake/[clientId]      — GET intake answers

/api/assessments            — POST submit PHQ-9 or GAD-7
/api/assessments/[clientId] — GET assessment history

/api/payments/create-session — POST create Stripe checkout session
/api/payments/webhook        — POST Stripe webhook handler

/api/prescriptions          — GET, POST (Phase 3)
/api/prescriptions/[id]     — PATCH, DELETE (Phase 3)

/api/mood                   — POST log mood entry (Phase 3)
/api/mood/[clientId]        — GET mood history (Phase 3)

/api/documents              — POST upload, GET list (Phase 3)
/api/documents/[id]         — GET download URL, DELETE (Phase 3)

/api/ai/generate-note       — POST: { transcript } → SOAP note (Phase 2)
/api/ai/insights            — POST: { clientId } → clinical summary (Phase 2)
/api/ai/treatment-plan      — POST: { clientId } → treatment plan (Phase 3)
/api/ai/emotion-analysis    — POST: { clientId } → emotion trend (Phase 4)
/api/ai/match-therapist     — POST: { intakeAnswers } → recommended practitioner (Phase 4)

/api/analytics/summary      — GET practice stats (Phase 3)
/api/compliance/alerts      — GET missing notes, overdue assessments (Phase 3)

/api/waiting-room/[appointmentId] — GET/POST waiting room state (Redis)
```

---

## 7. Page & Route Map

```
/                           — Landing page (marketing)
/login                      — Login page (all roles)
/register                   — Register page

-- Practitioner routes (role: PRACTITIONER) --
/dashboard                  — Overview: today's appts, recent clients, AI insights card
/appointments               — Calendar view + list
/appointments/new           — Book new appointment
/appointments/[id]          — Appointment detail + join session button
/clients                    — Client list
/clients/[id]               — Client profile + EHR + note history + assessment scores
/clients/[id]/notes/new     — Create progress note (+ voice recording UI)
/clients/[id]/notes/[noteId] — View/edit note
/billing                    — Payment history + outstanding invoices
/analytics                  — Practice analytics dashboard (Phase 3)
/prescriptions              — Prescription management (Phase 3)

-- Client routes (role: CLIENT) --
/portal                     — Client home: upcoming appts, pending assessments
/portal/book                — Self-booking page
/portal/session/[id]        — Waiting room + Jitsi video embed
/portal/intake              — Intake form (shown once, on first login)
/portal/assessments         — PHQ-9 / GAD-7 forms
/portal/mood                — Daily mood log (Phase 3)
/portal/prescriptions       — View current prescriptions (Phase 3)

-- Admin routes (role: ADMIN) --
/admin                      — Admin dashboard
/admin/users                — Manage all users
/admin/practitioners        — Manage practitioners
```

---

## 8. Environment Variables

```env
# Database
DATABASE_URL=postgresql://...

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

# OpenAI
OPENAI_API_KEY=

# Stripe
STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Resend (email)
RESEND_API_KEY=

# Upstash Redis (waiting room)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_JITSI_DOMAIN=meet.jit.si
```

---

## 9. Folder Structure

```
therapyconnect-pro/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (practitioner)/
│   │   ├── dashboard/page.tsx
│   │   ├── appointments/
│   │   ├── clients/
│   │   ├── billing/page.tsx
│   │   ├── analytics/page.tsx       ← Phase 3
│   │   └── prescriptions/page.tsx   ← Phase 3
│   ├── (client)/
│   │   ├── portal/page.tsx
│   │   ├── portal/book/page.tsx
│   │   ├── portal/session/[id]/page.tsx
│   │   ├── portal/intake/page.tsx
│   │   ├── portal/assessments/page.tsx
│   │   └── portal/mood/page.tsx     ← Phase 3
│   ├── (admin)/
│   │   └── admin/
│   └── api/
│       ├── auth/
│       ├── appointments/
│       ├── clients/
│       ├── notes/
│       ├── assessments/
│       ├── payments/
│       ├── ai/
│       ├── waiting-room/
│       └── analytics/               ← Phase 3
├── components/
│   ├── ui/                          ← shadcn components
│   ├── appointments/
│   ├── notes/
│   ├── assessments/
│   ├── video/                       ← Jitsi embed + waiting room
│   ├── ai/                          ← AI insight cards, note generator
│   └── charts/                      ← Phase 3
├── lib/
│   ├── prisma.ts                    ← Prisma client singleton
│   ├── auth.ts                      ← NextAuth config
│   ├── openai.ts                    ← OpenAI client
│   ├── stripe.ts                    ← Stripe client
│   ├── resend.ts                    ← Email client
│   ├── redis.ts                     ← Upstash Redis client
│   └── validations/                 ← Zod schemas
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                      ← Demo data seeding
├── public/
├── .env.local
├── .env.example
└── README.md
```

---

## 10. Demo Script (for pitch day)

**Total time: 90 seconds**

1. Login as practitioner (10s)
2. Show dashboard — today's appointments + AI insights card (10s)
3. Open client profile — show EHR, PHQ-9 score history chart (10s)
4. Navigate to appointment → click "Start Session" (5s)
5. Show waiting room — client status "waiting" (5s)
6. Show Jitsi video session embedded in app (10s)
7. After session: click "Generate Note" → speak 3 sentences → AI writes full SOAP note live (20s) ← THIS IS THE WOW MOMENT
8. Show AI insights card: "PHQ-9 declining 3 weeks, recommend reassessment" (10s)
9. Show client portal — client books next appointment (10s)

**Closing line:** "This is what SimplePractice would look like if it was built today — with AI at the core, not as an add-on."

---

## 11. Key Decisions Log

| Decision | Choice | Reason |
|---|---|---|
| Video provider | Jitsi Meet (free, open source) | Zoom API restricted on free tier. Jitsi = real WebRTC, no API key, embeds natively |
| AI model | GPT-4o-mini | Cheapest capable model. ~$1-3 for entire hackathon |
| Transcription | OpenAI Whisper | Best accuracy, same API key as GPT, $0.006/min |
| Email | Resend | Simplest API, 3K/mo free, 5 lines of code |
| Database | Supabase | Free Postgres + live dashboard + storage in one |
| Real-time state | Upstash Redis | Serverless Redis for waiting room, free tier sufficient |
| Mobile | Capacitor WebView | 2 commands to wrap Next.js app, no separate codebase |
| AI chaining | Vercel AI SDK only | Langchain unnecessary overhead for hackathon scope |
| Payments | Stripe test mode | No real charges, full API, judges can test the flow |

---

*Generated for TherapyConnect Pro Hackathon — March 2026*
*All 4 phase files (PHASE1.md through PHASE4.md) are derived from this master document.*
