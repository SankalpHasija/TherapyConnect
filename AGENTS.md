# TherapyConnect Pro — Codex Agent Instructions

You are an expert full-stack Next.js developer working on **TherapyConnect Pro** — an AI-powered telehealth practice management platform for therapists.

This file is your complete source of truth. Read it fully before writing any code. Every decision about stack, structure, naming, patterns, and phase scope is recorded here. Do not deviate.

---

## 1. Project Identity

| Field | Value |
|---|---|
| App name | TherapyConnect Pro |
| Domain | Healthcare — Telehealth & Mental Health |
| Type | Full-stack CRUD + AI SaaS |
| Framework | Next.js 14 App Router |
| Language | TypeScript (strict mode) |
| Repo root | `therapyconnect-pro/` |

---

## 2. Tech Stack — Exact Versions

### Always use these. Never suggest alternatives.

| Layer | Tool | Notes |
|---|---|---|
| Framework | Next.js 14 App Router | No Pages Router. No separate Express server. |
| Language | TypeScript strict | Zero `any`. Zero `@ts-ignore`. |
| Styling | Tailwind CSS 3.x | Utility classes only. No CSS modules. No styled-components. |
| Components | shadcn/ui | Always import from `@/components/ui/`. Never raw HTML form elements. |
| Validation | Zod | Every API input validated before touching Prisma. |
| ORM | Prisma (latest) | Client singleton from `lib/prisma.ts` only. Never `new PrismaClient()` in routes. |
| Database | Supabase (Postgres) | Free tier. Connection via `DATABASE_URL` env var. |
| Auth | NextAuth.js v5 | CredentialsProvider. JWT strategy. Role in token + session. |
| AI | OpenAI GPT-4o-mini | Via Vercel AI SDK. Streaming with `useCompletion`. |
| Transcription | OpenAI Whisper | `whisper-1` model. Audio via multipart form. |
| AI SDK | Vercel AI SDK | `import { streamText } from 'ai'`. No Langchain. |
| Video | Jitsi Meet | Free, open source. Embed via `@jitsi/react-sdk`. No Zoom. No Daily.co. |
| Payments | Stripe (test mode) | `stripe` + `@stripe/stripe-js`. Test keys only. |
| Email | Resend | `resend` package. 3K emails/mo free. |
| Redis | Upstash Redis | `@upstash/redis`. Waiting room state only. |
| Storage | Supabase Storage | Documents bucket: `therapyconnect-documents`. |
| Deploy | Vercel | Free tier. Push to GitHub = deploy. |
| Mobile | Capacitor (Phase 4) | WebView wrapper. `@capacitor/core`. |

---

## 3. Folder Structure — Exact Layout

