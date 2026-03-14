# TherapyConnect Pro — Phase 2: Hero Features + AI

> Source of truth: MASTER.md
> Prerequisite: Phase 1 fully complete and deployed to Vercel.
> Goal: Demo-worthy features. Judges see AI working live. This phase wins the hackathon.
> Estimated time: ~2 hours

---

## Phase 2 Checklist

- [ ] Jitsi Meet embedded per appointment
- [ ] Waiting room UI with real-time status (Upstash Redis)
- [ ] Stripe payment checkout (test mode)
- [ ] Appointment reminder emails via Resend
- [ ] Voice recording UI in notes page
- [ ] OpenAI Whisper transcription API route
- [ ] GPT-4o-mini SOAP note generator API route
- [ ] Streaming SOAP note in UI via Vercel AI SDK
- [ ] PHQ-9 assessment form with auto-scoring
- [ ] GAD-7 assessment form with auto-scoring
- [ ] Assessment score history chart on client profile
- [ ] AI clinical insights API route
- [ ] AI insights card on practitioner dashboard

---

## Features to Build

### 9. HIPAA Video — Jitsi Meet Embed

**What it does:**
- Each appointment has a unique Jitsi room URL (created in Phase 1)
- URL pattern: `https://meet.jit.si/therapyconnect-{appointmentId}`
- On appointment start: status changes to IN_SESSION
- Jitsi iframe embedded full-width in session page
- Practitioner starts from `/appointments/[id]`
- Client joins from `/portal/session/[id]`

**Install:**
```bash
npm install @jitsi/react-sdk
```

**Jitsi component:**
```typescript
// components/video/JitsiSession.tsx
import { JitsiMeeting } from '@jitsi/react-sdk';

interface JitsiSessionProps {
  appointmentId: string;
  displayName: string;
  role: 'PRACTITIONER' | 'CLIENT';
}

// Config:
// - domain: meet.jit.si
// - roomName: `therapyconnect-${appointmentId}`
// - configOverwrite: { startWithAudioMuted: false, startWithVideoMuted: false }
// - interfaceConfigOverwrite: { SHOW_JITSI_WATERMARK: false, SHOW_WATERMARK_FOR_GUESTS: false }
// - userInfo: { displayName, email }
// - onReadyToClose: callback to end session, update status to COMPLETED
```

**Pages:**
- `/appointments/[id]` — practitioner view with Jitsi embed + session controls
- `/portal/session/[id]` — client view with Jitsi embed

**Session controls (practitioner only):**
- "End Session" button → updates appointment status to COMPLETED → redirects to create note
- Session timer (running clock from join time)
- Quick link to open note editor in split view

**API routes:**
- `GET /api/appointments/[id]/join` — returns jitsiRoomUrl, updates status to IN_SESSION
- `PATCH /api/appointments/[id]` — update status to COMPLETED when session ends

---

### 10. Waiting Room UI

**What it does:**
- Client arrives at session page before practitioner starts
- Redis key tracks state: `waitingroom:{appointmentId}`
- States: `client_waiting` | `session_active` | `session_ended`
- Client sees "Waiting for your therapist..." with animated indicator
- When practitioner clicks "Start Session", Redis state → `session_active`
- Client page polls every 3 seconds and auto-loads Jitsi when active

**Install:**
```bash
npm install @upstash/redis
```

**Redis state management:**
```typescript
// lib/redis.ts
import { Redis } from '@upstash/redis';
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Key: waitingroom:{appointmentId}
// Value: 'client_waiting' | 'session_active' | 'session_ended'
// TTL: 24 hours
```

**API routes:**
- `GET /api/waiting-room/[appointmentId]` — get current state
- `POST /api/waiting-room/[appointmentId]` — update state (body: { state })

**Client waiting room page `/portal/session/[id]`:**
```
State: client_waiting →
  Show: animated pulse indicator, "Your therapist will start the session soon"
  Show: appointment time, therapist name
  Poll: GET /api/waiting-room/[id] every 3 seconds

State: session_active →
  Hide waiting UI
  Show: JitsiSession component (auto-join)

State: session_ended →
  Show: "Session complete. Thank you."
  Show: link to complete PHQ-9 assessment
```

**shadcn components:** Card, Skeleton (animated), Badge, Button

