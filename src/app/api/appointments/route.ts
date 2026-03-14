import { NextResponse } from 'next/server'
import { z } from 'zod'
import { startOfDay, endOfDay } from 'date-fns'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AppointmentSchema } from '@/lib/validations'
import type { Prisma } from '@prisma/client'

const AppointmentQuerySchema = z.object({
  practitionerId: z.string().cuid().optional(),
  clientId: z.string().cuid().optional(),
  status: z
    .enum(['SCHEDULED', 'WAITING', 'IN_SESSION', 'COMPLETED', 'CANCELLED', 'NO_SHOW'])
    .optional(),
  date: z.string().optional(),
})

type AppointmentQuery = z.infer<typeof AppointmentQuerySchema>

type AppointmentInput = {
  clientId: string
  datetime: string
  duration: number
}

export async function GET(req: Request): Promise<NextResponse> {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const parsed = AppointmentQuerySchema.safeParse({
    practitionerId: searchParams.get('practitionerId') ?? undefined,
    clientId: searchParams.get('clientId') ?? undefined,
    status: searchParams.get('status') ?? undefined,
    date: searchParams.get('date') ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const where: Prisma.AppointmentWhereInput = {}
    const query = parsed.data as AppointmentQuery

    if (query.practitionerId) where.practitionerId = query.practitionerId
    if (query.clientId) where.clientId = query.clientId
    if (query.status) where.status = query.status

    if (query.date === 'today') {
      const now = new Date()
      where.datetime = {
        gte: startOfDay(now),
        lte: endOfDay(now),
      }
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        practitioner: true,
        client: true,
        payment: true,
      },
      orderBy: { datetime: 'asc' },
    })

    return NextResponse.json(appointments)
  } catch (error) {
    console.error('[APPOINTMENTS_GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request): Promise<NextResponse> {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'PRACTITIONER' && session.user.role !== 'CLIENT') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = AppointmentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const { clientId, datetime, duration } = parsed.data as AppointmentInput
    const appointmentData =
      session.user.role === 'CLIENT'
        ? { practitionerId: clientId, clientId: session.user.id }
        : { practitionerId: session.user.id, clientId }
    const appointment = await prisma.appointment.create({
      data: {
        ...appointmentData,
        datetime: new Date(datetime),
        duration,
      },
    })

    const updated = await prisma.appointment.update({
      where: { id: appointment.id },
      data: { jitsiRoomUrl: `https://meet.jit.si/therapyconnect-${appointment.id}` },
      include: {
        practitioner: true,
        client: true,
        payment: true,
      },
    })

    return NextResponse.json(updated, { status: 201 })
  } catch (error) {
    console.error('[APPOINTMENTS_POST]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
