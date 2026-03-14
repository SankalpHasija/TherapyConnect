# TherapyConnect Pro — Boilerplate Scaffold Prompt

> Paste this entire prompt into Codex (or any AI coding agent).
> This generates the complete Phase 1 scaffold — nothing more, nothing less.
> Phase 2, 3, 4 features are added via separate prompts after this runs clean.
> Source of truth: MASTER.md

---

## PROMPT — PASTE EVERYTHING BELOW THIS LINE INTO CODEX

---

You are an expert full-stack Next.js developer. Scaffold a production-quality boilerplate for a telehealth SaaS application called **TherapyConnect Pro**.

Follow every instruction exactly. Do not add features not listed. Do not skip any file. Do not use placeholder text like "TODO: implement". Every file must be complete and functional.

---

## PART 1 — PROJECT SETUP

Initialize a Next.js 14 App Router project with the following configuration:

```bash
npx create-next-app@latest therapyconnect-pro \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias="@/*"
```

Then install all dependencies:

```bash
# Core
npm install @prisma/client prisma
npm install next-auth@beta
npm install bcryptjs
npm install @types/bcryptjs
npm install zod

# shadcn/ui — init first, then add components
npx shadcn@latest init

# shadcn components to install
npx shadcn@latest add button card input label textarea badge avatar
npx shadcn@latest add table dialog select tabs separator alert
npx shadcn@latest add form calendar popover dropdown-menu
npx shadcn@latest add toast sonner sheet scroll-area

# Utilities
npm install date-fns
npm install @tanstack/react-query
npm install lucide-react
```

---

## PART 2 — ENVIRONMENT FILES

### Create `.env.example`

