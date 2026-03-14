'use client'

import type { ReactElement } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import InitialsAvatar from '@/components/ui/InitialsAvatar'
import PhqBadge from '@/components/ui/PhqBadge'
import StatusBadge from '@/components/ui/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

type AppointmentNote = {
  id: string
  createdAt: string
  createdAtLabel: string
}

type AppointmentDetail = {
  id: string
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
  client: {
    id: string
    name: string
    email: string
    diagnosis: string | null
  }
  payment: {
    status: string
    amount: number
    paidAtLabel: string | null
  } | null
  notes: AppointmentNote[]
  lastPhqScore: number | null
  nextAppointment: {
    dateLabel: string
    timeLabel: string
  } | null
}

type AppointmentDetailProps = {
  appointment: AppointmentDetail
}

export default function AppointmentDetail({ appointment }: AppointmentDetailProps): ReactElement {
  const router = useRouter()

  const cancelAppointment = async (): Promise<void> => {
    const response = await fetch(`/api/appointments/${appointment.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CANCELLED' }),
    })

    if (!response.ok) {
      toast.error('Unable to cancel appointment')
      return
    }

    toast.success('Appointment cancelled')
    router.refresh()
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <InitialsAvatar name={appointment.client.name} size="lg" />
              <div>
                <p className="text-lg font-semibold text-slate-900">
                  {appointment.client.name}
                </p>
                <p className="text-sm text-slate-500">{appointment.client.email}</p>
              </div>
            </div>
            <StatusBadge status={appointment.status} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Session Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-slate-500">Date</p>
              <p className="text-sm font-medium text-slate-900">{appointment.dateLabel}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Time</p>
              <p className="text-sm font-medium text-slate-900">{appointment.timeLabel}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Duration</p>
              <p className="text-sm font-medium text-slate-900">
                {appointment.duration} min
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Status</p>
              <StatusBadge status={appointment.status} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Notes</CardTitle>
            <Button
              render={
                <Link
                  href={`/clients/${appointment.client.id}/notes/new?appointmentId=${appointment.id}`}
                />
              }
              nativeButton={false}
              className="btn-teal"
            >
              Create note
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {appointment.notes.length === 0 ? (
              <p className="text-sm text-slate-500">No notes yet.</p>
            ) : (
              appointment.notes.map((note) => (
                <div key={note.id} className="flex items-center justify-between">
                  <p className="text-sm text-slate-600">{note.createdAtLabel}</p>
                  <Button
                    render={<Link href={`/clients/${appointment.client.id}/notes/${note.id}`} />}
                    nativeButton={false}
                    variant="ghost"
                    size="sm"
                  >
                    View
                  </Button>
                </div>
              ))
            )}
            <div className="flex flex-wrap gap-3 pt-2">
              {appointment.status === 'SCHEDULED' && (
                <Button
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50"
                  onClick={cancelAppointment}
                >
                  Cancel appointment
                </Button>
              )}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger render={<span className="inline-flex" />}>
                    <Button variant="outline" disabled>
                      Join session
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Video available in Phase 2</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-slate-500">Amount</p>
              <p className="text-lg font-semibold text-slate-900">
                ${((appointment.payment?.amount ?? 0) / 100).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Status</p>
              <Badge variant="outline">
                {appointment.payment?.status ?? 'PENDING'}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-slate-500">Paid date</p>
              <p className="text-sm text-slate-700">
                {appointment.payment?.paidAtLabel ?? 'Pending'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Client Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-slate-500">Diagnosis</p>
              <p className="text-sm text-slate-700">
                {appointment.client.diagnosis ?? 'No diagnosis on file'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Latest PHQ-9</p>
              {typeof appointment.lastPhqScore === 'number' ? (
                <PhqBadge score={appointment.lastPhqScore} type="PHQ9" />
              ) : (
                <Badge variant="outline" className="text-xs">
                  PHQ-9: —
                </Badge>
              )}
            </div>
            <div>
              <p className="text-xs text-slate-500">Next appointment</p>
              <p className="text-sm text-slate-700">
                {appointment.nextAppointment
                  ? `${appointment.nextAppointment.dateLabel} at ${appointment.nextAppointment.timeLabel}`
                  : 'None scheduled'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
