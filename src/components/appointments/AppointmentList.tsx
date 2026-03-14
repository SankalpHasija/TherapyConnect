'use client'

import type { ReactElement } from 'react'
import Link from 'next/link'
import { CalendarDays } from 'lucide-react'
import InitialsAvatar from '@/components/ui/InitialsAvatar'
import StatusBadge from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type AppointmentItem = {
  id: string
  clientName: string
  dateLabel: string
  timeLabel: string
  duration: number
  status:
    | 'SCHEDULED'
    | 'WAITING'
    | 'IN_SESSION'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'NO_SHOW'
}

type AppointmentListProps = {
  appointments: {
    all: AppointmentItem[]
    today: AppointmentItem[]
    upcoming: AppointmentItem[]
    past: AppointmentItem[]
  }
}

type AppointmentTableProps = {
  appointments: AppointmentItem[]
}

function EmptyState(): ReactElement {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-3 py-10 text-center">
        <CalendarDays className="h-8 w-8 text-slate-400" />
        <div>
          <p className="text-sm font-medium text-slate-900">No appointments found</p>
          <p className="text-xs text-slate-500">Create a new appointment to get started.</p>
        </div>
        <Button render={<Link href="/appointments/new" />} nativeButton={false} className="btn-teal">
          Create appointment
        </Button>
      </CardContent>
    </Card>
  )
}

function AppointmentTable({ appointments }: AppointmentTableProps): ReactElement {
  return (
    <Table>
      <TableHeader className="bg-slate-50">
        <TableRow>
          <TableHead>Client Name</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Time</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {appointments.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-sm text-slate-500">
              No appointments found.
            </TableCell>
          </TableRow>
        ) : (
          appointments.map((appointment) => (
            <TableRow key={appointment.id} className="table-row-hover">
              <TableCell className="font-medium text-slate-900">
                <div className="flex items-center gap-2">
                  <InitialsAvatar name={appointment.clientName} size="sm" />
                  <span className="text-[13px] font-medium text-slate-900">
                    {appointment.clientName}
                  </span>
                </div>
              </TableCell>
              <TableCell>{appointment.dateLabel}</TableCell>
              <TableCell>{appointment.timeLabel}</TableCell>
              <TableCell>{appointment.duration} min</TableCell>
              <TableCell>
                <StatusBadge status={appointment.status} />
              </TableCell>
              <TableCell>
                <Button
                  render={<Link href={`/appointments/${appointment.id}`} />}
                  nativeButton={false}
                  variant="ghost"
                  size="sm"
                >
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}

export default function AppointmentList({ appointments }: AppointmentListProps): ReactElement {
  const { all, today, upcoming, past } = appointments

  return (
    <Tabs defaultValue="all" className="space-y-4">
      <TabsList>
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="today">Today</TabsTrigger>
        <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
        <TabsTrigger value="past">Past</TabsTrigger>
      </TabsList>
      <TabsContent value="all">
        {all.length === 0 ? <EmptyState /> : <AppointmentTable appointments={all} />}
      </TabsContent>
      <TabsContent value="today">
        {today.length === 0 ? <EmptyState /> : <AppointmentTable appointments={today} />}
      </TabsContent>
      <TabsContent value="upcoming">
        {upcoming.length === 0 ? <EmptyState /> : (
          <AppointmentTable appointments={upcoming} />
        )}
      </TabsContent>
      <TabsContent value="past">
        {past.length === 0 ? <EmptyState /> : <AppointmentTable appointments={past} />}
      </TabsContent>
    </Tabs>
  )
}