```env
# Database (Supabase Postgres)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# NextAuth
NEXTAUTH_SECRET=your-secret-here-generate-with-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000

# OpenAI (Phase 2 — leave empty for now)
OPENAI_API_KEY=

# Stripe (Phase 2 — leave empty for now)
STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Resend Email (Phase 2 — leave empty for now)
RESEND_API_KEY=

# Upstash Redis (Phase 2 — leave empty for now)
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

### Create `.env.local`
Copy from `.env.example`. Fill in DATABASE_URL and NEXTAUTH_SECRET. Leave Phase 2+ keys empty.

---

## PART 3 — PRISMA SCHEMA

### Create `prisma/schema.prisma`

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
  TREATMENT_PLAN
}

model User {
  id            String          @id @default(cuid())
  name          String
  email         String          @unique
  password      String
  role          Role
  specialty     String?
  approach      String?
  bio           String?
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  clientProfiles  ClientProfile[]   @relation("PractitionerClients")
  appointments    Appointment[]     @relation("PractitionerAppointments")
  notes           ProgressNote[]    @relation("PractitionerNotes")
  clientProfile   ClientProfile?    @relation("ClientUser")
  clientAppts     Appointment[]     @relation("ClientAppointments")
  assessments     Assessment[]
  moodLogs        MoodLog[]
  payments        Payment[]
  documents       Document[]        @relation("PractitionerDocuments")
  clientDocuments Document[]        @relation("ClientDocuments")
  homeworkAssigned HomeworkTask[]   @relation("PractitionerTasks")
  homeworkTasks   HomeworkTask[]    @relation("ClientTasks")
  achievements    Achievement[]
  consultations   ConsultationPost[]
  consultResponses ConsultationResponse[]
}

model ClientProfile {
  id               String         @id @default(cuid())
  userId           String         @unique
  practitionerId   String
  dateOfBirth      DateTime?
  phone            String?
  emergencyContact String?
  diagnosis        String?
  medications      String?
  treatmentHistory String?
  intakeComplete   Boolean        @default(false)
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt

  user             User           @relation("ClientUser", fields: [userId], references: [id])
  practitioner     User           @relation("PractitionerClients", fields: [practitionerId], references: [id])
  intakeForms      IntakeForm[]
  prescriptions    Prescription[]
}

model Appointment {
  id               String            @id @default(cuid())
  practitionerId   String
  clientId         String
  datetime         DateTime
  duration         Int               @default(50)
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
  rawTranscript    String?
  subjective       String?
  objective        String?
  assessment       String?
  plan             String?
  aiGenerated      Boolean     @default(false)
  emotionAnalysis  Json?
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt

  appointment      Appointment @relation(fields: [appointmentId], references: [id])
  practitioner     User        @relation("PractitionerNotes", fields: [practitionerId], references: [id])
}

model IntakeForm {
  id              String        @id @default(cuid())
  clientProfileId String
  answers         Json
  submittedAt     DateTime      @default(now())

  clientProfile   ClientProfile @relation(fields: [clientProfileId], references: [id])
}

model Assessment {
  id            String      @id @default(cuid())
  clientId      String
  appointmentId String?
  type          String
  answers       Json
  totalScore    Int
  severity      String
  createdAt     DateTime    @default(now())

  client        User        @relation(fields: [clientId], references: [id])
  appointment   Appointment? @relation(fields: [appointmentId], references: [id])
}

model Payment {
  id              String        @id @default(cuid())
  clientId        String
  appointmentId   String        @unique
  amount          Int
  currency        String        @default("usd")
  stripeSessionId String?
  status          PaymentStatus @default(PENDING)
  createdAt       DateTime      @default(now())

  client          User          @relation(fields: [clientId], references: [id])
  appointment     Appointment   @relation(fields: [appointmentId], references: [id])
}

model Prescription {
  id              String        @id @default(cuid())
  clientProfileId String
  medication      String
  dosage          String
  frequency       String
  startDate       DateTime
  endDate         DateTime?
  notes           String?
  active          Boolean       @default(true)
  createdAt       DateTime      @default(now())

  clientProfile   ClientProfile @relation(fields: [clientProfileId], references: [id])
}

model MoodLog {
  id        String   @id @default(cuid())
  clientId  String
  score     Int
  notes     String?
  loggedAt  DateTime @default(now())

  client    User     @relation(fields: [clientId], references: [id])
}

model Document {
  id               String   @id @default(cuid())
  clientId         String
  practitionerId   String
  fileName         String
  fileUrl          String
  fileSize         Int
  mimeType         String
  sharedWithClient Boolean  @default(false)
  createdAt        DateTime @default(now())

  client           User     @relation("ClientDocuments", fields: [clientId], references: [id])
  practitioner     User     @relation("PractitionerDocuments", fields: [practitionerId], references: [id])
}

model HomeworkTask {
  id              String    @id @default(cuid())
  clientId        String
  practitionerId  String
  title           String
  description     String?
  dueDate         DateTime?
  completed       Boolean   @default(false)
  completedAt     DateTime?
  createdAt       DateTime  @default(now())

  client          User      @relation("ClientTasks", fields: [clientId], references: [id])
  practitioner    User      @relation("PractitionerTasks", fields: [practitionerId], references: [id])
}

model Achievement {
  id         String   @id @default(cuid())
  clientId   String
  type       String
  unlockedAt DateTime @default(now())

  client     User     @relation(fields: [clientId], references: [id])
}

model ConsultationPost {
  id              String                 @id @default(cuid())
  practitionerId  String
  title           String
  anonymisedCase  String
  tags            String[]
  createdAt       DateTime               @default(now())
  updatedAt       DateTime               @updatedAt

  practitioner    User                   @relation(fields: [practitionerId], references: [id])
  responses       ConsultationResponse[]
}

model ConsultationResponse {
  id              String           @id @default(cuid())
  postId          String
  practitionerId  String
  content         String
  createdAt       DateTime         @default(now())

  post            ConsultationPost @relation(fields: [postId], references: [id])
  practitioner    User             @relation(fields: [practitionerId], references: [id])
}
```

---

## PART 4 — LIB UTILITIES

### Create `lib/prisma.ts`
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### Create `lib/auth.ts`
```typescript
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user) return null

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!passwordMatch) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role as string
        session.user.id = token.id as string
      }
      return session
    },
  },
})
```

