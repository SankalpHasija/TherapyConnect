import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ParamsSchema = z.object({
  clientId: z.string().cuid(),
})

type Params = z.infer<typeof ParamsSchema>

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<Params> }
): Promise<NextResponse> {
  const { clientId } = await params
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  void req

  const parsed = ParamsSchema.safeParse({ clientId })
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const profile = await prisma.clientProfile.findUnique({
      where: { userId: parsed.data.clientId },
      include: {
        intakeForms: {
          orderBy: { submittedAt: 'desc' },
          take: 1,
        },
      },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('[INTAKE_GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
