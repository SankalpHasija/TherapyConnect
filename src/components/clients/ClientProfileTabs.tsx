'use client'

import type { ReactElement } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

const EHRSchema = z.object({
  dateOfBirth: z.string().optional(),
  phone: z.string().optional(),
  emergencyContact: z.string().optional(),
  diagnosis: z.string().optional(),
  medications: z.string().optional(),
  treatmentHistory: z.string().optional(),
})

type EHRValues = z.infer<typeof EHRSchema>

type NoteItem = {
  id: string
  type: string
  createdAt: string
  createdAtLabel: string
  subjective: string | null
  aiGenerated: boolean
}

type ClientProfileTabsProps = {
  clientId: string
  profile: {
    dateOfBirth: string | null
    phone: string | null
    emergencyContact: string | null
    diagnosis: string | null
    medications: string | null
    treatmentHistory: string | null
  }
  notes: NoteItem[]
  intakeAnswers: Record<string, unknown> | null
}

export default function ClientProfileTabs({
  clientId,
  profile,
  notes,
  intakeAnswers,
}: ClientProfileTabsProps): ReactElement {
  const router = useRouter()

  const form = useForm<EHRValues>({
    resolver: zodResolver(EHRSchema),
    defaultValues: {
      dateOfBirth: profile.dateOfBirth ?? '',
      phone: profile.phone ?? '',
      emergencyContact: profile.emergencyContact ?? '',
      diagnosis: profile.diagnosis ?? '',
      medications: profile.medications ?? '',
      treatmentHistory: profile.treatmentHistory ?? '',
    },
  })

  const onSubmit = async (values: EHRValues): Promise<void> => {
    const response = await fetch(`/api/clients/${clientId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })

    if (!response.ok) {
      toast.error('Unable to save profile')
      return
    }

    toast.success('Profile updated')
    router.refresh()
  }

  return (
    <Tabs defaultValue="profile" className="space-y-6">
      <TabsList>
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="notes">Notes</TabsTrigger>
        <TabsTrigger value="assessments">Assessments</TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>EHR Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="(555) 555-5555" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="emergencyContact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Emergency Contact</FormLabel>
                          <FormControl>
                            <Input placeholder="Name and phone" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="diagnosis"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Diagnosis</FormLabel>
                          <FormControl>
                            <Input placeholder="Primary diagnosis" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="medications"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Medications</FormLabel>
                          <FormControl>
                            <Input placeholder="Current medications" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="treatmentHistory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Treatment History</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Summary of prior treatment history"
                              className="min-h-[140px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" className="btn-teal">
                    Save
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Intake Answers</CardTitle>
          </CardHeader>
          <CardContent>
            {intakeAnswers ? (
              <Accordion className="w-full">
                {Object.entries(intakeAnswers).map(([key, value]) => {
                  const displayValue =
                    typeof value === 'string' ? value : JSON.stringify(value)
                  return (
                  <AccordionItem key={key} value={key}>
                    <AccordionTrigger className="text-sm">
                      {key.toUpperCase()}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-slate-600">
                      {displayValue}
                    </AccordionContent>
                  </AccordionItem>
                  )
                })}
              </Accordion>
            ) : (
              <p className="text-sm text-slate-500">No intake form submitted yet.</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="notes">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Progress Notes</CardTitle>
            <Button
              render={<Link href={`/clients/${clientId}/notes/new`} />}
              nativeButton={false}
              className="btn-teal"
            >
              New note
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {notes.length === 0 ? (
              <p className="text-sm text-slate-500">No notes yet.</p>
            ) : (
              notes.map((note) => (
                <Card key={note.id} className="border border-slate-200">
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500">{note.createdAtLabel}</p>
                      <div className="flex items-center gap-2">
                        {note.aiGenerated && (
                          <Badge variant="secondary" className="text-xs">
                            AI Generated
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-slate-700">
                      {(note.subjective ?? '').slice(0, 120)}
                    </p>
                    <div className="flex justify-end">
                      <Button
                        render={<Link href={`/clients/${clientId}/notes/${note.id}`} />}
                        nativeButton={false}
                        variant="ghost"
                        size="sm"
                      >
                        View note
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="assessments">
        <Card>
          <CardContent className="py-8">
            <p className="text-sm text-slate-500">
              PHQ-9 and GAD-7 assessment scores will appear here in Phase 2.
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