---

### 11. Payment Processing — Stripe

**What it does:**
- After appointment is booked, client is prompted to pay
- Stripe Checkout session created per appointment
- On payment success: Payment record updated to PAID
- Practitioner sees payment status on appointment detail and billing page

**Install:**
```bash
npm install stripe @stripe/stripe-js
```

**Flow:**
1. Client books appointment → appointment created with payment status PENDING
2. Client sees "Pay for session" button on portal
3. Click → POST /api/payments/create-session → Stripe Checkout URL
4. Stripe success redirect → /portal?payment=success
5. Stripe webhook → POST /api/payments/webhook → update Payment to PAID

**API routes:**
```typescript
// POST /api/payments/create-session
// Body: { appointmentId }
// Creates Stripe checkout session
// Price: fixed $150 per session (hardcoded for hackathon)
// success_url: /portal?payment=success
// cancel_url: /portal

// POST /api/payments/webhook
// Validates Stripe signature
// On checkout.session.completed → update Payment status to PAID
```

**Billing page `/billing`:**
- Table of all payments: date, client name, amount, status badge
- Total revenue this month stat card

**shadcn components:** Table, Badge, Card, Button

---

### 12. Appointment Reminders — Email via Resend

**What it does:**
- Email sent to client 24 hours before appointment
- Email contains: therapist name, date/time, join link
- Triggered by a cron-style API route (call manually or via Vercel cron)
- Marks `reminderSent: true` on appointment after sending

**Install:**
```bash
npm install resend
```

**Email template:**
```
Subject: Reminder: Your therapy session tomorrow at {time}

Hi {clientName},

This is a reminder of your upcoming session with {practitionerName}
scheduled for tomorrow, {date} at {time}.

To join your session:
{appUrl}/portal/session/{appointmentId}

If you need to reschedule, please contact your therapist.

TherapyConnect Pro
```

**API route:**
```typescript
// POST /api/reminders/send
// Finds all appointments in next 24hrs where reminderSent = false
// Sends email to each client
// Updates reminderSent = true
// Can be triggered manually or via Vercel Cron (vercel.json)
```

**Vercel cron (vercel.json):**
```json
{
  "crons": [{ "path": "/api/reminders/send", "schedule": "0 10 * * *" }]
}
```

---

### 13. Voice-to-Text → SOAP Note (WOW #1)

**What it does:**
- On the note creation page, practitioner sees a "Record Session" button
- Click to start audio recording using browser MediaRecorder API
- Stop recording → audio blob sent to `/api/ai/generate-note`
- Server sends audio to OpenAI Whisper → gets transcript
- Transcript sent to GPT-4o-mini with clinical prompt → structured SOAP note
- SOAP note streams back to UI word-by-word via Vercel AI SDK
- Practitioner can edit before saving

**Install:**
```bash
npm install ai openai
```

**Recording component:**
```typescript
// components/ai/VoiceRecorder.tsx
// Uses browser MediaRecorder API
// Records in audio/webm format
// Shows: idle → recording (pulsing red dot + timer) → processing → complete
// On stop: converts blob to File, POSTs to /api/ai/generate-note
```

**API route `/api/ai/generate-note`:**
```typescript
// POST — multipart/form-data with audio file
// Step 1: Send to Whisper
const transcription = await openai.audio.transcriptions.create({
  file: audioFile,
  model: 'whisper-1',
  language: 'en',
});

// Step 2: Send transcript to GPT-4o-mini with streaming
const stream = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  stream: true,
  messages: [
    {
      role: 'system',
      content: `You are a clinical documentation assistant for a licensed therapist.
      Given a session transcript, generate a structured SOAP note.
      Return ONLY valid JSON with keys: subjective, objective, assessment, plan.
      Each value is a clear, clinical, 2-4 sentence paragraph.
      subjective: What the client reported, their concerns and feelings.
      objective: Observable facts, mental status, behavior during session.
      assessment: Clinical impression, progress toward goals, diagnostic considerations.
      plan: Next steps, homework, treatment adjustments, next session focus.`
    },
    {
      role: 'user',
      content: `Session transcript:\n\n${transcription.text}\n\nGenerate the SOAP note.`
    }
  ]
});

// Return as streaming response using Vercel AI SDK StreamingTextResponse
```

