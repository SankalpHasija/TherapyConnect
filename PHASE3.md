# TherapyConnect Pro — Phase 3: Bonus Round A (Full Advanced)

> Source of truth: MASTER.md
> Prerequisite: Phase 1 + Phase 2 fully complete and deployed.
> Goal: Push from "hackathon project" to "real product."
> Estimated time: ~2 hours

---

## Phase 3 Checklist

- [ ] AI treatment plan generator
- [ ] Prescription management (CRUD)
- [ ] Client wellness / mood tracking
- [ ] Mood trend chart on client profile
- [ ] Automated compliance monitoring
- [ ] Basic practice analytics dashboard
- [ ] Document management (upload + download via Supabase Storage)

---

## Features to Build

### 16. AI Treatment Plan Generator

**What it does:**
- Practitioner clicks "Generate Treatment Plan" on client profile
- System collects: intake form answers + PHQ-9/GAD-7 scores + last 3 session notes
- GPT-4o-mini generates a structured treatment plan
- Practitioner can edit and save the plan
- Plan stored as a ProgressNote with type = TREATMENT_PLAN (extend NoteType enum)

**Add to Prisma schema:**
```prisma
// Add to NoteType enum in schema.prisma
TREATMENT_PLAN
```

**API route `/api/ai/treatment-plan`:**
```typescript
// POST — body: { clientId }
// Fetches: intake form answers + last 6 assessment scores + last 3 notes
// GPT-4o-mini prompt:

const systemPrompt = `You are an experienced clinical therapist creating a treatment plan.
Based on the client data provided, generate a structured treatment plan as JSON:
{
  "presentingProblems": "Summary of client's main concerns",
  "longTermGoals": ["Array of 3 long-term therapeutic goals"],
  "shortTermObjectives": ["Array of 5 measurable short-term objectives"],
  "interventions": ["Array of 4 evidence-based interventions to use"],
  "frequency": "Recommended session frequency (e.g., weekly, biweekly)",
  "estimatedDuration": "Estimated treatment duration (e.g., 12-16 sessions)",
  "measuresOfProgress": ["Array of 3 ways to measure progress"],
  "specialConsiderations": "Any clinical notes or special considerations"
}
Use evidence-based language appropriate for a clinical record.`;
```

**UI on `/clients/[id]`:**
- New "Treatment Plan" tab (alongside Profile / Notes / Assessments)
- Shows existing plan if one exists
- "Generate New Plan" button (prompts confirmation if plan exists)
- Editable fields per section after generation
- "Save Plan" button → POST /api/notes with type=TREATMENT_PLAN
- Print/export button (window.print() with print-specific CSS)

**shadcn components:** Tabs, Card, Textarea, Button, Dialog (confirmation), Badge, Separator

---

### 17. Prescription Management

**What it does:**
- Practitioner adds, edits, and deactivates prescriptions per client
- Client sees their active prescriptions in portal
- Simple CRUD — no ePrescribing, no DEA integration
- Linked to ClientProfile

**Prisma model:** `Prescription` (already in MASTER.md schema)

**Fields:**
- Medication name (text)
- Dosage (text, e.g., "10mg")
- Frequency (text, e.g., "Once daily at bedtime")
- Start date (date picker)
- End date (date picker, optional)
- Notes (textarea, optional)
- Active (boolean toggle)

**Pages:**
- `/prescriptions` — practitioner view: list all prescriptions across clients
  - Filterable by client
  - Badge: Active / Inactive
  - Add new prescription form (Dialog)
  - Edit / deactivate inline

- `/portal/prescriptions` — client view: read-only list of their active prescriptions
  - Shows medication, dosage, frequency, start date
  - Note: "Contact your therapist with any questions"

**API routes:**
- `GET /api/prescriptions?clientId=` — get prescriptions for a client
- `GET /api/prescriptions` — get all prescriptions for practitioner's clients
- `POST /api/prescriptions` — create prescription
- `PATCH /api/prescriptions/[id]` — update or deactivate
- `DELETE /api/prescriptions/[id]` — soft delete (set active=false)

**Validation (Zod):**
```typescript
const PrescriptionSchema = z.object({
  clientProfileId: z.string().cuid(),
  medication: z.string().min(1).max(200),
  dosage: z.string().min(1).max(100),
  frequency: z.string().min(1).max(200),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  notes: z.string().max(1000).optional(),
})
```

**shadcn components:** Table, Dialog, Form, Input, DatePicker, Switch, Badge, Button

---

### 18. Wellness Tracking — Client Mood Log

