import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { RegisterSchema } from '@/lib/validations'
import { z } from 'zod'

const EmptySchema = z.object({})

type RegisterInput = z.infer<typeof RegisterSchema>

export async function GET(): Promise<NextResponse> {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const parsed = EmptySchema.safeParse({})
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        specialty: true,
        approach: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('[USERS_GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request): Promise<NextResponse> {
  const session = await auth()
  void session

  const body = await req.json()
  const parsed = RegisterSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const { name, email, password, role } = parsed.data as RegisterInput

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
    }

    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: { name, email, password: hashed, role },
        select: { id: true, email: true, role: true },
      })

      if (role === 'CLIENT') {
        const defaultPractitioner = await tx.user.findFirst({
          where: { role: 'PRACTITIONER' },
          select: { id: true },
          orderBy: { createdAt: 'asc' },
        })

        if (!defaultPractitioner) {
          throw new Error('NO_PRACTITIONER_AVAILABLE')
        }

        await tx.clientProfile.create({
          data: {
            userId: createdUser.id,
            practitionerId: defaultPractitioner.id,
          },
        })
      }

      return createdUser
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'NO_PRACTITIONER_AVAILABLE') {
      return NextResponse.json(
        { error: 'No practitioner is available for new client registrations' },
        { status: 400 }
      )
    }

    console.error('[USERS_POST]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
