import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const AppointmentUpdateSchema = z.object({
  status: z
    .enum(['SCHEDULED', 'WAITING', 'IN_SESSION', 'COMPLETED', 'CANCELLED', 'NO_SHOW'])
    .optional(),
  datetime: z.string().datetime().optional(),
  duration: z.number().min(30).max(120).optional(),
})

const EmptySchema = z.object({})

type Params = {
  id: string
}

type AppointmentUpdateInput = z.infer<typeof AppointmentUpdateSchema>
type AppointmentUpdateData = {
  status?: AppointmentUpdateInput['status']
  duration?: AppointmentUpdateInput['duration']
  datetime?: Date
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<Params> }
): Promise<NextResponse> {
  const { id } = await params
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  void req

  const parsed = EmptySchema.safeParse({})
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        practitioner: true,
        client: true,
        notes: true,
        payment: true,
      },
    })

    if (!appointment) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(appointment)
  } catch (error) {
    console.error('[APPOINTMENT_GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<Params> }
): Promise<NextResponse> {
  const { id } = await params
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = AppointmentUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const data: AppointmentUpdateInput = parsed.data
    const { datetime, ...rest } = data
    const updateData: AppointmentUpdateData = {
      ...rest,
      ...(datetime ? { datetime: new Date(datetime) } : {}),
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        practitioner: true,
        client: true,
        notes: true,
        payment: true,
      },
    })

    return NextResponse.json(appointment)
  } catch (error) {
    console.error('[APPOINTMENT_PATCH]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<Params> }
): Promise<NextResponse> {
  const { id } = await params
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  void req

  const parsed = EmptySchema.safeParse({})
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        practitioner: true,
        client: true,
        notes: true,
        payment: true,
      },
    })

    return NextResponse.json(appointment)
  } catch (error) {
    console.error('[APPOINTMENT_DELETE]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