```
therapyconnect-pro/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── (practitioner)/
│   │   ├── layout.tsx              ← Shared navbar for practitioner
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── appointments/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── clients/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       └── notes/
│   │   │           ├── new/page.tsx
│   │   │           └── [noteId]/page.tsx
│   │   ├── billing/
│   │   │   └── page.tsx
│   │   ├── analytics/              ← Phase 3
│   │   │   └── page.tsx
│   │   └── prescriptions/          ← Phase 3
│   │       └── page.tsx
│   ├── (client)/
│   │   ├── layout.tsx              ← Shared navbar for client
│   │   ├── portal/
│   │   │   ├── page.tsx
│   │   │   ├── book/page.tsx
│   │   │   ├── session/
│   │   │   │   └── [id]/page.tsx  ← Phase 2 (Jitsi + waiting room)
│   │   │   ├── intake/page.tsx
│   │   │   ├── assessments/        ← Phase 2
│   │   │   │   └── page.tsx
│   │   │   ├── mood/               ← Phase 3
│   │   │   │   └── page.tsx
│   │   │   └── prescriptions/      ← Phase 3
│   │   │       └── page.tsx
│   ├── (admin)/
│   │   ├── layout.tsx
│   │   └── admin/
│   │       ├── page.tsx
│   │       └── users/page.tsx
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── users/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       ├── appointments/
│       │   ├── route.ts
│       │   └── [id]/
│       │       ├── route.ts
│       │       └── join/route.ts   ← Phase 2
│       ├── clients/
│       │   ├── route.ts
│       │   └── [id]/
│       │       ├── route.ts
│       │       ├── notes/route.ts
│       │       └── insights/route.ts ← Phase 2
│       ├── notes/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       ├── intake/
│       │   ├── route.ts
│       │   └── [clientId]/route.ts
│       ├── assessments/            ← Phase 2
│       │   ├── route.ts
│       │   └── [clientId]/route.ts
│       ├── payments/               ← Phase 2
│       │   ├── create-session/route.ts
│       │   └── webhook/route.ts
│       ├── reminders/              ← Phase 2
│       │   └── send/route.ts
│       ├── prescriptions/          ← Phase 3
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       ├── mood/                   ← Phase 3
│       │   ├── route.ts
│       │   └── [clientId]/route.ts
│       ├── documents/              ← Phase 3
│       │   ├── route.ts
│       │   └── [id]/
│       │       ├── route.ts
│       │       └── download/route.ts
│       ├── analytics/              ← Phase 3
│       │   └── summary/route.ts
│       ├── compliance/             ← Phase 3
│       │   └── alerts/route.ts
│       ├── waiting-room/           ← Phase 2
│       │   └── [appointmentId]/route.ts
│       ├── homework/               ← Phase 4
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       ├── achievements/           ← Phase 4
│       │   └── [clientId]/route.ts
│       ├── consultation/           ← Phase 4
│       │   ├── route.ts
│       │   └── [id]/
│       │       ├── route.ts
│       │       └── respond/route.ts
│       └── ai/
│           ├── generate-note/route.ts    ← Phase 2
│           ├── insights/route.ts         ← Phase 2
│           ├── treatment-plan/route.ts   ← Phase 3
│           ├── emotion-analysis/route.ts ← Phase 4
│           └── match-therapist/route.ts  ← Phase 4
├── components/
│   ├── ui/                         ← shadcn auto-generated. Never edit.
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── PageWrapper.tsx
│   │   └── MobileNav.tsx           ← Phase 4
│   ├── appointments/
│   │   ├── AppointmentCard.tsx
│   │   ├── AppointmentList.tsx
│   │   └── BookingForm.tsx
│   ├── clients/
│   │   ├── ClientCard.tsx
│   │   ├── ClientList.tsx
│   │   └── EHRForm.tsx
│   ├── notes/
│   │   ├── SOAPNoteForm.tsx
│   │   ├── NoteCard.tsx
│   │   └── VoiceRecorder.tsx       ← Phase 2
│   ├── assessments/                ← Phase 2
│   │   ├── PHQ9Form.tsx
│   │   ├── GAD7Form.tsx
│   │   └── ScoreChart.tsx
│   ├── video/                      ← Phase 2
│   │   ├── JitsiSession.tsx
│   │   └── WaitingRoom.tsx
│   ├── ai/                         ← Phase 2+
│   │   ├── InsightsCard.tsx
│   │   └── TreatmentPlanCard.tsx
│   └── charts/                     ← Phase 3
│       ├── SessionsChart.tsx
│       └── RevenueChart.tsx
├── lib/
│   ├── prisma.ts                   ← Singleton. Never import PrismaClient directly.
│   ├── auth.ts                     ← NextAuth config + handlers
│   ├── openai.ts                   ← Phase 2: OpenAI client singleton
│   ├── stripe.ts                   ← Phase 2: Stripe client singleton
│   ├── resend.ts                   ← Phase 2: Resend client singleton
│   ├── redis.ts                    ← Phase 2: Upstash Redis singleton
│   ├── compliance.ts               ← Phase 3: Compliance check functions
│   ├── streaks.ts                  ← Phase 4: Streak calculation
│   └── validations/
│       └── index.ts                ← All Zod schemas
├── types/
│   └── next-auth.d.ts              ← Session type augmentation
├── prisma/
│   ├── schema.prisma               ← Full schema (all phases). Never partial.
│   └── seed.ts                     ← Demo data seed script
├── public/
├── middleware.ts                   ← Role-based route protection
├── AGENTS.md                       ← This file
├── .env.example
├── .env.local                      ← Never commit. Never read in code directly.
└── README.md
```

