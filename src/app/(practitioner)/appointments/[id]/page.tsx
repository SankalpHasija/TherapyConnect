import type { ReactElement } from 'react'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import AppShellHeader from '@/components/layout/AppShellHeader'
import AppointmentDetail from '@/components/appointments/AppointmentDetail'

type Params = {
  id: string
}

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<Params>
}): Promise<ReactElement> {
  const session = await auth()
  if (!session) redirect('/login')

  const { id } = await params

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      client: { include: { clientProfile: true } },
      notes: { orderBy: { createdAt: 'desc' } },
      payment: true,
    },
  })

  if (!appointment) {
    redirect('/appointments')
  }

  const lastAssessment = await prisma.assessment.findFirst({
    where: { clientId: appointment.clientId, type: 'PHQ9' },
    orderBy: { createdAt: 'desc' },
  })

  const nextAppointment = await prisma.appointment.findFirst({
    where: {
      practitionerId: session.user.id,
      clientId: appointment.clientId,
      datetime: { gt: appointment.datetime },
    },
    orderBy: { datetime: 'asc' },
  })

  return (
    <div className="space-y-6">
      <AppShellHeader title="Appointment details" />
      <AppointmentDetail
        appointment={{
          id: appointment.id,
          dateLabel: format(appointment.datetime, 'MMM d, yyyy'),
          timeLabel: format(appointment.datetime, 'h:mm a'),
          duration: appointment.duration,
          status: appointment.status,
          client: {
            id: appointment.client.id,
            name: appointment.client.name,
            email: appointment.client.email,
            diagnosis: appointment.client.clientProfile?.diagnosis ?? null,
          },
          payment: appointment.payment
            ? {
                status: appointment.payment.status,
                amount: appointment.payment.amount,
                paidAtLabel:
                  appointment.payment.status === 'PAID'
                    ? format(appointment.payment.createdAt, 'MMM d, yyyy')
                    : null,
              }
            : null,
          notes: appointment.notes.map((note) => ({
            id: note.id,
            createdAt: note.createdAt.toISOString(),
            createdAtLabel: format(note.createdAt, 'MMM d, yyyy'),
          })),
          lastPhqScore: lastAssessment?.totalScore ?? null,
          nextAppointment: nextAppointment
            ? {
                dateLabel: format(nextAppointment.datetime, 'MMM d, yyyy'),
                timeLabel: format(nextAppointment.datetime, 'h:mm a'),
              }
            : null,
        }}
      />
    </div>
  )
}
