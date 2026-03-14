import type { ReactElement } from 'react'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import AppShellHeader from '@/components/layout/AppShellHeader'
import ClientList from '@/components/clients/ClientList'

export default async function ClientsPage(): Promise<ReactElement> {
  const session = await auth()
  if (!session) redirect('/login')

  const clients = await prisma.user.findMany({
    where: {
      role: 'CLIENT',
      clientProfile: { practitionerId: session.user.id },
    },
    include: {
      clientProfile: true,
      clientAppts: {
        where: { practitionerId: session.user.id },
        orderBy: { datetime: 'desc' },
        take: 1,
      },
    },
    orderBy: { name: 'asc' },
  })

  const clientIds = clients.map((client) => client.id)
  const assessments = await prisma.assessment.findMany({
    where: { clientId: { in: clientIds }, type: 'PHQ9' },
    orderBy: { createdAt: 'desc' },
  })

  const latestPhqByClient = new Map<string, number>()
  for (const assessment of assessments) {
    if (!latestPhqByClient.has(assessment.clientId)) {
      latestPhqByClient.set(assessment.clientId, assessment.totalScore)
    }
  }

  const clientData = clients.map((client) => ({
    id: client.id,
    name: client.name,
    diagnosis: client.clientProfile?.diagnosis ?? null,
    lastSeenLabel: client.clientAppts[0]
      ? format(client.clientAppts[0].datetime, 'MMM d, yyyy')
      : null,
    phqScore: latestPhqByClient.get(client.id) ?? null,
  }))

  return (
    <div className="space-y-6">
      <AppShellHeader title="Clients" />
      <ClientList clients={clientData} />
    </div>
  )
}
