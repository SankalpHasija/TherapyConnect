import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NoteSchema } from '@/lib/validations'
import type { Prisma } from '@prisma/client'

const NotesQuerySchema = z.object({
  appointmentId: z.string().cuid().optional(),
  clientId: z.string().cuid().optional(),
})

type NotesQuery = z.infer<typeof NotesQuerySchema>

type NoteInput = z.infer<typeof NoteSchema>

export async function GET(req: Request): Promise<NextResponse> {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const parsed = NotesQuerySchema.safeParse({
    appointmentId: searchParams.get('appointmentId') ?? undefined,
    clientId: searchParams.get('clientId') ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const query = parsed.data as NotesQuery
    const where: Prisma.ProgressNoteWhereInput = {}

    if (query.appointmentId) {
      where.appointmentId = query.appointmentId
    }

    if (query.clientId) {
      where.appointment = { clientId: query.clientId }
    }

    const notes = await prisma.progressNote.findMany({
      where,
      include: { appointment: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(notes)
  } catch (error) {
    console.error('[NOTES_GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request): Promise<NextResponse> {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'PRACTITIONER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = NoteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const data = parsed.data as NoteInput
    const note = await prisma.progressNote.create({
      data: {
        appointmentId: data.appointmentId,
        practitionerId: session.user.id,
        type: data.type,
        subjective: data.subjective,
        objective: data.objective,
        assessment: data.assessment,
        plan: data.plan,
      },
      include: { appointment: true },
    })

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    console.error('[NOTES_POST]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
