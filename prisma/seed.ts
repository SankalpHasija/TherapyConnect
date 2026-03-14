import bcrypt from 'bcryptjs'
import { prisma } from '../src/lib/prisma'

type ClientSeed = {
  name: string
  email: string
  diagnosis: string
  medications: string
  treatmentHistory: string
  intakeAnswers: Record<string, string | number>
}

type AppointmentSeed = {
  id: string
  clientEmail: string
  daysFromNow: number
  status: 'SCHEDULED' | 'COMPLETED'
}

const password = 'password123'

const clients: ClientSeed[] = [
  {
    name: 'Emma Rodriguez',
    email: 'emma@example.com',
    diagnosis: 'Generalized Anxiety Disorder',
    medications: 'Sertraline 50mg',
    treatmentHistory: 'Brief CBT program in 2021 with positive response.',
    intakeAnswers: {
      q1: 'Persistent worry and difficulty sleeping.',
      q2: 'Yes - Attended CBT sessions for 4 months in 2021.',
      q3: 'Yes - Sertraline 50mg daily.',
      q4: 'Generalized Anxiety Disorder.',
      q5: 'Ana Rodriguez, (555) 123-4411',
      q6: 'Reduce daily anxiety and improve sleep.',
      q7: 'Recent relocation for work.',
      q8: 6,
      q9: 5,
      q10: 'Stress spikes during work presentations.',
    },
  },
  {
    name: 'Marcus Johnson',
    email: 'marcus@example.com',
    diagnosis: 'Major Depressive Disorder',
    medications: 'None',
    treatmentHistory: 'No formal therapy; has tried self-help resources.',
    intakeAnswers: {
      q1: 'Low mood, lack of motivation, and fatigue.',
      q2: 'No',
      q3: 'No',
      q4: 'Major Depressive Disorder.',
      q5: 'Tanya Johnson, (555) 332-2290',
      q6: 'Regain energy and rebuild routines.',
      q7: 'Job loss six months ago.',
      q8: 4,
      q9: 7,
      q10: 'Feels isolated from friends.',
    },
  },
  {
    name: 'Priya Patel',
    email: 'priya@example.com',
    diagnosis: 'PTSD, Anxiety',
    medications: 'Escitalopram 10mg',
    treatmentHistory: 'Trauma-focused counseling in 2022.',
    intakeAnswers: {
      q1: 'Nightmares and hypervigilance after a traumatic event.',
      q2: 'Yes - Trauma counseling in 2022 for 8 sessions.',
      q3: 'Yes - Escitalopram 10mg daily.',
      q4: 'PTSD and anxiety disorder.',
      q5: 'Ravi Patel, (555) 773-1188',
      q6: 'Reduce nightmares and feel safe in public spaces.',
      q7: 'Anniversary of the traumatic event.',
      q8: 5,
      q9: 6,
      q10: 'Anxiety increases with travel.',
    },
  },
  {
    name: 'David Kim',
    email: 'david@example.com',
    diagnosis: 'ADHD, Mild Depression',
    medications: 'Adderall XR 20mg',
    treatmentHistory: 'Coaching for ADHD in college.',
    intakeAnswers: {
      q1: 'Difficulty focusing and staying organized.',
      q2: 'Yes - ADHD coaching in college.',
      q3: 'Yes - Adderall XR 20mg.',
      q4: 'ADHD and mild depressive symptoms.',
      q5: 'Grace Kim, (555) 901-7744',
      q6: 'Improve executive functioning and mood stability.',
      q7: 'Promoted to team lead at work.',
      q8: 6,
      q9: 5,
      q10: 'Struggles with time management.',
    },
  },
  {
    name: 'Sophie Laurent',
    email: 'sophie@example.com',
    diagnosis: 'Adjustment Disorder',
    medications: 'None',
    treatmentHistory: 'No prior therapy.',
    intakeAnswers: {
      q1: 'Difficulty adjusting after moving to a new city.',
      q2: 'No',
      q3: 'No',
      q4: 'Adjustment disorder.',
      q5: 'Julien Laurent, (555) 665-2211',
      q6: 'Build coping skills and social support.',
      q7: 'Recent move and new job.',
      q8: 7,
      q9: 6,
      q10: 'Feels anxious about making friends.',
    },
  },
]

