# TherapyConnect Pro — Phase 4: Bonus Round B (Heroic + Mobile)

> Source of truth: MASTER.md
> Prerequisite: Phase 1 + 2 + 3 fully complete and deployed.
> Goal: Beyond-market innovation + native mobile wrapper.
> Estimated time: ~2 hours

---

## Phase 4 Checklist

- [ ] Voice emotion analysis across sessions
- [ ] AI therapist matching from intake
- [ ] Gamified client engagement (streaks + tasks)
- [ ] Peer consultation network
- [ ] Capacitor WebView mobile app (iOS + Android)

---

## Features to Build

### 22. Voice Emotion Analysis

**What it does:**
- Analyses the emotional tone of session transcripts across all of a client's sessions
- GPT-4o-mini reads transcripts and identifies emotional patterns over time
- Shown as a timeline on client profile: "Session 1: anxious, guarded → Session 5: open, hopeful"
- Helps practitioner track emotional progress beyond clinical scores

**How it works:**
- Only available for sessions that have a rawTranscript stored (Phase 2 voice notes)
- If no transcripts exist, shows a prompt: "Add voice-recorded notes to enable emotion analysis"

**API route `/api/ai/emotion-analysis`:**
```typescript
// POST — body: { clientId }
// Fetches: all ProgressNotes with rawTranscript for this client, ordered by date
// For each transcript, sends to GPT-4o-mini:

const systemPrompt = `You are a clinical psychologist specialising in emotional pattern recognition.
Analyse this therapy session transcript and return a JSON object:
{
  "dominantEmotions": ["array of 2-3 primary emotions expressed"],
  "tone": "single word describing overall tone (e.g. guarded, open, distressed, hopeful)",
  "engagementLevel": "low | medium | high",
  "keyThemes": ["array of 2-3 themes discussed"],
  "progressIndicator": "regressing | stable | progressing"
}
Be concise. Use clinical language appropriate for a therapy context.`;

// Returns array of per-session analysis objects with date

// Cache result — store as JSON on ProgressNote record (add emotionAnalysis Json? field to schema)
```

**Add to Prisma schema:**
```prisma
// Add to ProgressNote model:
emotionAnalysis  Json?   // stores cached emotion analysis result
```

**UI on `/clients/[id]` → new "Emotion Timeline" tab:**
```
Timeline visualization:
  - Horizontal timeline, one node per session with transcripts
  - Each node: date + dominant tone word + color (warm=distressed, cool=calm, green=hopeful)
  - Click a node: expand to show full emotion analysis for that session
  - Summary card at top: "Overall progress direction: Improving"
  - Recharts LineChart showing engagementLevel over time (low=1, medium=2, high=3)
```

**shadcn components:** Card, Badge, Tabs, Separator, ScrollArea, Tooltip

---

### 23. AI Therapist Matching

**What it does:**
- New client registers and completes intake form
- AI analyses intake answers and matches client to the best-fit practitioner
- Based on: presenting problems, therapeutic goals, preferred approach
- Shown after intake form submission as a recommendation

**How it works:**
- Only useful if app has multiple practitioners (seed data has 2)
- Practitioner profiles need a specialty/approach field (add to User model)

**Add to Prisma schema:**
```prisma
// Add to User model (practitioners only):
specialty      String?  // e.g., "CBT, Anxiety, Depression"
approach       String?  // e.g., "Cognitive Behavioral Therapy, Mindfulness"
bio            String?  // short bio for client-facing matching
```

**API route `/api/ai/match-therapist`:**
```typescript
// POST — body: { intakeAnswers }
// Fetches: all PRACTITIONER users with specialty + approach fields
// Sends to GPT-4o-mini:

const systemPrompt = `You are a therapy practice coordinator.
Given a new client's intake answers and a list of available therapists,
recommend the best match.
Return JSON:
{
  "recommendedPractitionerId": "string",
  "matchReason": "2-3 sentence explanation of why this therapist is a good fit",
  "alternativePractitionerId": "string (second best option)",
  "alternativeReason": "1-2 sentence explanation"
}
Consider: presenting problems, therapeutic goals, and therapist specialties.`;
```