### Create `lib/validations/index.ts`
```typescript
import { z } from 'zod'

export const RegisterSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['PRACTITIONER', 'CLIENT', 'ADMIN']),
})

export const AppointmentSchema = z.object({
  clientId: z.string().cuid(),
  datetime: z.string().datetime(),
  duration: z.number().min(30).max(120).default(50),
})

export const NoteSchema = z.object({
  appointmentId: z.string().cuid(),
  subjective: z.string().optional(),
  objective: z.string().optional(),
  assessment: z.string().optional(),
  plan: z.string().optional(),
  type: z.enum(['SOAP', 'PROGRESS', 'INTAKE', 'ASSESSMENT', 'TREATMENT_PLAN']).default('SOAP'),
})

export const ClientProfileSchema = z.object({
  dateOfBirth: z.string().optional(),
  phone: z.string().optional(),
  emergencyContact: z.string().optional(),
  diagnosis: z.string().optional(),
  medications: z.string().optional(),
  treatmentHistory: z.string().optional(),
})

export const IntakeFormSchema = z.object({
  clientProfileId: z.string().cuid(),
  answers: z.record(z.string(), z.any()),
})
```

### Create `types/next-auth.d.ts`
```typescript
import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
    } & DefaultSession['user']
  }
}
```

---

## PART 5 — MIDDLEWARE