**UI on `/clients/[id]/notes/new`:**
```
Layout:
  Left panel: Voice Recorder component
    - Record button (red mic icon)
    - Recording timer
    - "Generating note..." spinner
  Right panel: SOAP Note form
    - 4 textareas: Subjective / Objective / Assessment / Plan
    - Fields populate via streaming as AI writes them
    - "AI Generated" badge shown
    - Practitioner can edit any field
    - Save button → POST /api/notes
```

**Vercel AI SDK streaming:**
```typescript
// In the component, use useCompletion hook
// or manually handle the stream and parse JSON chunks
// Stream each SOAP field as it arrives and update the form fields
```

---

### 14. PHQ-9 & GAD-7 Assessments

**What it does:**
- Standardized clinical assessments completed by client
- PHQ-9: 9 questions, scores 0-3 each, total 0-27
- GAD-7: 7 questions, scores 0-3 each, total 0-21
- Auto-calculates severity level
- Score saved to Assessment model linked to client + appointment
- History chart shown on practitioner's client profile page

**PHQ-9 Questions (score 0=Not at all, 1=Several days, 2=More than half, 3=Nearly every day):**
1. Little interest or pleasure in doing things
2. Feeling down, depressed, or hopeless
3. Trouble falling or staying asleep, or sleeping too much
4. Feeling tired or having little energy
5. Poor appetite or overeating
6. Feeling bad about yourself
7. Trouble concentrating on things
8. Moving or speaking slowly / being fidgety or restless
9. Thoughts that you would be better off dead

**PHQ-9 Severity:**
- 0–4: Minimal
- 5–9: Mild
- 10–14: Moderate
- 15–19: Moderately Severe
- 20–27: Severe

**GAD-7 Questions (same 0-3 scale):**
1. Feeling nervous, anxious, or on edge
2. Not being able to stop or control worrying
3. Worrying too much about different things
4. Trouble relaxing
5. Being so restless it's hard to sit still
6. Becoming easily annoyed or irritable
7. Feeling afraid as if something awful might happen

**GAD-7 Severity:**
- 0–4: Minimal
- 5–9: Mild
- 10–14: Moderate
- 15–21: Severe

**Pages:**
- `/portal/assessments` — client selects PHQ-9 or GAD-7, completes form
- `/clients/[id]` → Assessments tab — history chart + raw scores

**API routes:**
- `POST /api/assessments` — submit assessment, auto-calculate score + severity
- `GET /api/assessments/[clientId]` — get history (practitioner only)

**Score history chart:**
- Line chart showing PHQ-9 and GAD-7 scores over time
- Use Recharts (already in shadcn ecosystem)
- Color: PHQ-9 in coral, GAD-7 in purple
- Severity bands shown as background zones

**shadcn components:** RadioGroup, Progress, Card, Badge, Tabs

---

### 15. AI Clinical Insights (WOW #2)

**What it does:**
- Analyses all progress notes + assessment scores for a client
- GPT-4o-mini generates a clinical summary with trends and flags
- Displayed as a card on the practitioner dashboard (top 3 clients with notable changes)
- Also displayed on individual client profile page

**API route `/api/ai/insights`:**
```typescript
// POST — body: { clientId }
// Fetches: last 10 progress notes + last 6 assessment scores for client
// Sends to GPT-4o-mini:

const systemPrompt = `You are a clinical supervisor AI assistant.
Analyse the session notes and assessment scores provided and return a JSON object with:
{
  "summary": "2-3 sentence overall clinical picture",
  "trends": ["array of observed trends, max 3"],
  "flags": ["array of clinical concerns requiring attention, max 2"],
  "recommendation": "one clear action recommendation for the next session",
  "scoreDirection": "improving" | "declining" | "stable"
}
Be concise and clinical. Flag PHQ-9 > 15 or GAD-7 > 14 as high priority.
Flag score increases of 5+ points between sessions.`;

// Returns JSON — no streaming needed for insights
```

**Dashboard insights card:**
```
Component: components/ai/InsightsCard.tsx

Shows per client:
  - Client name + avatar
  - Score direction badge (improving 📈 / declining 📉 / stable)
  - 1-line summary
  - Flag chips (if any)
  - "View full insights" link → client profile

Refresh button: re-runs AI analysis
Auto-loads on dashboard mount for top 5 clients by last session date
```

