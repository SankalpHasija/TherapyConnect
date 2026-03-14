'use client'

import type { ReactElement } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Mic } from 'lucide-react'
import { toast } from 'sonner'
import StatusBadge from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'

const SoapSchema = z.object({
  subjective: z.string().min(1, 'Subjective notes are required'),
  objective: z.string().min(1, 'Objective notes are required'),
  assessment: z.string().min(1, 'Assessment is required'),
  plan: z.string().min(1, 'Plan is required'),
})

type SoapValues = z.infer<typeof SoapSchema>

type AppointmentInfo = {
  clientName: string
  dateLabel: string
  timeLabel: string
  status: 'SCHEDULED' | 'WAITING' | 'IN_SESSION' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
}

type NewSoapNoteFormProps = {
  clientId: string
  appointmentId: string | null
  appointmentInfo: AppointmentInfo | null
}

export default function NewSoapNoteForm({
  clientId,
  appointmentId,
  appointmentInfo,
}: NewSoapNoteFormProps): ReactElement {
  const router = useRouter()

  const form = useForm<SoapValues>({
    resolver: zodResolver(SoapSchema),
    defaultValues: {
      subjective: '',
      objective: '',
      assessment: '',
      plan: '',
    },
  })

  const onSubmit = async (values: SoapValues): Promise<void> => {
    if (!appointmentId) {
      toast.error('Missing appointment ID')
      return
    }

    const response = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appointmentId,
        type: 'SOAP',
        ...values,
      }),
    })

    if (!response.ok) {
      toast.error('Unable to create note')
      return
    }

    toast.success('Note created')
    router.push(`/clients/${clientId}`)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="rounded-lg bg-[#0f172a] p-4">
          <div className="flex items-center gap-2 text-[#2dd4bf]">
            <Mic className="h-4 w-4" />
            <p className="text-sm font-medium">AI Voice Recorder</p>
          </div>
          <p className="mt-2 text-sm text-[rgba(255,255,255,0.6)]">
            Voice-to-note generation available in Phase 2.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="subjective"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subjective</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="What did the client report? (Subjective)"
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="objective"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Objective</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Observable facts and mental status (Objective)"
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="assessment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assessment</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Clinical impression and diagnosis (Assessment)"
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="plan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Treatment plan and next steps (Plan)"
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-center justify-end gap-3">
                  <Button
                    render={<Link href={`/clients/${clientId}`} />}
                    nativeButton={false}
                    variant="ghost"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="btn-teal">
                    Save note
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div>
        <Card>
          <CardContent className="space-y-3 p-5">
            <p className="text-sm font-medium text-slate-900">Appointment info</p>
            {appointmentInfo ? (
              <>
                <div>
                  <p className="text-xs text-slate-500">Client</p>
                  <p className="text-sm text-slate-700">{appointmentInfo.clientName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Date</p>
                  <p className="text-sm text-slate-700">{appointmentInfo.dateLabel}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Time</p>
                  <p className="text-sm text-slate-700">{appointmentInfo.timeLabel}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Status</p>
                  <StatusBadge status={appointmentInfo.status} />
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500">Appointment details unavailable.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
