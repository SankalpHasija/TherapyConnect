import { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { IntakeFormSchema } from '@/lib/validations'

export async function POST(req: Request): Promise<NextResponse> {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'CLIENT') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = IntakeFormSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const intake = await prisma.intakeForm.create({
      data: {
        clientProfileId: parsed.data.clientProfileId,
        answers: parsed.data.answers as Prisma.InputJsonValue,
      },
    })

    await prisma.clientProfile.update({
      where: { id: parsed.data.clientProfileId },
      data: { intakeComplete: true },
    })

    return NextResponse.json(intake, { status: 201 })
  } catch (error) {
    console.error('[INTAKE_POST]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
