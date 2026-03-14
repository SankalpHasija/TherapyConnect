import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ClientProfileSchema } from '@/lib/validations'

const EmptySchema = z.object({})

type Params = {
  id: string
}

type ClientProfileInput = z.infer<typeof ClientProfileSchema>
type ClientProfileUpdateData = Omit<ClientProfileInput, 'dateOfBirth'> & {
  dateOfBirth?: Date | null
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
    const client = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        clientProfile: {
          include: {
            intakeForms: { orderBy: { submittedAt: 'desc' } },
            prescriptions: { orderBy: { createdAt: 'desc' } },
          },
        },
        assessments: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        moodLogs: {
          orderBy: { loggedAt: 'desc' },
          take: 30,
        },
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error('[CLIENT_GET]', error)
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
  const parsed = ClientProfileSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const data: ClientProfileInput = parsed.data
    const { dateOfBirth, ...rest } = data
    const updateData: ClientProfileUpdateData = {
      ...rest,
      ...(dateOfBirth ? { dateOfBirth: new Date(dateOfBirth) } : {}),
    }

    const profile = await prisma.clientProfile.update({
      where: { userId: id },
      data: updateData,
    })

    return NextResponse.json(profile)
  } catch (error) {
    console.error('[CLIENT_PATCH]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
