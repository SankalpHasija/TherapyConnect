import type { ReactElement } from 'react'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import AppShellHeader from '@/components/layout/AppShellHeader'
import InitialsAvatar from '@/components/ui/InitialsAvatar'
import PhqBadge from '@/components/ui/PhqBadge'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import ClientProfileTabs from '@/components/clients/ClientProfileTabs'

type Params = {
  id: string
}

export default async function ClientProfilePage({
  params,
}: {
  params: Promise<Params>
}): Promise<ReactElement> {
  const session = await auth()
  if (!session) redirect('/login')

  const { id } = await params

  const client = await prisma.user.findUnique({
    where: { id },
    include: { clientProfile: true },
  })

  if (!client || !client.clientProfile) {
    redirect('/clients')
  }

  const profile = client.clientProfile

  const [notes, totalSessions, lastSession, lastAssessment, intakeForm] = await Promise.all([
    prisma.progressNote.findMany({
      where: {
        appointment: { clientId: id },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.appointment.count({
      where: { clientId: id, practitionerId: session.user.id },
    }),
    prisma.appointment.findFirst({
      where: { clientId: id, practitionerId: session.user.id },
      orderBy: { datetime: 'desc' },
    }),
    prisma.assessment.findFirst({
      where: { clientId: id, type: 'PHQ9' },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.intakeForm.findFirst({
      where: { clientProfileId: profile.id },
      orderBy: { submittedAt: 'desc' },
    }),
  ])

  return (
    <div className="space-y-6">
      <AppShellHeader title="Client profile" />

      <Card>
        <CardContent className="flex flex-col gap-6 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <InitialsAvatar name={client.name} size="lg" className="h-14 w-14 text-lg" />
              <div>
                <p className="text-lg font-medium text-slate-900">{client.name}</p>
                <p className="text-sm text-slate-500">{client.email}</p>
                <Badge variant="outline" className="mt-2 text-xs">
                  {client.role}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-slate-500">Total sessions</p>
              <p className="text-sm font-medium text-slate-900">{totalSessions}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Last session</p>
              <p className="text-sm font-medium text-slate-900">
                {lastSession ? format(lastSession.datetime, 'MMM d, yyyy') : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">PHQ-9 score</p>
              {lastAssessment ? (
                <PhqBadge score={lastAssessment.totalScore} type="PHQ9" />
              ) : (
                <Badge variant="outline" className="text-xs">
                  PHQ-9: —
                </Badge>
              )}
            </div>
            <div>
              <p className="text-xs text-slate-500">Member since</p>
              <p className="text-sm font-medium text-slate-900">
                {format(client.createdAt, 'MMM d, yyyy')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <ClientProfileTabs
        clientId={client.id}
        profile={{
          dateOfBirth: profile.dateOfBirth
            ? profile.dateOfBirth.toISOString().split('T')[0]
            : null,
          phone: profile.phone,
          emergencyContact: profile.emergencyContact,
          diagnosis: profile.diagnosis,
          medications: profile.medications,
          treatmentHistory: profile.treatmentHistory,
        }}
        notes={notes.map((note) => ({
          id: note.id,
          type: note.type,
          createdAt: note.createdAt.toISOString(),
          createdAtLabel: format(note.createdAt, 'MMM d, yyyy'),
          subjective: note.subjective,
          aiGenerated: note.aiGenerated,
        }))}
        intakeAnswers={
          intakeForm && typeof intakeForm.answers === 'object'
            ? (intakeForm.answers as Record<string, unknown>)
            : null
        }
      />
    </div>
  )
}
