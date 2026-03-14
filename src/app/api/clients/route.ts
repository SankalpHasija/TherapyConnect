import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ClientListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
})

type ClientListQuery = z.infer<typeof ClientListQuerySchema>

export async function GET(req: Request): Promise<NextResponse> {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'PRACTITIONER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const parsed = ClientListQuerySchema.safeParse({
    limit: searchParams.get('limit') ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const query = parsed.data as ClientListQuery
    const clients = await prisma.user.findMany({
      where: {
        role: 'CLIENT',
        clientProfile: { practitionerId: session.user.id },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        clientProfile: true,
      },
      take: query.limit,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(clients)
  } catch (error) {
    console.error('[CLIENTS_GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