const appointments: AppointmentSeed[] = [
  { id: 'appt-emma-1', clientEmail: 'emma@example.com', daysFromNow: -14, status: 'COMPLETED' },
  { id: 'appt-emma-2', clientEmail: 'emma@example.com', daysFromNow: -7, status: 'COMPLETED' },
  { id: 'appt-emma-3', clientEmail: 'emma@example.com', daysFromNow: 7, status: 'SCHEDULED' },
  { id: 'appt-marcus-1', clientEmail: 'marcus@example.com', daysFromNow: -10, status: 'COMPLETED' },
  { id: 'appt-marcus-2', clientEmail: 'marcus@example.com', daysFromNow: 3, status: 'SCHEDULED' },
  { id: 'appt-priya-1', clientEmail: 'priya@example.com', daysFromNow: -5, status: 'COMPLETED' },
  { id: 'appt-priya-2', clientEmail: 'priya@example.com', daysFromNow: 10, status: 'SCHEDULED' },
  { id: 'appt-david-1', clientEmail: 'david@example.com', daysFromNow: -3, status: 'COMPLETED' },
  { id: 'appt-david-2', clientEmail: 'david@example.com', daysFromNow: 14, status: 'SCHEDULED' },
  { id: 'appt-sophie-1', clientEmail: 'sophie@example.com', daysFromNow: 1, status: 'SCHEDULED' },
]

