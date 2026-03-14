import type { ReactElement } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { format, isToday } from 'date-fns'
import { Plus } from 'lucide-react'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import AppShellHeader from '@/components/layout/AppShellHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import AppointmentList from '@/components/appointments/AppointmentList'

export default async function AppointmentsPage(): Promise<ReactElement> {
  const session = await auth()
  if (!session) redirect('/login')

  const appointments = await prisma.appointment.findMany({
    where: { practitionerId: session.user.id },
    include: { client: true },
    orderBy: { datetime: 'desc' },
  })

  const now = new Date()
  const mapAppointment = (appointment: typeof appointments[number]) => ({
    id: appointment.id,
    clientName: appointment.client.name,
    dateLabel: format(appointment.datetime, 'MMM d'),
    timeLabel: format(appointment.datetime, 'h:mm a'),
    duration: appointment.duration,
    status: appointment.status,
  })

  const appointmentData = {
    all: appointments.map(mapAppointment),
    today: appointments.filter((appointment) => isToday(appointment.datetime)).map(mapAppointment),
    upcoming: appointments.filter((appointment) => appointment.datetime > now).map(mapAppointment),
    past: appointments.filter((appointment) => appointment.datetime < now).map(mapAppointment),
  }

  return (
    <div className="space-y-6">
      <AppShellHeader
        title="Appointments"
        action={
          <Button render={<Link href="/appointments/new" />} nativeButton={false} className="btn-teal">
            <Plus className="h-4 w-4" />
            New
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <AppointmentList appointments={appointmentData} />
        </CardContent>
      </Card>
    </div>
  )
}