**UI — post-intake flow on `/portal/intake`:**
```
After intake submission:
  Step 1: "Analysing your needs..." (loading state, 2-3 seconds)
  Step 2: Show matching result card:
    - Practitioner name + photo placeholder + specialty badges
    - Match reason (2-3 sentences from AI)
    - "Book with Dr. [Name]" primary button
    - "See other therapists" secondary link
    - Alternative match shown collapsed below
```

**Practitioner profile page — add specialty editor:**
- `/dashboard/profile` — practitioners can set specialty, approach, bio
- These fields feed the matching algorithm

**shadcn components:** Card, Badge, Avatar, Button, Progress (matching animation), Separator

---

### 24. Gamified Client Engagement

**What it does:**
- Encourages clients to stay engaged between sessions
- Streak system: consecutive days of mood logging
- Homework tasks: practitioner assigns tasks, client marks complete
- Achievement badges: first intake, 7-day streak, 10 sessions completed

**Add to Prisma schema:**
```prisma
model HomeworkTask {
  id              String   @id @default(cuid())
  clientId        String
  practitionerId  String
  title           String
  description     String?
  dueDate         DateTime?
  completed       Boolean  @default(false)
  completedAt     DateTime?
  createdAt       DateTime @default(now())

  client          User     @relation("ClientTasks", fields: [clientId], references: [id])
  practitioner    User     @relation("PractitionerTasks", fields: [practitionerId], references: [id])
}

model Achievement {
  id              String   @id @default(cuid())
  clientId        String
  type            String   // "first_intake" | "7_day_streak" | "10_sessions" | "first_assessment"
  unlockedAt      DateTime @default(now())

  client          User     @relation("ClientAchievements", fields: [clientId], references: [id])
}
```

**Streak calculation:**
```typescript
// lib/streaks.ts
// Count consecutive days with MoodLog entries
// Streak resets if a day is missed
// Store current streak count on user (or compute from MoodLog)
async function calculateStreak(clientId: string): Promise<number>
```

**Achievement triggers (check on relevant actions):**
- `first_intake` → triggered when intake form submitted
- `first_assessment` → triggered when first PHQ-9/GAD-7 submitted
- `7_day_streak` → triggered when streak reaches 7
- `10_sessions` → triggered when 10th appointment completed

**Client portal `/portal` — gamification section:**
```
Streak card:
  - Fire icon + "{n} day streak"
  - Calendar dots showing last 7 days (filled = logged, empty = missed)
  - "Log today's mood" button if not yet logged today

Homework tasks card:
  - List of assigned tasks with due dates
  - Checkbox to mark complete
  - Completion confetti animation (CSS only)

Achievements shelf:
  - Row of badge icons (locked = gray, unlocked = colored)
  - Tooltip on hover showing achievement name
  - New achievement: toast notification + badge glow animation
```

**Practitioner view on `/clients/[id]`:**
- Homework tab: assign new tasks, view completion history
- Client engagement score: percentage of mood logs in last 30 days

**API routes:**
- `GET /api/homework?clientId=` — get tasks
- `POST /api/homework` — create task (practitioner only)
- `PATCH /api/homework/[id]` — mark complete (client only)
- `GET /api/achievements/[clientId]` — get achievements
- `POST /api/achievements` — unlock achievement (internal use)

**shadcn components:** Card, Checkbox, Badge, Progress, Tooltip, toast (Sonner)

---

### 25. Peer Consultation Network

**What it does:**
- Practitioners post anonymised clinical cases for peer input
- Other practitioners respond with suggestions
- All client identifiers removed before posting
- Creates a community knowledge layer within the platform

**Add to Prisma schema:**
```prisma
model ConsultationPost {
  id              String               @id @default(cuid())
  practitionerId  String
  title           String
  anonymisedCase  String               // client details removed
  tags            String[]             // e.g., ["anxiety", "CBT", "adolescent"]
  createdAt       DateTime             @default(now())
  updatedAt       DateTime             @updatedAt

  practitioner    User                 @relation(fields: [practitionerId], references: [id])
  responses       ConsultationResponse[]
}

model ConsultationResponse {
  id              String             @id @default(cuid())
  postId          String
  practitionerId  String
  content         String
  createdAt       DateTime           @default(now())

  post            ConsultationPost   @relation(fields: [postId], references: [id])
  practitioner    User               @relation(fields: [practitionerId], references: [id])
}
```