async function main(): Promise<void> {
  const hashed = await bcrypt.hash(password, 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@therapyconnect.com' },
    update: {
      name: 'Admin',
      password: hashed,
      role: 'ADMIN',
    },
    create: {
      name: 'Admin',
      email: 'admin@therapyconnect.com',
      password: hashed,
      role: 'ADMIN',
    },
  })

  const sarah = await prisma.user.upsert({
    where: { email: 'sarah.chen@therapyconnect.com' },
    update: {
      name: 'Dr. Sarah Chen',
      password: hashed,
      role: 'PRACTITIONER',
      specialty: 'Anxiety, Depression, CBT',
      approach: 'Cognitive Behavioral Therapy, Mindfulness',
    },
    create: {
      name: 'Dr. Sarah Chen',
      email: 'sarah.chen@therapyconnect.com',
      password: hashed,
      role: 'PRACTITIONER',
      specialty: 'Anxiety, Depression, CBT',
      approach: 'Cognitive Behavioral Therapy, Mindfulness',
    },
  })

  const james = await prisma.user.upsert({
    where: { email: 'james.wilson@therapyconnect.com' },
    update: {
      name: 'Dr. James Wilson',
      password: hashed,
      role: 'PRACTITIONER',
      specialty: 'Trauma, PTSD, Family Therapy',
      approach: 'EMDR, Narrative Therapy',
    },
    create: {
      name: 'Dr. James Wilson',
      email: 'james.wilson@therapyconnect.com',
      password: hashed,
      role: 'PRACTITIONER',
      specialty: 'Trauma, PTSD, Family Therapy',
      approach: 'EMDR, Narrative Therapy',
    },
  })

  void admin
  void james

  const clientUsers = [] as Array<{ userId: string; email: string }>

  for (const client of clients) {
    const user = await prisma.user.upsert({
      where: { email: client.email },
      update: {
        name: client.name,
        password: hashed,
        role: 'CLIENT',
      },
      create: {
        name: client.name,
        email: client.email,
        password: hashed,
        role: 'CLIENT',
      },
    })

    clientUsers.push({ userId: user.id, email: client.email })

    const profile = await prisma.clientProfile.upsert({
      where: { userId: user.id },
      update: {
        practitionerId: sarah.id,
        diagnosis: client.diagnosis,
        medications: client.medications,
        treatmentHistory: client.treatmentHistory,
        intakeComplete: true,
      },
      create: {
        userId: user.id,
        practitionerId: sarah.id,
        diagnosis: client.diagnosis,
        medications: client.medications,
        treatmentHistory: client.treatmentHistory,
        intakeComplete: true,
      },
    })

    await prisma.intakeForm.upsert({
      where: { id: `intake-${user.id}` },
      update: {
        clientProfileId: profile.id,
        answers: client.intakeAnswers,
      },
      create: {
        id: `intake-${user.id}`,
        clientProfileId: profile.id,
        answers: client.intakeAnswers,
      },
    })
  }

  const userByEmail = new Map(clientUsers.map((user) => [user.email, user.userId]))

  for (const appointment of appointments) {
    const clientId = userByEmail.get(appointment.clientEmail)
    if (!clientId) continue

    const date = new Date()
    date.setDate(date.getDate() + appointment.daysFromNow)
    date.setHours(10, 0, 0, 0)

    await prisma.appointment.upsert({
      where: { id: appointment.id },
      update: {
        practitionerId: sarah.id,
        clientId,
        datetime: date,
        duration: 50,
        status: appointment.status,
        jitsiRoomUrl: `https://meet.jit.si/therapyconnect-${appointment.id}`,
      },
      create: {
        id: appointment.id,
        practitionerId: sarah.id,
        clientId,
        datetime: date,
        duration: 50,
        status: appointment.status,
        jitsiRoomUrl: `https://meet.jit.si/therapyconnect-${appointment.id}`,
      },
    })
  }

  const completedAppointments = appointments.filter((appt) => appt.status === 'COMPLETED')

  const noteTemplates = [
    {
      subjective:
        'Client reports reduced panic episodes this week but still experiences morning anxiety.',
      objective:
        'Affect congruent with mood; maintained eye contact and engaged in breathing exercise.',
      assessment:
        'Symptoms improving with CBT homework adherence; mild anxiety persists.',
      plan:
        'Continue CBT worksheets, add grounding exercises twice daily, follow up next session.',
    },
    {
      subjective:
        'Client describes low motivation and difficulty completing daily tasks.',
      objective:
        'Flat affect noted; speech slowed but coherent. No safety concerns reported.',
      assessment:
        'Depressive symptoms remain moderate; client open to behavioral activation.',
      plan:
        'Introduce activity scheduling, encourage daily walk, monitor mood next visit.',
    },
    {
      subjective:
        'Client notes recurring nightmares and heightened startle response.',
      objective:
        'Client appeared tense; practiced grounding successfully during session.',
      assessment:
        'PTSD symptoms ongoing; coping skills improving with practice.',
      plan:
        'Reinforce grounding skills, begin trauma narrative next session, provide sleep hygiene tips.',
    },
    {
      subjective:
        'Client reports improved focus but persistent irritability at work.',
      objective:
        'Restless leg movement observed; maintained attention during session exercises.',
      assessment:
        'ADHD symptoms partially managed; mood stable with mild irritability.',
      plan:
        'Review time-blocking strategies, add mindfulness break routine, reassess in two weeks.',
    },
    {
      subjective:
        'Client expresses excitement about new routines yet feels overwhelmed socially.',
      objective:
        'Smiling, engaged, and reflective; no acute distress observed.',
      assessment:
        'Adjustment symptoms easing; anxiety remains situational.',
      plan:
        'Set gradual social goals, practice self-compassion exercises, continue monitoring.',
    },
  ]

  let noteIndex = 0
  for (const appt of completedAppointments) {
    const clientId = userByEmail.get(appt.clientEmail)
    if (!clientId) continue

    const template = noteTemplates[noteIndex % noteTemplates.length]
    const aiGenerated = (noteIndex + 1) % 3 === 0

    await prisma.progressNote.upsert({
      where: { id: `note-${appt.id}` },
      update: {
        appointmentId: appt.id,
        practitionerId: sarah.id,
        type: 'SOAP',
        subjective: template.subjective,
        objective: template.objective,
        assessment: template.assessment,
        plan: template.plan,
        aiGenerated,
      },
      create: {
        id: `note-${appt.id}`,
        appointmentId: appt.id,
        practitionerId: sarah.id,
        type: 'SOAP',
        subjective: template.subjective,
        objective: template.objective,
        assessment: template.assessment,
        plan: template.plan,
        aiGenerated,
      },
    })

    noteIndex += 1
  }

  const assessmentSeeds = [
    { email: 'emma@example.com', score: 9, severity: 'mild' },
    { email: 'marcus@example.com', score: 15, severity: 'moderately-severe' },
    { email: 'priya@example.com', score: 8, severity: 'mild' },
  ]

  for (const assessment of assessmentSeeds) {
    const clientId = userByEmail.get(assessment.email)
    if (!clientId) continue

    await prisma.assessment.upsert({
      where: { id: `assessment-${clientId}` },
      update: {
        clientId,
        type: 'PHQ-9',
        answers: { total: assessment.score },
        totalScore: assessment.score,
        severity: assessment.severity,
      },
      create: {
        id: `assessment-${clientId}`,
        clientId,
        type: 'PHQ-9',
        answers: { total: assessment.score },
        totalScore: assessment.score,
        severity: assessment.severity,
      },
    })
  }

  const paymentSeeds = [
    { appointmentId: 'appt-emma-1', status: 'PAID' as const, amount: 15000 },
    { appointmentId: 'appt-marcus-1', status: 'PAID' as const, amount: 15000 },
    { appointmentId: 'appt-priya-1', status: 'PENDING' as const, amount: 15000 },
  ]

  for (const payment of paymentSeeds) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: payment.appointmentId },
    })
    if (!appointment) continue

    await prisma.payment.upsert({
      where: { appointmentId: payment.appointmentId },
      update: {
        clientId: appointment.clientId,
        amount: payment.amount,
        status: payment.status,
      },
      create: {
        appointmentId: payment.appointmentId,
        clientId: appointment.clientId,
        amount: payment.amount,
        status: payment.status,
      },
    })
  }

  console.log('✅ Seeding complete')
}

main()
  .catch((error: unknown) => {
    console.error('Seeding error', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
