import type { ReactElement } from 'react'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import AppShellHeader from '@/components/layout/AppShellHeader'
import NewSoapNoteForm from '@/components/notes/NewSoapNoteForm'

type Params = {
  id: string
}

type SearchParams = {
  appointmentId?: string
}

export default async function NewSoapNotePage({
  params,
  searchParams,
}: {
  params: Promise<Params>
  searchParams: Promise<SearchParams>
}): Promise<ReactElement> {
  const session = await auth()
  if (!session) redirect('/login')

  const { id } = await params
  const resolvedSearchParams = await searchParams
  const appointmentId = resolvedSearchParams.appointmentId ?? null

  const appointment =
    appointmentId &&
    (await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { client: true },
    }))

  const appointmentInfo = appointment
    ? {
        clientName: appointment.client.name,
        dateLabel: format(appointment.datetime, 'MMM d, yyyy'),
        timeLabel: format(appointment.datetime, 'h:mm a'),
        status: appointment.status,
      }
    : null

  return (
    <div className="space-y-6">
      <AppShellHeader title="Create note" />
      <NewSoapNoteForm
        clientId={id}
        appointmentId={appointmentId}
        appointmentInfo={appointmentInfo}
      />
    </div>
  )
}