### Naming conventions
- Pages: `page.tsx` — lowercase, Next.js convention
- Components: `PascalCase.tsx` — e.g. `AppointmentCard.tsx`
- API routes: `route.ts` — lowercase, Next.js convention
- Lib files: `camelCase.ts` — e.g. `prisma.ts`, `auth.ts`
- Zod schemas: `PascalCaseSchema` — e.g. `AppointmentSchema`
- Prisma models: `PascalCase` — as defined in schema

---

## 4. Prisma Schema — Complete (All Phases)

The full schema is in `prisma/schema.prisma`. It covers all 4 phases. It was pushed once at project init. **Never run `prisma migrate` — always use `prisma db push` for schema changes.**

### Models summary (quick reference)

| Model | Phase | Purpose |
|---|---|---|
| `User` | 1 | All roles: PRACTITIONER, CLIENT, ADMIN |
| `ClientProfile` | 1 | EHR data linked to client User |
| `Appointment` | 1 | Sessions between practitioner and client |
| `ProgressNote` | 1 | SOAP notes per appointment |
| `IntakeForm` | 1 | One-time client intake answers (JSON) |
| `Assessment` | 2 | PHQ-9 / GAD-7 scores |
| `Payment` | 2 | Stripe payment per appointment |
| `Prescription` | 3 | Medications per client |
| `MoodLog` | 3 | Daily mood score 1-10 |
| `Document` | 3 | Files in Supabase Storage |
| `HomeworkTask` | 4 | Tasks assigned by practitioner |
| `Achievement` | 4 | Client achievement badges |
| `ConsultationPost` | 4 | Peer consultation cases |
| `ConsultationResponse` | 4 | Responses to consultation posts |

### Key enums
```
Role:              PRACTITIONER | CLIENT | ADMIN
AppointmentStatus: SCHEDULED | WAITING | IN_SESSION | COMPLETED | CANCELLED | NO_SHOW
PaymentStatus:     PENDING | PAID | FAILED | REFUNDED
NoteType:          SOAP | PROGRESS | INTAKE | ASSESSMENT | TREATMENT_PLAN
```

---

## 5. API Route Patterns — Follow Exactly

### Authentication check — first line of every route
```typescript
const session = await auth()
if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
```

