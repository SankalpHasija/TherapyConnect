import type { ReactElement } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from 'date-fns'
import { CalendarCheck, CalendarDays, DollarSign, Lock, Plus, Users } from 'lucide-react'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import AppShellHeader from '@/components/layout/AppShellHeader'
import InitialsAvatar from '@/components/ui/InitialsAvatar'
import PhqBadge from '@/components/ui/PhqBadge'
import StatusBadge from '@/components/ui/StatusBadge'
import StatCard from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function getGreeting(hour: number): string {
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
}

export default async function PractitionerDashboardPage(): Promise<ReactElement> {
  const session = await auth()
  if (!session) redirect('/login')

  const today = new Date()
  const todayStart = startOfDay(today)
  const todayEnd = endOfDay(today)
  const weekStart = startOfWeek(today)
  const weekEnd = endOfWeek(today)
  const monthStart = startOfMonth(today)
  const monthEnd = endOfMonth(today)

  const sixWeeksAgo = startOfWeek(subWeeks(today, 5))
  const sixWeeksEnd = endOfWeek(today)
  const sixMonthsAgo = startOfMonth(subMonths(today, 5))
  const sixMonthsEnd = endOfMonth(today)

  const [
    todaysAppointments,
    totalClients,
    sessionsThisWeek,
    revenueThisMonth,
    recentClientAppointments,
    sparkAppointments,
    revenuePayments,
  ] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        practitionerId: session.user.id,
        datetime: { gte: todayStart, lte: todayEnd },
      },
      include: { client: true },
      orderBy: { datetime: 'asc' },
    }),
    prisma.user.count({
      where: {
        role: 'CLIENT',
        clientProfile: { practitionerId: session.user.id },
      },
    }),
    prisma.appointment.count({
      where: {
        practitionerId: session.user.id,
        datetime: { gte: weekStart, lte: weekEnd },
      },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: 'PAID',
        appointment: { practitionerId: session.user.id },
        createdAt: { gte: monthStart, lte: monthEnd },
      },
    }),
    prisma.appointment.findMany({
      where: { practitionerId: session.user.id },
      include: { client: { include: { clientProfile: true } } },
      orderBy: { datetime: 'desc' },
      distinct: ['clientId'],
      take: 5,
    }),
    prisma.appointment.findMany({
      where: {
        practitionerId: session.user.id,
        datetime: { gte: sixWeeksAgo, lte: sixWeeksEnd },
      },
      select: { datetime: true, clientId: true },
    }),
    prisma.payment.findMany({
      where: {
        status: 'PAID',
        appointment: { practitionerId: session.user.id },
        createdAt: { gte: sixMonthsAgo, lte: sixMonthsEnd },
      },
      select: { amount: true, createdAt: true },
    }),
  ])

  const revenueCents = revenueThisMonth._sum.amount ?? 0
  const revenueDollars = (revenueCents / 100).toFixed(2)

  const clientIds = recentClientAppointments.map((item) => item.clientId)
  const assessments = await prisma.assessment.findMany({
    where: {
      clientId: { in: clientIds },
      type: 'PHQ9',
    },
    orderBy: { createdAt: 'desc' },
  })

  const latestPhqByClient = new Map<string, number>()
  for (const assessment of assessments) {
    if (!latestPhqByClient.has(assessment.clientId)) {
      latestPhqByClient.set(assessment.clientId, assessment.totalScore)
    }
  }

  const weekStarts = Array.from({ length: 6 }, (_, index) =>
    startOfWeek(subWeeks(today, 5 - index))
  )
  const weekEnds = weekStarts.map((start) => endOfWeek(start))

  const sessionsSpark = weekStarts.map((start, index) => {
    const end = weekEnds[index]
    return sparkAppointments.filter(
      (appt) => appt.datetime >= start && appt.datetime <= end
    ).length
  })

  const clientsSpark = weekStarts.map((start, index) => {
    const end = weekEnds[index]
    const unique = new Set(
      sparkAppointments
        .filter((appt) => appt.datetime >= start && appt.datetime <= end)
        .map((appt) => appt.clientId)
    )
    return unique.size
  })

  const monthStarts = Array.from({ length: 6 }, (_, index) =>
    startOfMonth(subMonths(today, 5 - index))
  )
  const monthEnds = monthStarts.map((start) => endOfMonth(start))

  const revenueSpark = monthStarts.map((start, index) => {
    const end = monthEnds[index]
    const total = revenuePayments
      .filter((payment) => payment.createdAt >= start && payment.createdAt <= end)
      .reduce((sum, payment) => sum + payment.amount, 0)
    return Number((total / 100).toFixed(2))
  })

  const greeting = getGreeting(today.getHours())
  const firstName = session.user.name?.split(' ')[0] ?? 'there'

  return (
    <div className="space-y-6">
      <AppShellHeader
        title={`Good ${greeting}, ${firstName}`}
        action={
          <Button render={<Link href="/appointments/new" />} nativeButton={false} className="btn-teal">
            <Plus className="h-4 w-4" />
            New appointment
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard
          label="Total Clients"
          value={String(totalClients)}
          trend={`${totalClients}`}
          trendLabel="active clients"
          sparkData={clientsSpark}
          color="teal"
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          label="Sessions This Week"
          value={String(sessionsThisWeek)}
          trend={`${sessionsThisWeek}`}
          trendLabel="sessions this week"
          sparkData={sessionsSpark}
          color="green"
          icon={<CalendarCheck className="h-4 w-4" />}
        />
        <StatCard
          label="Revenue This Month"
          value={`$${revenueDollars}`}
          trend={`$${revenueDollars}`}
          trendLabel="paid this month"
          sparkData={revenueSpark}
          color="amber"
          icon={<DollarSign className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Today&apos;s Appointments</CardTitle>
            <Link href="/appointments" className="text-sm text-[#0f766e]">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {todaysAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                <CalendarDays className="h-6 w-6 text-slate-400" />
                <p className="mt-2">No appointments today</p>
              </div>
            ) : (
              todaysAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <InitialsAvatar name={appointment.client.name} size="md" />
                    <div>
                      <p className="font-medium text-slate-900">{appointment.client.name}</p>
                      <p className="text-sm text-slate-500">
                        {format(appointment.datetime, 'h:mm a')}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={appointment.status} />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Clients</CardTitle>
            <Link href="/clients" className="text-sm text-[#0f766e]">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentClientAppointments.length === 0 ? (
              <p className="text-sm text-slate-500">No clients yet.</p>
            ) : (
              recentClientAppointments.map((appointment) => {
                const diagnosis =
                  appointment.client.clientProfile?.diagnosis ?? 'No diagnosis on file'
                const phqScore = latestPhqByClient.get(appointment.clientId)
                return (
                  <div
                    key={appointment.clientId}
                    className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3"
                  >
                    <div className="flex items-center gap-3">
                      <InitialsAvatar name={appointment.client.name} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {appointment.client.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {diagnosis.length > 30
                            ? `${diagnosis.slice(0, 30)}...`
                            : diagnosis}
                        </p>
                      </div>
                    </div>
                    <div>
                      {typeof phqScore === 'number' ? (
                        <PhqBadge score={phqScore} type="PHQ9" />
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          PHQ-9: —
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>

      <div className="rounded-[12px] bg-[#0f172a] p-5">
        <div className="flex items-center gap-2 text-[13px] font-medium text-[#2dd4bf]">
          <Lock className="h-4 w-4" />
          AI Clinical Insights
        </div>
        <p className="mt-2 text-[13px] text-[rgba(255,255,255,0.6)]">
          Intelligent session analysis and risk flagging will be available in Phase 2.
        </p>
      </div>
    </div>
  )
}