**AI anonymisation before posting:**
```typescript
// API route pre-processes the case text through GPT-4o-mini:
const systemPrompt = `You are a clinical privacy officer.
Remove all personally identifiable information from this case description.
Replace names with [CLIENT], ages with approximate ranges, specific locations with regions.
Keep all clinical details intact. Return only the anonymised text.`;
```

**Page `/consultation`:**
```
Layout:
  Left: Post list
    - Search + tag filter
    - Each post: title, tag chips, response count, posted by "Dr. [first name only]", time ago
    - Click to expand

  Right: Create post panel
    - "New Consultation" button
    - Form: title + case description
    - AI anonymisation runs on submit (shows diff: "Removed: John → [CLIENT]")
    - Confirm and post
    - Tag selector (multi-select)

Post detail (Dialog or side panel):
  - Full anonymised case
  - Responses sorted by date
  - Response form at bottom
  - Practitioner names shown as first name only
```

**API routes:**
- `GET /api/consultation` — list posts with response counts
- `POST /api/consultation` — create post (runs AI anonymisation)
- `GET /api/consultation/[id]` — get post + responses
- `POST /api/consultation/[id]/respond` — add response

**shadcn components:** Card, Textarea, Badge, Dialog, ScrollArea, Avatar, Separator, Input (search)

---

### 26. Multi-Device Native App — Capacitor WebView

**What it does:**
- Wraps the deployed Next.js app (Vercel URL) in a native WebView
- Works on iOS and Android
- Adds push notification support for appointment reminders
- Looks and feels native on mobile
- No separate codebase — same app, same features

**Install:**
```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios @capacitor/android
npm install @capacitor/push-notifications
npx cap init "TherapyConnect Pro" com.therapyconnect.pro
```

**capacitor.config.ts:**
```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.therapyconnect.pro',
  appName: 'TherapyConnect Pro',
  webDir: 'out',  // Next.js static export
  server: {
    url: 'https://your-vercel-url.vercel.app',  // Point to live Vercel deployment
    cleartext: false,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
```

**Next.js static export config:**
```javascript
// next.config.js — add for Capacitor compatibility
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Only needed if building static. For server: use server.url above.
  // IMPORTANT: Using server.url in capacitor.config.ts is simpler — no static export needed
}
```

**Build commands:**
```bash
# Option A: Point to live Vercel URL (recommended — simpler)
# Just set server.url in capacitor.config.ts and run:
npx cap add ios
npx cap add android
npx cap open ios    # Opens Xcode
npx cap open android  # Opens Android Studio

# Option B: Static export (if no live URL yet)
npm run build
npx cap sync
npx cap open ios
```

**Push notifications for appointment reminders:**
```typescript
// In Resend email flow (Phase 2), also trigger push via Capacitor
// For hackathon: show how to register for push on mobile
// Actual push delivery: use Firebase Cloud Messaging (FCM) — Phase 4 add-on

// lib/push.ts
// Register device token on app start
// Store token against user in DB
// Send push when reminder email is sent
```

**Mobile-specific UI adjustments:**
```css
/* Add to globals.css */
@media (max-width: 640px) {
  /* Safe area insets for iPhone notch */
  .main-content { padding-top: env(safe-area-inset-top); }
  .bottom-nav { padding-bottom: env(safe-area-inset-bottom); }

  /* Larger touch targets */
  button { min-height: 44px; }
  a { min-height: 44px; display: flex; align-items: center; }

  /* Hide desktop-only elements */
  .desktop-only { display: none; }
}
```

**Bottom navigation for mobile:**
```typescript
// components/layout/MobileNav.tsx
// Only shown on mobile (max-width: 640px)
// Practitioner tabs: Dashboard | Appointments | Clients | Billing
// Client tabs: Home | Book | Session | Assessments
// Uses Next.js Link for navigation
// Active tab highlighted
```