**What it does:**
- Client logs daily mood score (1-10) + optional note
- Client sees their own mood history chart
- Practitioner sees client's mood chart on client profile
- Mood data shown alongside PHQ-9/GAD-7 chart for clinical picture

**Prisma model:** `MoodLog` (already in MASTER.md schema)

**Client page `/portal/mood`:**
```
Layout:
  Top: Today's mood logger
    - Large slider or emoji scale (1-10)
    - Optional textarea: "How are you feeling today?"
    - Submit button
    - Success state: "Logged! Keep it up 🌱"

  Bottom: My mood history
    - Line chart: last 30 days of mood scores
    - Date range selector
```

**Practitioner view (on `/clients/[id]` → Assessments tab):**
- Mood chart overlaid with PHQ-9 scores
- Two y-axes: mood (1-10) and PHQ-9 (0-27)
- Helps practitioner see correlation between self-reported mood and clinical scores

**API routes:**
- `POST /api/mood` — log mood entry (client only)
- `GET /api/mood/[clientId]` — get mood history (client sees own, practitioner sees client's)

**Chart:** Recharts ComposedChart with Line for mood and Area for PHQ-9 background

**shadcn components:** Slider, Textarea, Card, Button

---

### 19. Automated Compliance Monitoring

**What it does:**
- Flags clinical and administrative issues proactively
- Shown as an alert panel on the practitioner dashboard
- Runs check on page load — no background job needed for hackathon

**Checks to run:**

```typescript
// lib/compliance.ts

// 1. Missing notes: appointments COMPLETED in last 7 days with no linked ProgressNote
// 2. Overdue assessments: clients with last PHQ-9 > 30 days ago
// 3. Inactive clients: clients with no appointment in 60 days
// 4. Incomplete intakes: clients where intakeComplete = false and account > 3 days old
// 5. Expiring prescriptions: active prescriptions with endDate in next 7 days

async function runComplianceChecks(practitionerId: string): Promise<ComplianceAlert[]>
// Returns array of { type, severity: 'high' | 'medium' | 'low', message, clientId?, clientName? }
```

**API route:**
- `GET /api/compliance/alerts?practitionerId=` — run and return all alerts

**Dashboard compliance panel:**
```
Title: "Compliance Alerts"
If 0 alerts: green banner "All clear — no issues found"
If alerts exist:
  - Group by severity (high first)
  - Each alert: icon + message + client name link
  - "Dismiss" per alert (stored in localStorage, resets daily)
  - Count badge on dashboard nav item
```

**Alert types and messages:**
- HIGH: "Session note missing for {clientName} — session on {date}"
- HIGH: "PHQ-9 not completed for {clientName} in 30+ days"
- MEDIUM: "Intake form not completed by {clientName}"
- MEDIUM: "Prescription for {clientName} expiring in {n} days"
- LOW: "No appointment scheduled for {clientName} in 60+ days"

**shadcn components:** Alert, AlertTitle, AlertDescription, Badge, Button, ScrollArea

---

### 20. Basic Practice Analytics Dashboard

**What it does:**
- Practitioner sees business and clinical metrics
- Data calculated from existing DB records — no external analytics service

**Page:** `/analytics`

**Metrics to show:**

```
Row 1 — Stats cards:
  - Total active clients (count)
  - Sessions this month (count)
  - Revenue this month (sum of PAID payments)
  - Average PHQ-9 score across all clients (mean)

Row 2 — Charts:
  - Sessions per week (last 8 weeks) — Bar chart
  - Revenue per month (last 6 months) — Bar chart

Row 3 — Tables:
  - Top clients by session count
  - Recent payments (last 10)
  - Compliance issues count by type
```

**API route:**
```typescript
// GET /api/analytics/summary?practitionerId=
// Returns:
{
  totalClients: number,
  sessionsThisMonth: number,
  revenueThisMonth: number, // in cents
  avgPhq9Score: number,
  sessionsPerWeek: { week: string, count: number }[], // last 8 weeks
  revenuePerMonth: { month: string, amount: number }[], // last 6 months
  topClients: { name: string, sessionCount: number }[],
  recentPayments: Payment[]
}
```

**Charts:** Recharts BarChart for sessions and revenue

**shadcn components:** Card, Table, Tabs, Badge, Separator

---

### 21. Document Management

**What it does:**
- Practitioner uploads documents per client (assessments, reports, referral letters)
- Client can view documents shared with them
- Files stored in Supabase Storage
- Metadata stored in DB (new Document model)

**Add to Prisma schema:**
```prisma
model Document {
  id              String   @id @default(cuid())
  clientId        String
  practitionerId  String
  fileName        String
  fileUrl         String   // Supabase Storage public URL
  fileSize        Int      // bytes
  mimeType        String
  sharedWithClient Boolean @default(false)
  createdAt       DateTime @default(now())

  client          User     @relation("ClientDocuments", fields: [clientId], references: [id])
  practitioner    User     @relation("PractitionerDocuments", fields: [practitionerId], references: [id])
}
```

**Supabase Storage setup:**
- Bucket name: `therapyconnect-documents`
- Path pattern: `{practitionerId}/{clientId}/{filename}`
- Access: private (use signed URLs for download)

**API routes:**
```typescript
// POST /api/documents
// Accepts multipart/form-data: file + clientId + sharedWithClient
// Uploads to Supabase Storage
// Creates Document record in DB
// Returns document metadata

// GET /api/documents?clientId=
// Returns all documents for client (filtered by role)

// GET /api/documents/[id]/download
// Generates signed URL from Supabase Storage (1hr expiry)
// Redirects to signed URL

// DELETE /api/documents/[id]
// Deletes from Supabase Storage + DB record
```

**UI on `/clients/[id]` → new "Documents" tab:**
- Upload zone (drag and drop or click) — accept PDF, DOCX, images
- File list with name, size, date, shared badge
- Download button per file
- Share/unshare toggle
- Delete button (with confirmation)

**Client portal `/portal/documents`:**
- Read-only list of documents shared by practitioner

**shadcn components:** Card, Table, Badge, Button, Dialog, Switch, Progress (upload progress)

---

## Phase 3 Codex Prompt

```
Building on TherapyConnect Pro (Phase 1 + 2 complete).
Add the following Phase 3 features. Do not modify Phase 1 or 2 code unless required.

FEATURE 1 — AI TREATMENT PLAN:
Extend NoteType enum with TREATMENT_PLAN.
Create /api/ai/treatment-plan POST route.
Fetches client intake + assessments + notes, sends to GPT-4o-mini.
Returns structured JSON: presentingProblems, longTermGoals[], shortTermObjectives[],
interventions[], frequency, estimatedDuration, measuresOfProgress[], specialConsiderations.
Add "Treatment Plan" tab to /clients/[id] page with editable fields and save button.

FEATURE 2 — PRESCRIPTIONS:
Create Prescription CRUD using existing schema.
Create /prescriptions page for practitioner with add/edit/deactivate.
Create /portal/prescriptions for client read-only view.
API routes: GET POST /api/prescriptions, PATCH DELETE /api/prescriptions/[id].

FEATURE 3 — MOOD TRACKING:
Create /portal/mood page with mood slider (1-10) + textarea + submit.
Create mood history line chart (last 30 days) on client portal.
Add mood overlay to assessment chart on /clients/[id].
API routes: POST /api/mood, GET /api/mood/[clientId].

FEATURE 4 — COMPLIANCE MONITORING:
Create lib/compliance.ts with 5 compliance checks.
Create /api/compliance/alerts GET route.
Add compliance alert panel to /dashboard below stats row.
Group alerts by severity (high/medium/low). Add dismiss (localStorage).

FEATURE 5 — ANALYTICS:
Create /analytics page with 4 stat cards, 2 bar charts, 2 tables.
Create /api/analytics/summary GET route.
Use Recharts BarChart for sessions per week and revenue per month.

FEATURE 6 — DOCUMENT MANAGEMENT:
Run: npx prisma migrate dev --name add_documents
Add Document model to schema.
Configure Supabase Storage bucket therapyconnect-documents.
Create /api/documents POST (upload), GET, /api/documents/[id]/download GET, DELETE routes.
Add Documents tab to /clients/[id] with drag-drop upload zone and file list.
Add /portal/documents read-only view for client.
```

---

## Definition of Done — Phase 3

- [ ] AI generates a structured treatment plan from client data
- [ ] Practitioner can add, edit, and deactivate prescriptions
- [ ] Client can log daily mood score
- [ ] Mood chart shows last 30 days on client portal
- [ ] Compliance alerts load on dashboard
- [ ] Analytics page shows accurate stats and charts
- [ ] File upload works and stores in Supabase Storage
- [ ] Download generates signed URL correctly
- [ ] Client sees shared documents in their portal

---

*Phase 3 of 4 — TherapyConnect Pro Hackathon*
*Next: PHASE4.md — Bonus Round B + Mobile*