**Client profile insights section:**
- Full summary paragraph
- Trend bullets
- Flag alerts (red badge if high priority)
- Recommendation box (highlighted)

**shadcn components:** Card, Badge, Alert, AlertDescription, Separator

---

## Phase 2 Codex Prompt

```
Building on the existing TherapyConnect Pro Next.js 14 app (Phase 1 complete).
Add the following Phase 2 features. Do not modify Phase 1 code unless required.

FEATURE 1 — JITSI VIDEO:
Install @jitsi/react-sdk.
Create components/video/JitsiSession.tsx using JitsiMeeting component.
Room name: therapyconnect-{appointmentId}. Domain: meet.jit.si.
Create /appointments/[id] page with Jitsi embed for practitioner.
Create /portal/session/[id] page with Jitsi embed for client.
Add "Start Session" button to appointment detail that updates status to IN_SESSION.

FEATURE 2 — WAITING ROOM:
Install @upstash/redis.
Create lib/redis.ts with Redis client.
Create /api/waiting-room/[appointmentId] GET and POST routes.
Redis key: waitingroom:{appointmentId}, values: client_waiting | session_active | session_ended, TTL: 86400.
Client /portal/session/[id] polls every 3 seconds, shows waiting UI until session_active.

FEATURE 3 — STRIPE PAYMENTS:
Install stripe @stripe/stripe-js.
Create lib/stripe.ts with Stripe client.
Create /api/payments/create-session POST route — creates Stripe checkout, price $15000 cents, per appointment.
Create /api/payments/webhook POST route — handles checkout.session.completed, updates Payment to PAID.
Add pay button to client portal for PENDING payments.
Create /billing page for practitioner showing payment history table.

FEATURE 4 — EMAIL REMINDERS:
Install resend.
Create lib/resend.ts with Resend client.
Create /api/reminders/send POST route — finds appointments in next 24hrs, sends reminder email, marks reminderSent=true.
Create email template with appointment details and join link.

FEATURE 5 — VOICE TO SOAP NOTE:
Install ai openai.
Create components/ai/VoiceRecorder.tsx using browser MediaRecorder API.
Create /api/ai/generate-note POST route — multipart form with audio file.
Step 1: Whisper transcription. Step 2: GPT-4o-mini streaming SOAP note generation.
System prompt instructs GPT to return JSON with subjective, objective, assessment, plan.
Update /clients/[id]/notes/new to include VoiceRecorder and streaming SOAP fields.
Fields populate live as AI streams the response.

FEATURE 6 — PHQ-9 AND GAD-7:
Create /portal/assessments page with PHQ-9 (9 questions) and GAD-7 (7 questions).
Each question scored 0-3. Auto-calculate total and severity on submit.
Create /api/assessments POST and GET /api/assessments/[clientId] routes.
Add Recharts line chart to /clients/[id] Assessments tab showing score history.

FEATURE 7 — AI CLINICAL INSIGHTS:
Create /api/ai/insights POST route — fetches last 10 notes + 6 assessments for a client.
GPT-4o-mini returns JSON: summary, trends[], flags[], recommendation, scoreDirection.
Create components/ai/InsightsCard.tsx showing summary, direction badge, flags.
Add InsightsCard to /dashboard for top 5 clients by last session.
Add full insights section to /clients/[id] profile page.
```

---

## Definition of Done — Phase 2

- [ ] Jitsi video loads in both practitioner and client views
- [ ] Client sees waiting room state, auto-joins when practitioner starts
- [ ] Stripe checkout opens and returns to app after payment
- [ ] Webhook updates payment status correctly
- [ ] Voice recording captures audio in browser
- [ ] Whisper returns accurate transcript
- [ ] SOAP note streams into form fields live
- [ ] PHQ-9 and GAD-7 score correctly and save to DB
- [ ] Assessment score chart renders on client profile
- [ ] AI insights card loads on dashboard
- [ ] AI flags declining PHQ-9 scores correctly

---

*Phase 2 of 4 — TherapyConnect Pro Hackathon*
*Next: PHASE3.md — Bonus Round A*
