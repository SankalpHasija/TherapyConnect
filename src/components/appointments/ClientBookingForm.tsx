'use client'

import type { ReactElement } from 'react'
import { useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type PractitionerOption = {
  id: string
  name: string
  specialty: string | null
}

type ClientBookingFormProps = {
  practitioners: PractitionerOption[]
}

const BookingSchema = z.object({
  practitionerId: z.string().min(1),
  date: z.date(),
  time: z.string().min(1),
  duration: z.number().min(30).max(120),
})

type BookingValues = z.infer<typeof BookingSchema>

const durations = [30, 50, 60, 90]

function buildTimeSlots(): string[] {
  const slots: string[] = []
  for (let hour = 8; hour <= 18; hour += 1) {
    for (let minute = 0; minute < 60; minute += 30) {
      if (hour === 18 && minute > 0) continue
      const labelHour = hour > 12 ? hour - 12 : hour
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const labelMinute = minute === 0 ? '00' : '30'
      slots.push(`${labelHour}:${labelMinute} ${ampm}`)
    }
  }
  return slots
}

function toDateTime(date: Date, time: string): Date {
  const [timePart, meridiem] = time.split(' ')
  const [hourString, minuteString] = timePart.split(':')
  let hours = Number(hourString)
  const minutes = Number(minuteString)

  if (meridiem === 'PM' && hours < 12) hours += 12
  if (meridiem === 'AM' && hours === 12) hours = 0

  const combined = new Date(date)
  combined.setHours(hours, minutes, 0, 0)
  return combined
}

export default function ClientBookingForm({
  practitioners,
}: ClientBookingFormProps): ReactElement {
  const router = useRouter()
  const timeSlots = useMemo(() => buildTimeSlots(), [])

  const form = useForm<BookingValues>({
    resolver: zodResolver(BookingSchema),
    defaultValues: {
      practitionerId: practitioners[0]?.id ?? '',
      date: undefined,
      time: '9:00 AM',
      duration: 50,
    },
  })

  useEffect(() => {
    if (!form.getValues('date')) {
      form.setValue('date', new Date(), { shouldValidate: true })
    }
  }, [form])

  const onSubmit = async (values: BookingValues): Promise<void> => {
    const appointmentDate = toDateTime(values.date, values.time)
    const response = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: values.practitionerId,
        datetime: appointmentDate.toISOString(),
        duration: values.duration,
      }),
    })

    if (!response.ok) {
      toast.error('Unable to book appointment')
      return
    }

    toast.success('Appointment booked')
    router.push('/portal')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Book session</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="practitionerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Practitioner</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select practitioner" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {practitioners.map((practitioner) => (
                        <SelectItem key={practitioner.id} value={practitioner.id}>
                          {practitioner.name}
                          {practitioner.specialty ? ` — ${practitioner.specialty}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <FormControl>
                        <PopoverTrigger
                          type="button"
                          className={cn(
                            buttonVariants({ variant: 'outline' }),
                            'w-full justify-between'
                          )}
                        >
                          {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                          <CalendarIcon className="h-4 w-4 text-slate-500" />
                        </PopoverTrigger>
                      </FormControl>
                      <PopoverContent align="start" className="p-0">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => date && field.onChange(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timeSlots.map((slot) => (
                          <SelectItem key={slot} value={slot}>
                            {slot}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      defaultValue={String(field.value)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {durations.map((duration) => (
                          <SelectItem key={duration} value={String(duration)}>
                            {duration} min
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button render={<Link href="/portal" />} nativeButton={false} variant="ghost">
                Cancel
              </Button>
              <Button type="submit" className="btn-teal">
                Book appointment
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
