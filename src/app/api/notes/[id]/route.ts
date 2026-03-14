import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const NoteUpdateSchema = z.object({
  type: z
    .enum(['SOAP', 'PROGRESS', 'INTAKE', 'ASSESSMENT', 'TREATMENT_PLAN'])
    .optional(),
  subjective: z.string().optional(),
  objective: z.string().optional(),
  assessment: z.string().optional(),
  plan: z.string().optional(),
})

const EmptySchema = z.object({})

type Params = {
  id: string
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
    const note = await prisma.progressNote.findUnique({
      where: { id },
      include: { appointment: true },
    })

    if (!note) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(note)
  } catch (error) {
    console.error('[NOTE_GET]', error)
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
  if (session.user.role !== 'PRACTITIONER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = NoteUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const note = await prisma.progressNote.update({
      where: { id },
      data: parsed.data,
      include: { appointment: true },
    })

    return NextResponse.json(note)
  } catch (error) {
    console.error('[NOTE_PATCH]', error)
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
  if (session.user.role !== 'PRACTITIONER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  void req

  const parsed = EmptySchema.safeParse({})
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const note = await prisma.progressNote.delete({
      where: { id },
    })

    return NextResponse.json(note)
  } catch (error) {
    console.error('[NOTE_DELETE]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