**Demo the mobile app:**
1. Run on iOS Simulator (Mac only) via Xcode
2. Or run on Android Emulator via Android Studio
3. Or use Capacitor Live Reload: `npx cap run ios --livereload`

---

## Phase 4 Codex Prompt

```
Building on TherapyConnect Pro (Phase 1 + 2 + 3 complete).
Add the following Phase 4 features.

FEATURE 1 — VOICE EMOTION ANALYSIS:
Add emotionAnalysis Json? field to ProgressNote in schema.
Create /api/ai/emotion-analysis POST route.
Analyses rawTranscript of all notes for a client using GPT-4o-mini.
Returns per-session: dominantEmotions[], tone, engagementLevel, keyThemes[], progressIndicator.
Add "Emotion Timeline" tab to /clients/[id] with colored timeline nodes and engagement chart.

FEATURE 2 — AI THERAPIST MATCHING:
Add specialty, approach, bio fields to User model.
Create /api/ai/match-therapist POST route.
After intake submission, show matching result card with recommended practitioner.
Create /dashboard/profile page for practitioners to set their specialty and approach.

FEATURE 3 — GAMIFICATION:
Add HomeworkTask and Achievement models to Prisma schema.
Create lib/streaks.ts to calculate consecutive mood log streak.
Add streak card, homework tasks, and achievements shelf to /portal.
Create homework management on /clients/[id] for practitioner.
API routes: GET POST /api/homework, PATCH /api/homework/[id], GET POST /api/achievements.
Achievement triggers: first_intake, first_assessment, 7_day_streak, 10_sessions.

FEATURE 4 — PEER CONSULTATION:
Add ConsultationPost and ConsultationResponse to Prisma schema.
Create /consultation page with post list, create form, and responses.
POST route runs AI anonymisation before storing.
API routes: GET POST /api/consultation, GET /api/consultation/[id], POST /api/consultation/[id]/respond.

FEATURE 5 — CAPACITOR MOBILE:
Install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android.
Create capacitor.config.ts pointing server.url to Vercel deployment.
Add mobile-responsive CSS with safe area insets and touch targets.
Create components/layout/MobileNav.tsx for bottom navigation on mobile.
Add README section: "Mobile Build" with commands to open in Xcode and Android Studio.
```

---

## Definition of Done — Phase 4

- [ ] Emotion analysis loads for clients with voice-recorded notes
- [ ] Timeline shows per-session tone with color coding
- [ ] AI returns a therapist match recommendation after intake
- [ ] Client sees match result card with explanation
- [ ] Streak counter shows correctly based on mood logs
- [ ] Homework tasks can be assigned and marked complete
- [ ] Achievements unlock at correct triggers
- [ ] Consultation posts anonymise client data via AI
- [ ] Practitioners can post and respond to cases
- [ ] Capacitor app opens in iOS Simulator or Android Emulator
- [ ] Mobile navigation works with bottom nav tabs
- [ ] Jitsi video works inside WebView on mobile

---

## Post-Hackathon Roadmap (Do Not Build Now)

These ideas from the blueprint are genuine product opportunities — mention them in your pitch:

1. **Full WebRTC infrastructure** — replace Jitsi with custom signalling + TURN servers for true white-label HIPAA video
2. **Insurance billing integration** — Change Healthcare API for claims processing
3. **Wearable device sync** — Apple Health / Fitbit for physiological mood markers
4. **VR therapy modules** — Unity + WebXR for exposure therapy sessions
5. **Blockchain patient records** — Patient-owned health data on a permissioned chain
6. **Smart scheduling AI** — Train on historical no-show data to predict and prevent cancellations
7. **Telehealth kiosk network** — Hardware deployment for underserved communities
8. **Multi-language + real-time translation** — Serve non-English speaking clients
9. **Peer support community** — Moderated anonymous client-to-client support
10. **Insurance pre-authorization AI** — Automate prior auth submissions

---

*Phase 4 of 4 — TherapyConnect Pro Hackathon*
*For questions: refer back to MASTER.md as the single source of truth.*