### Create `middleware.ts` (root level)
```typescript
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { nextUrl, auth: session } = req
  const isLoggedIn = !!session

  const isPractitionerRoute = nextUrl.pathname.startsWith('/dashboard') ||
    nextUrl.pathname.startsWith('/appointments') ||
    nextUrl.pathname.startsWith('/clients') ||
    nextUrl.pathname.startsWith('/billing')

  const isClientRoute = nextUrl.pathname.startsWith('/portal')
  const isAdminRoute = nextUrl.pathname.startsWith('/admin')
  const isAuthRoute = nextUrl.pathname === '/login' || nextUrl.pathname === '/register'

  if (!isLoggedIn && (isPractitionerRoute || isClientRoute || isAdminRoute)) {
    return NextResponse.redirect(new URL('/login', nextUrl))
  }

  if (isLoggedIn && isAuthRoute) {
    const role = (session as any)?.user?.role
    if (role === 'PRACTITIONER') return NextResponse.redirect(new URL('/dashboard', nextUrl))
    if (role === 'CLIENT') return NextResponse.redirect(new URL('/portal', nextUrl))
    if (role === 'ADMIN') return NextResponse.redirect(new URL('/admin', nextUrl))
  }

  if (isLoggedIn) {
    const role = (session as any)?.user?.role
    if (isPractitionerRoute && role !== 'PRACTITIONER') {
      return NextResponse.redirect(new URL('/login', nextUrl))
    }
    if (isClientRoute && role !== 'CLIENT') {
      return NextResponse.redirect(new URL('/login', nextUrl))
    }
    if (isAdminRoute && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/login', nextUrl))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

---

## PART 6 — API ROUTES

### `app/api/auth/[...nextauth]/route.ts`
```typescript
import { handlers } from '@/lib/auth'
export const { GET, POST } = handlers
```

### `app/api/users/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { RegisterSchema } from '@/lib/validations'
import bcrypt from 'bcryptjs'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true }
  })
  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = RegisterSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const { name, email, password, role } = parsed.data
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
  }
  const hashed = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { name, email, password: hashed, role },
  })
  return NextResponse.json({ id: user.id, email: user.email, role: user.role }, { status: 201 })
}
```

### `app/api/users/[id]/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json()
  const user = await prisma.user.update({
    where: { id: params.id },
    data: { role: body.role },
    select: { id: true, name: true, email: true, role: true },
  })
  return NextResponse.json(user)
}
```

### `app/api/appointments/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AppointmentSchema } from '@/lib/validations'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const practitionerId = searchParams.get('practitionerId')
  const clientId = searchParams.get('clientId')
  const status = searchParams.get('status')
  const date = searchParams.get('date')

  const where: any = {}
  if (practitionerId) where.practitionerId = practitionerId
  if (clientId) where.clientId = clientId
  if (status) where.status = status
  if (date === 'today') {
    const start = new Date(); start.setHours(0, 0, 0, 0)
    const end = new Date(); end.setHours(23, 59, 59, 999)
    where.datetime = { gte: start, lte: end }
  }

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      practitioner: { select: { id: true, name: true, email: true } },
      client: { select: { id: true, name: true, email: true } },
      payment: true,
    },
    orderBy: { datetime: 'asc' },
  })
  return NextResponse.json(appointments)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'PRACTITIONER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json()
  const parsed = AppointmentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const appointment = await prisma.appointment.create({
    data: {
      practitionerId: session.user.id,
      clientId: parsed.data.clientId,
      datetime: new Date(parsed.data.datetime),
      duration: parsed.data.duration,
    },
  })
  // Generate and store Jitsi room URL immediately
  await prisma.appointment.update({
    where: { id: appointment.id },
    data: { jitsiRoomUrl: `https://meet.jit.si/therapyconnect-${appointment.id}` },
  })
  return NextResponse.json(appointment, { status: 201 })
}
```

### `app/api/appointments/[id]/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const appointment = await prisma.appointment.findUnique({
    where: { id: params.id },
    include: {
      practitioner: { select: { id: true, name: true, email: true } },
      client: { select: { id: true, name: true, email: true } },
      notes: true,
      payment: true,
    },
  })
  if (!appointment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(appointment)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const appointment = await prisma.appointment.update({
    where: { id: params.id },
    data: body,
  })
  return NextResponse.json(appointment)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await prisma.appointment.update({
    where: { id: params.id },
    data: { status: 'CANCELLED' },
  })
  return NextResponse.json({ success: true })
}
```

### `app/api/clients/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'PRACTITIONER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { searchParams } = new URL(req.url)
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined

  const clients = await prisma.user.findMany({
    where: {
      role: 'CLIENT',
      clientProfile: { practitionerId: session.user.id },
    },
    include: {
      clientProfile: true,
    },
    take: limit,
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(clients)
}
```

### `app/api/clients/[id]/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ClientProfileSchema } from '@/lib/validations'
import { auth } from '@/lib/auth'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const client = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      clientProfile: { include: { intakeForms: true, prescriptions: true } },
      assessments: { orderBy: { createdAt: 'desc' }, take: 10 },
      moodLogs: { orderBy: { loggedAt: 'desc' }, take: 30 },
    },
  })
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(client)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || session.user.role !== 'PRACTITIONER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json()
  const parsed = ClientProfileSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const profile = await prisma.clientProfile.update({
    where: { userId: params.id },
    data: parsed.data,
  })
  return NextResponse.json(profile)
}
```

### `app/api/notes/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { NoteSchema } from '@/lib/validations'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const appointmentId = searchParams.get('appointmentId')
  const clientId = searchParams.get('clientId')

  const where: any = {}
  if (appointmentId) where.appointmentId = appointmentId
  if (clientId) {
    where.appointment = { clientId }
  }

  const notes = await prisma.progressNote.findMany({
    where,
    include: { appointment: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(notes)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'PRACTITIONER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json()
  const parsed = NoteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const note = await prisma.progressNote.create({
    data: {
      ...parsed.data,
      practitionerId: session.user.id,
      aiGenerated: body.aiGenerated ?? false,
      rawTranscript: body.rawTranscript ?? null,
    },
  })
  return NextResponse.json(note, { status: 201 })
}
```

### `app/api/notes/[id]/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const note = await prisma.progressNote.findUnique({ where: { id: params.id } })
  if (!note) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(note)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || session.user.role !== 'PRACTITIONER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json()
  const note = await prisma.progressNote.update({ where: { id: params.id }, data: body })
  return NextResponse.json(note)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || session.user.role !== 'PRACTITIONER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await prisma.progressNote.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
```

### `app/api/intake/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { IntakeFormSchema } from '@/lib/validations'
import { auth } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'CLIENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json()
  const parsed = IntakeFormSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const form = await prisma.intakeForm.create({ data: parsed.data })
  await prisma.clientProfile.update({
    where: { id: parsed.data.clientProfileId },
    data: { intakeComplete: true },
  })
  return NextResponse.json(form, { status: 201 })
}
```

### `app/api/intake/[clientId]/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(_: NextRequest, { params }: { params: { clientId: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const profile = await prisma.clientProfile.findUnique({
    where: { userId: params.clientId },
    include: { intakeForms: { orderBy: { submittedAt: 'desc' }, take: 1 } },
  })
  return NextResponse.json(profile)
}
```

---

## PART 7 — PAGES

### `app/layout.tsx`
```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TherapyConnect Pro',
  description: 'AI-powered telehealth practice management',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
```

### `app/page.tsx` — Landing page
```typescript
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-5xl font-bold text-slate-900">TherapyConnect Pro</h1>
        <p className="text-xl text-slate-600">
          AI-powered telehealth practice management for modern therapists.
          SOAP notes in seconds. Clinical insights at a glance.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/register">Get Started</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
```

### `app/(auth)/login/page.tsx` — Full login page with form, email + password, role-based redirect after auth

### `app/(auth)/register/page.tsx` — Registration with name, email, password, role selector (Practitioner / Client). On submit: POST /api/users then signIn.

### `app/(practitioner)/dashboard/page.tsx`
- Fetch today's appointments for logged-in practitioner
- Fetch last 5 clients
- Show 3 stat cards: Total Clients, Sessions This Week, Pending Payments
- Show appointments list with client name, time, status Badge
- Show recent clients list with name and last-seen date
- Show a Card with title "AI Insights" and body "Available in Phase 2" — styled with a subtle lock icon and muted text. DO NOT show any button or link.

### `app/(practitioner)/appointments/page.tsx`
- List all appointments for logged-in practitioner
- Filter tabs: All / Today / Upcoming / Past
- Each row: client name, date/time, duration, status Badge, View button
- "New Appointment" button → /appointments/new

### `app/(practitioner)/appointments/new/page.tsx`
- Form: select client (dropdown from /api/clients), date picker, time picker, duration select
- Submit → POST /api/appointments → redirect to /appointments

### `app/(practitioner)/appointments/[id]/page.tsx`
- Show appointment details: client, date, duration, status
- Show linked notes (if any)
- Show payment status
- "Join Session" button: rendered as disabled Button with tooltip "Available in Phase 2". DO NOT link anywhere. DO NOT show Jitsi.
- "Create Note" button → /clients/[clientId]/notes/new?appointmentId=[id]
- "Cancel Appointment" button → PATCH status to CANCELLED

### `app/(practitioner)/clients/page.tsx`
- Search input to filter clients by name
- Grid of client cards: name, diagnosis badge, last appointment date, View Profile button

### `app/(practitioner)/clients/[id]/page.tsx`
- Tabs: Profile | Notes | Assessments
- Profile tab: editable EHR fields (diagnosis, medications, treatment history, DOB, phone, emergency contact). Save button → PATCH /api/clients/[id]
- Notes tab: list of SOAP notes for this client. "New Note" button.
- Assessments tab: text "Assessment scores available in Phase 2" — muted, no button.

### `app/(practitioner)/clients/[id]/notes/new/page.tsx`
- SOAP note form with 4 textareas: Subjective, Objective, Assessment, Plan
- appointmentId pre-filled from query param
- A Card section at top labeled "AI Voice Recorder" with text "Voice-to-note generation available in Phase 2" — muted, no button or input.
- Submit → POST /api/notes → redirect to /clients/[id]

### `app/(practitioner)/clients/[id]/notes/[noteId]/page.tsx`
- Editable SOAP note. Load note by ID. Save → PATCH /api/notes/[id]. Delete button with confirm Dialog.

### `app/(client)/portal/page.tsx`
- Welcome message: "Good morning, [name]"
- If intake not complete: Alert banner "Please complete your intake form before your first session" with Link to /portal/intake
- Upcoming appointments list: date, time, practitioner name, status Badge
- "Join Session" button per appointment: disabled with tooltip "Available in Phase 2"
- Past sessions list

### `app/(client)/portal/book/page.tsx`
- Select practitioner, date, available time slot
- Submit → POST /api/appointments (as client booking)

### `app/(client)/portal/intake/page.tsx`
- Multi-step form (10 questions, 2 per step = 5 steps)
- Progress bar showing step X of 5
- Questions as specified in PHASE1.md
- Final step: submit → POST /api/intake → redirect to /portal

### `app/(admin)/admin/users/page.tsx`
- Table: Name | Email | Role | Created | Actions
- Role column: Select dropdown to change role → PATCH /api/users/[id]
- Fetch from GET /api/users

---

## PART 8 — COMPONENTS

### `components/layout/Navbar.tsx`
- Practitioner nav: Dashboard | Appointments | Clients | Billing
- Client nav: Home | Book Session | Assessments
- Admin nav: Users
- Right: user name + role badge + Sign Out button
- Responsive: hamburger on mobile using Sheet component

### `components/layout/PageWrapper.tsx`
```typescript
// Wraps page content with consistent padding and max-width
export default function PageWrapper({ children, title }: { children: React.ReactNode, title?: string }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {title && <h1 className="text-2xl font-semibold text-slate-900 mb-6">{title}</h1>}
        {children}
      </main>
    </div>
  )
}
```

---

## PART 9 — SEED DATA

### Create `prisma/seed.ts`

```typescript
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  const password = await bcrypt.hash('password123', 12)

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@therapyconnect.com' },
    update: {},
    create: { name: 'Admin User', email: 'admin@therapyconnect.com', password, role: 'ADMIN' },
  })

  // Practitioners
  const sarah = await prisma.user.upsert({
    where: { email: 'sarah.chen@therapyconnect.com' },
    update: {},
    create: {
      name: 'Dr. Sarah Chen',
      email: 'sarah.chen@therapyconnect.com',
      password,
      role: 'PRACTITIONER',
      specialty: 'Anxiety, Depression, CBT',
      approach: 'Cognitive Behavioral Therapy, Mindfulness',
      bio: 'Licensed clinical psychologist with 10 years of experience.',
    },
  })

  const james = await prisma.user.upsert({
    where: { email: 'james.wilson@therapyconnect.com' },
    update: {},
    create: {
      name: 'Dr. James Wilson',
      email: 'james.wilson@therapyconnect.com',
      password,
      role: 'PRACTITIONER',
      specialty: 'Trauma, PTSD, Family Therapy',
      approach: 'EMDR, Narrative Therapy',
      bio: 'Specialist in trauma-informed care.',
    },
  })

  // Clients with profiles
  const clientData = [
    { name: 'Emma Rodriguez', email: 'emma@example.com', diagnosis: 'Generalized Anxiety Disorder', medications: 'Sertraline 50mg', dob: '1992-03-15' },
    { name: 'Marcus Johnson', email: 'marcus@example.com', diagnosis: 'Major Depressive Disorder', medications: 'None', dob: '1988-07-22' },
    { name: 'Priya Patel', email: 'priya@example.com', diagnosis: 'PTSD, Anxiety', medications: 'Escitalopram 10mg', dob: '1995-11-08' },
    { name: 'David Kim', email: 'david@example.com', diagnosis: 'ADHD, Mild Depression', medications: 'Adderall XR 20mg', dob: '1990-05-30' },
    { name: 'Sophie Laurent', email: 'sophie@example.com', diagnosis: 'Adjustment Disorder', medications: 'None', dob: '1997-01-12' },
  ]

  const clients = []
  for (const c of clientData) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: { name: c.name, email: c.email, password, role: 'CLIENT' },
    })
    const profile = await prisma.clientProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        practitionerId: sarah.id,
        dateOfBirth: new Date(c.dob),
        emergencyContact: 'Emergency Contact: +1 555 000 0000',
        diagnosis: c.diagnosis,
        medications: c.medications,
        treatmentHistory: 'Previously seen therapist for 6 months in 2022.',
        intakeComplete: true,
      },
    })
    // Intake form
    await prisma.intakeForm.create({
      data: {
        clientProfileId: profile.id,
        answers: {
          q1: 'I have been feeling anxious and overwhelmed at work.',
          q2: 'Yes, I saw a therapist briefly in 2022.',
          q3: c.medications !== 'None' ? `Yes: ${c.medications}` : 'No',
          q4: c.diagnosis,
          q5: 'Emergency Contact: +1 555 000 0000',
          q6: 'Reduce anxiety, improve sleep, develop coping strategies.',
          q7: 'Recent job change and relocation.',
          q8: '4',
          q9: '8',
          q10: 'I prefer a calm, structured approach.',
        },
      },
    })
    clients.push(user)
  }

  // Appointments — mix of past COMPLETED and future SCHEDULED
  const now = new Date()
  const appointmentDefs = [
    { clientIdx: 0, daysOffset: -14, status: 'COMPLETED' },
    { clientIdx: 0, daysOffset: -7, status: 'COMPLETED' },
    { clientIdx: 0, daysOffset: 7, status: 'SCHEDULED' },
    { clientIdx: 1, daysOffset: -10, status: 'COMPLETED' },
    { clientIdx: 1, daysOffset: 3, status: 'SCHEDULED' },
    { clientIdx: 2, daysOffset: -5, status: 'COMPLETED' },
    { clientIdx: 2, daysOffset: 10, status: 'SCHEDULED' },
    { clientIdx: 3, daysOffset: -3, status: 'COMPLETED' },
    { clientIdx: 3, daysOffset: 14, status: 'SCHEDULED' },
    { clientIdx: 4, daysOffset: 1, status: 'SCHEDULED' },
  ]

  const appointments = []
  for (const def of appointmentDefs) {
    const dt = new Date(now)
    dt.setDate(dt.getDate() + def.daysOffset)
    dt.setHours(10 + def.clientIdx, 0, 0, 0)
    const appt = await prisma.appointment.create({
      data: {
        practitionerId: sarah.id,
        clientId: clients[def.clientIdx].id,
        datetime: dt,
        duration: 50,
        status: def.status as any,
      },
    })
    await prisma.appointment.update({
      where: { id: appt.id },
      data: { jitsiRoomUrl: `https://meet.jit.si/therapyconnect-${appt.id}` },
    })
    appointments.push(appt)
  }

  // Progress notes on COMPLETED appointments
  const completedAppts = appointments.filter((_, i) => appointmentDefs[i].status === 'COMPLETED')
  const soapNotes = [
    { s: 'Client reports feeling more anxious this week due to work deadlines.', o: 'Client appeared tense, made limited eye contact. Speech was rapid.', a: 'GAD symptoms moderately elevated. Avoidance coping observed.', p: 'Continue CBT techniques. Assign breathing exercise homework.' },
    { s: 'Client reports some improvement in sleep quality after implementing sleep hygiene strategies.', o: 'More relaxed posture. Better eye contact than last session.', a: 'Positive progress. Sleep improving.', p: 'Continue sleep diary. Introduce progressive muscle relaxation.' },
    { s: 'Client expresses low mood and reduced motivation this week.', o: 'Affect flat. Psychomotor slowing observed.', a: 'MDD symptoms present. Behavioural activation needed.', p: 'Assign 3 pleasant activities daily. Review medication adherence.' },
    { s: 'Client reports nightmares returning this week.', o: 'Heightened startle response noted. Avoidance of trauma topics.', a: 'PTSD symptoms active. Trauma processing too rapid, pace needed.', p: 'Slow down exposure work. Focus on grounding techniques.' },
    { s: 'Client feeling overwhelmed by new responsibilities at work.', o: 'Tearful at start of session. Stabilised during session.', a: 'Adjustment disorder with anxious mood.', p: 'Cognitive restructuring around performance expectations.' },
    { s: 'Client reports completing all homework tasks this week.', o: 'Visibly proud. Engaged throughout session.', a: 'Good progress. Self-efficacy improving.', p: 'Increase homework complexity. Discuss relapse prevention.' },
    { s: 'Client struggled with the breathing exercises, reports feeling silly doing them.', o: 'Resistant at first but engaged when normalised.', a: 'Mild resistance to behavioural interventions. Psychoeducation helpful.', p: 'Reframe exercises as athletic training. Practice in session.' },
    { s: 'Client reports first week without a panic attack in two months.', o: 'Brighter affect. Initiated conversation about future goals.', a: 'Significant improvement. Anxiety management skills consolidating.', p: 'Begin tapering session frequency discussion. Maintenance planning.' },
  ]

  for (let i = 0; i < Math.min(completedAppts.length, soapNotes.length); i++) {
    await prisma.progressNote.create({
      data: {
        appointmentId: completedAppts[i].id,
        practitionerId: sarah.id,
        type: 'SOAP',
        subjective: soapNotes[i].s,
        objective: soapNotes[i].o,
        assessment: soapNotes[i].a,
        plan: soapNotes[i].p,
        aiGenerated: i % 3 === 0,
      },
    })
  }

  // Assessments for first 3 clients
  const phq9Scores = [
    { answers: [2,2,1,2,1,1,0,0,0], total: 9, severity: 'mild' },
    { answers: [3,3,2,2,1,2,1,0,1], total: 15, severity: 'moderately-severe' },
    { answers: [2,1,2,1,1,1,0,0,0], total: 8, severity: 'mild' },
  ]

  for (let i = 0; i < 3; i++) {
    await prisma.assessment.create({
      data: {
        clientId: clients[i].id,
        type: 'PHQ9',
        answers: phq9Scores[i].answers,
        totalScore: phq9Scores[i].total,
        severity: phq9Scores[i].severity,
      },
    })
  }

  // Payments for completed appointments
  for (let i = 0; i < 3; i++) {
    await prisma.payment.create({
      data: {
        clientId: clients[i].id,
        appointmentId: completedAppts[i].id,
        amount: 15000,
        status: i < 2 ? 'PAID' : 'PENDING',
        stripeSessionId: i < 2 ? `cs_test_seed_${i}` : null,
      },
    })
  }

  console.log('✅ Seeding complete.')
  console.log('---')
  console.log('Login credentials (all use password: password123)')
  console.log('Admin:        admin@therapyconnect.com')
  console.log('Practitioner: sarah.chen@therapyconnect.com')
  console.log('Practitioner: james.wilson@therapyconnect.com')
  console.log('Client:       emma@example.com')
  console.log('Client:       marcus@example.com')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