### Role check — immediately after auth
```typescript
if (session.user.role !== 'PRACTITIONER') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

### Input validation — before any DB query
```typescript
const body = await req.json()
const parsed = SomeSchema.safeParse(body)
if (!parsed.success) {
  return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
}
```

### Prisma query — always via singleton
```typescript
import { prisma } from '@/lib/prisma'
const result = await prisma.modelName.findMany({ where: { ... } })
```

### Error handling — every route
```typescript
try {
  // ... logic
} catch (error) {
  console.error('[ROUTE_NAME]', error)
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}
```

### Standard response shape
```typescript
// Success list:    return NextResponse.json(items)
// Success single:  return NextResponse.json(item)
// Created:         return NextResponse.json(item, { status: 201 })
// No content:      return NextResponse.json({ success: true })
// Error:           return NextResponse.json({ error: 'message' }, { status: N })
```

### Session user access
```typescript
// ID:   session.user.id
// Role: session.user.role
// Name: session.user.name
// These are available because of the NextAuth callbacks in lib/auth.ts
```

---

## 6. Phase Boundaries — What Exists vs What's Next

### Phase 1 — COMPLETE (foundation)
Everything in these paths exists and is functional:
- `/login`, `/register`
- `/dashboard`, `/appointments/**`, `/clients/**`, `/billing`
- `/portal`, `/portal/book`, `/portal/intake`
- `/admin/users`
- All API routes under: `/api/auth`, `/api/users`, `/api/appointments`, `/api/clients`, `/api/notes`, `/api/intake`
- Full Prisma schema pushed to DB
- Seed data loaded

### Phase 2 — NEXT (hero features + AI)
Not yet built. Add these files:
- `components/video/JitsiSession.tsx` + `components/video/WaitingRoom.tsx`
- `app/(client)/portal/session/[id]/page.tsx`
- `components/notes/VoiceRecorder.tsx`
- `components/assessments/PHQ9Form.tsx` + `GAD7Form.tsx` + `ScoreChart.tsx`
- `components/ai/InsightsCard.tsx`
- `lib/openai.ts`, `lib/stripe.ts`, `lib/resend.ts`, `lib/redis.ts`
- All `/api/ai/*`, `/api/payments/*`, `/api/assessments/*`, `/api/waiting-room/*`, `/api/reminders/*` routes
- Update `/appointments/[id]/page.tsx` — enable Join Session button
- Update `/clients/[id]/page.tsx` — populate Assessments tab

### Phase 3 — BONUS ROUND A
Not yet built. Add prescriptions, mood tracking, compliance, analytics, documents.

### Phase 4 — BONUS ROUND B
Not yet built. Add voice emotion analysis, AI matching, gamification, peer consultation, Capacitor mobile.

### Critical rule on phase scope
**When working on Phase N, only add Phase N files. Never add Phase N+1 code.**
If a Phase 2 task touches a Phase 1 file, only modify what is strictly necessary — do not refactor, do not add Phase 3 features opportunistically.

---

## 7. Coding Rules — Non-Negotiable

### TypeScript
- Strict mode always — `"strict": true` in tsconfig
- Zero `any` — use `unknown` and narrow, or define a proper type
- Zero `@ts-ignore` — fix the type properly
- All function parameters and return types explicitly typed
- Use `type` for object shapes, `interface` only for extensible contracts

### React / Next.js
- Server Components by default — add `'use client'` only when needed (hooks, browser APIs, event handlers)
- Never fetch data client-side if it can be done in a Server Component
- No `useEffect` for data fetching — use Server Components or React Query
- All forms use `shadcn/ui` Form + react-hook-form + Zod resolver

### API Routes
- Every route: auth check → role check → Zod validation → Prisma query → response
- Never skip any step
- Never expose password field in responses — always `select` explicitly
- Wrap all logic in try/catch

### Prisma
- Always use `@/lib/prisma` singleton
- Never select `password` in responses
- Use `include` for relations, `select` to limit fields
- Use `upsert` in seed script, never `create` (safe to re-run)

### Components
- All UI from `shadcn/ui` — Button, Card, Input, Table, Dialog, Badge, etc.
- No inline styles — Tailwind classes only
- No raw `<button>`, `<input>`, `<form>` HTML elements — use shadcn wrappers
- Icons from `lucide-react` only

### Phase boundary enforcement
- Phase 2+ pages: do not create the file until Phase 2 task
- Phase 2+ API routes: do not create until Phase 2 task
- Phase 2+ lib files (`openai.ts`, `stripe.ts`, etc.): do not create until Phase 2 task
- Exception: `prisma/schema.prisma` — full schema exists from Phase 1 init

### Environment variables
- Access via `process.env.VAR_NAME` in server code only
- Client-accessible vars must be prefixed `NEXT_PUBLIC_`
- Never hardcode API keys, URLs, or secrets
- Always check for undefined before using optional Phase 2+ keys:
  ```typescript
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set')
  ```

---

## 8. Environment Variables Reference

```bash
# Phase 1 — required now
DATABASE_URL=                        # Supabase Postgres connection string
NEXTAUTH_SECRET=                     # Generate: openssl rand -base64 32
NEXTAUTH_URL=                        # http://localhost:3000 locally

# Phase 2 — add before Phase 2 tasks
OPENAI_API_KEY=                      # Whisper + GPT-4o-mini
STRIPE_PUBLIC_KEY=                   # pk_test_...
STRIPE_SECRET_KEY=                   # sk_test_...
STRIPE_WEBHOOK_SECRET=               # whsec_...
RESEND_API_KEY=                      # re_...
UPSTASH_REDIS_REST_URL=              # https://...
UPSTASH_REDIS_REST_TOKEN=            # ...

# Phase 3 — add before Phase 3 tasks
NEXT_PUBLIC_SUPABASE_URL=            # https://[ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=       # eyJ...
SUPABASE_SERVICE_ROLE_KEY=           # eyJ...

# Always present
NEXT_PUBLIC_APP_URL=                 # http://localhost:3000 locally
NEXT_PUBLIC_JITSI_DOMAIN=            # meet.jit.si
```

---

## 9. Seed Data — Demo Credentials

After running `npx prisma db seed`:

| Role | Email | Password |
|---|---|---|
| Admin | admin@therapyconnect.com | password123 |
| Practitioner | sarah.chen@therapyconnect.com | password123 |
| Practitioner | james.wilson@therapyconnect.com | password123 |
| Client | emma@example.com | password123 |
| Client | marcus@example.com | password123 |
| Client | priya@example.com | password123 |
| Client | david@example.com | password123 |
| Client | sophie@example.com | password123 |

---

## 10. Key Business Logic

### Jitsi room URL
- Generated on appointment creation: `https://meet.jit.si/therapyconnect-${appointment.id}`
- Stored in `Appointment.jitsiRoomUrl`
- Used in Phase 2 — `JitsiSession.tsx` component

### Waiting room state (Redis)
- Key: `waitingroom:{appointmentId}`
- Values: `client_waiting` | `session_active` | `session_ended`
- TTL: 86400 seconds (24 hours)
- Client polls every 3 seconds

### PHQ-9 severity thresholds
- 0–4: minimal · 5–9: mild · 10–14: moderate · 15–19: moderately-severe · 20–27: severe

### GAD-7 severity thresholds
- 0–4: minimal · 5–9: mild · 10–14: moderate · 15–21: severe

### AI SOAP note system prompt (Phase 2)
Return JSON only: `{ subjective, objective, assessment, plan }` — each a 2-4 sentence clinical paragraph.

### Payment amount
- Fixed: 15000 cents ($150 USD) per session
- Stripe test mode only — no real charges

### Compliance check triggers (Phase 3)
- Missing note: COMPLETED appointment with no linked ProgressNote, within 7 days
- Overdue PHQ-9: last assessment > 30 days ago
- Inactive client: no appointment in 60 days
- Incomplete intake: intakeComplete=false AND account > 3 days old
- Expiring prescription: active prescription with endDate in next 7 days

---

## 11. Demo Script (90 seconds — pitch day)

1. Login as `sarah.chen@therapyconnect.com`
2. Dashboard → today's appointments + AI insights card
3. Open client profile → EHR tab + PHQ-9 score history chart
4. Appointments → click appointment → "Start Session"
5. Waiting room → client status "waiting"
6. Jitsi session embedded in app
7. **WOW MOMENT**: "Generate Note" → speak 3 sentences → AI writes full SOAP note live (streaming)
8. AI insights card: "PHQ-9 declining 3 weeks — recommend reassessment"
9. Switch to client view → book next appointment

**Closing line:** "This is what SimplePractice would look like built today — with AI at the core, not as an add-on."

---

*AGENTS.md — TherapyConnect Pro*
*Read this file before every task. It is the source of truth.*
*Full phase detail: see PHASE1.md, PHASE2.md, PHASE3.md, PHASE4.md*
