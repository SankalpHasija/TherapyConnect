import type { ReactElement } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { CalendarDays } from 'lucide-react'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import AppShellHeader from '@/components/layout/AppShellHeader'
import InitialsAvatar from '@/components/ui/InitialsAvatar'
import StatusBadge from '@/components/ui/StatusBadge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

function getGreeting(hour: number): string {
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
}

export default async function ClientPortalPage(): Promise<ReactElement> {
  const session = await auth()
  if (!session) redirect('/login')

  const profile = await prisma.clientProfile.findUnique({
    where: { userId: session.user.id },
  })

  const now = new Date()

  const [upcomingAppointments, pastAppointments] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        clientId: session.user.id,
        datetime: { gte: now },
      },
      include: { practitioner: true },
      orderBy: { datetime: 'asc' },
    }),
    prisma.appointment.findMany({
      where: {
        clientId: session.user.id,
        status: 'COMPLETED',
      },
      include: { practitioner: true },
      orderBy: { datetime: 'desc' },
    }),
  ])

  return (
    <div className="space-y-6">
      <AppShellHeader title="Home" />

      <div className="rounded-xl bg-gradient-to-r from-[#0f172a] to-[#134e4a] p-6 text-white">
        <p className="text-xl font-medium">
          Good {getGreeting(now.getHours())}, {session.user.name}
        </p>
        <p className="mt-1 text-sm text-[rgba(255,255,255,0.6)]">
          {format(now, 'EEEE, d MMMM yyyy')}
        </p>
      </div>

      {!profile?.intakeComplete && (
        <Alert variant="destructive" className="flex items-center justify-between">
          <div>
            <AlertTitle>Intake Required</AlertTitle>
            <AlertDescription>
              Complete your intake form before your first session.
            </AlertDescription>
          </div>
          <Button render={<Link href="/portal/intake" />} nativeButton={false} variant="secondary">
            Complete Intake
          </Button>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Appointments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {upcomingAppointments.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center">
              <CalendarDays className="mx-auto h-8 w-8 text-slate-400" />
              <p className="mt-2 text-sm text-slate-500">No upcoming sessions</p>
              <Button render={<Link href="/portal/book" />} nativeButton={false} className="mt-4 btn-teal">
                Book session
              </Button>
            </div>
          ) : (
            upcomingAppointments.map((appointment) => (
              <Card key={appointment.id} className="border-slate-200">
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <InitialsAvatar name={appointment.practitioner.name} size="md" />
                    <div>
                      <p className="font-medium text-slate-900">
                        {appointment.practitioner.name}
                      </p>
                      <p className="text-sm text-slate-500">
                        {format(appointment.datetime, 'MMM d, yyyy')} •{' '}
                        {format(appointment.datetime, 'h:mm a')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={appointment.status} />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger render={<span className="inline-flex" />}>
                          <Button variant="outline" disabled>
                            Join Session
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Video available in Phase 2</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Past Sessions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pastAppointments.length === 0 ? (
            <p className="text-sm text-slate-500">No past sessions yet.</p>
          ) : (
            pastAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="flex items-center justify-between rounded-md border border-slate-200 p-3"
              >
                <div>
                  <p className="text-sm text-slate-900">
                    {format(appointment.datetime, 'MMM d, yyyy')}
                  </p>
                  <p className="text-xs text-slate-500">
                    {appointment.practitioner.name}
                  </p>
                </div>
                <Button
                  render={<Link href={`/portal/session/${appointment.id}`} />}
                  nativeButton={false}
                  variant="ghost"
                >
                  View
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