### Add to `package.json`:
```json
"prisma": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
}
```

---

## PART 10 — README

### Create `README.md`

```markdown
# TherapyConnect Pro

AI-powered telehealth practice management platform.

## Quick Start

1. Clone and install
   npm install

2. Set up environment
   cp .env.example .env.local
   # Fill in DATABASE_URL and NEXTAUTH_SECRET

3. Generate NEXTAUTH_SECRET
   openssl rand -base64 32

4. Push DB schema
   npx prisma db push

5. Seed demo data
   npx prisma db seed

6. Run locally
   npm run dev

Open http://localhost:3000

## Demo Login Credentials (all: password123)
- Admin:        admin@therapyconnect.com
- Practitioner: sarah.chen@therapyconnect.com
- Client:       emma@example.com

## Tech Stack
Next.js 14 · TypeScript · Tailwind · shadcn/ui · Prisma · Supabase · NextAuth v5

## Phases
- Phase 1 (this): Foundation — auth, scheduling, EHR, notes
- Phase 2: Jitsi video, AI SOAP notes, Stripe, PHQ-9/GAD-7
- Phase 3: Treatment plans, prescriptions, analytics
- Phase 4: Mobile app, gamification, peer consultation
```

---

## IMPORTANT RULES — MUST FOLLOW

1. Every page fetches real data from the database — no hardcoded mock data in components
2. All API routes check authentication before doing anything
3. Role-based access enforced in both middleware.ts AND inside each API route
4. TypeScript strict mode — zero `any` types except where explicitly noted
5. All API inputs validated with Zod before touching Prisma
6. Use Prisma client singleton from `lib/prisma.ts` — never `new PrismaClient()` in routes
7. shadcn/ui components for all UI — no raw HTML form elements
8. Phase 2+ features: render NOTHING — not a disabled button, not a placeholder div, not a coming-soon message. The only exception is the explicitly described "Available in Phase 2" cards on dashboard and the disabled Join Session button. Everything else is either fully functional or completely absent.
9. Jitsi room URL is generated and stored on appointment creation — the URL is stored in DB but never rendered in any component
10. Seed script uses `upsert` — safe to re-run multiple times without duplicate errors

---

## RUN ORDER AFTER CODE IS GENERATED

```bash
npm install
npx prisma generate
npx prisma db push
npx prisma db seed
npm run dev
```

Verify at http://localhost:3000 before deploying.

Deploy to Vercel:
```bash
# Push to GitHub, then connect repo in Vercel dashboard
# Add all .env.local variables to Vercel environment variables
# Deploy
```

---

*TherapyConnect Pro — Phase 1 Boilerplate Prompt*
*Generated from MASTER.md + PHASE1.md*
*Next prompt: PHASE2-PROMPT.md*
