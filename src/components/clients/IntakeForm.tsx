'use client'

import type { ReactElement } from 'react'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
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
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'

const IntakeSchema = z.object({
  q1: z.string().min(1),
  q2: z.enum(['Yes', 'No']),
  q2Details: z.string().optional(),
  q3: z.enum(['Yes', 'No']),
  q3Details: z.string().optional(),
  q4: z.string().min(1),
  q5: z.string().min(1),
  q6: z.string().min(1),
  q7: z.string().min(1),
  q8: z.number().min(1).max(10),
  q9: z.number().min(1).max(10),
  q10: z.string().min(1),
})

type IntakeValues = z.infer<typeof IntakeSchema>

type IntakeFormProps = {
  clientProfileId: string
}

const stepFields: Array<Array<keyof IntakeValues>> = [
  ['q1', 'q2', 'q2Details'],
  ['q3', 'q3Details', 'q4'],
  ['q5', 'q6'],
  ['q7', 'q8'],
  ['q9', 'q10'],
]

export default function IntakeForm({ clientProfileId }: IntakeFormProps): ReactElement {
  const router = useRouter()
  const [step, setStep] = useState(1)

  const form = useForm<IntakeValues>({
    resolver: zodResolver(IntakeSchema),
    defaultValues: {
      q1: '',
      q2: 'No',
      q2Details: '',
      q3: 'No',
      q3Details: '',
      q4: '',
      q5: '',
      q6: '',
      q7: '',
      q8: 5,
      q9: 5,
      q10: '',
    },
  })

  const progress = useMemo(() => (step / 5) * 100, [step])

  const nextStep = async (): Promise<void> => {
    const fields = stepFields[step - 1]
    const valid = await form.trigger(fields)
    if (valid) setStep((prev) => Math.min(prev + 1, 5))
  }

  const previousStep = (): void => {
    setStep((prev) => Math.max(prev - 1, 1))
  }

  const onSubmit = async (values: IntakeValues): Promise<void> => {
    const answers = {
      q1: values.q1,
      q2: values.q2 === 'Yes' ? `Yes - ${values.q2Details ?? ''}` : 'No',
      q3: values.q3 === 'Yes' ? `Yes - ${values.q3Details ?? ''}` : 'No',
      q4: values.q4,
      q5: values.q5,
      q6: values.q6,
      q7: values.q7,
      q8: values.q8,
      q9: values.q9,
      q10: values.q10,
    }

    const response = await fetch('/api/intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientProfileId,
        answers,
      }),
    })

    if (!response.ok) {
      toast.error('Unable to submit intake form')
      return
    }

    toast.success('Intake submitted')
    router.push('/portal')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Intake Form</CardTitle>
        <p className="text-sm text-slate-500">Step {step} of 5</p>
        <Progress value={progress} />
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {step === 1 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="q1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>What brings you to therapy today?</FormLabel>
                      <FormControl>
                        <Textarea className="min-h-[120px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="q2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Have you been in therapy before?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="flex gap-4"
                        >
                          <label className="flex items-center gap-2 text-sm">
                            <RadioGroupItem value="Yes" /> Yes
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <RadioGroupItem value="No" /> No
                          </label>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {form.watch('q2') === 'Yes' && (
                  <FormField
                    control={form.control}
                    name="q2Details"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tell us about your past therapy experience.</FormLabel>
                        <FormControl>
                          <Textarea className="min-h-[100px]" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="q3"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Are you currently taking any medications?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="flex gap-4"
                        >
                          <label className="flex items-center gap-2 text-sm">
                            <RadioGroupItem value="Yes" /> Yes
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <RadioGroupItem value="No" /> No
                          </label>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {form.watch('q3') === 'Yes' && (
                  <FormField
                    control={form.control}
                    name="q3Details"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>List your current medications.</FormLabel>
                        <FormControl>
                          <Textarea className="min-h-[100px]" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={form.control}
                  name="q4"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Do you have any current diagnoses?</FormLabel>
                      <FormControl>
                        <Textarea className="min-h-[100px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="q5"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emergency contact name and phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Name and phone" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="q6"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>What are your main goals for therapy?</FormLabel>
                      <FormControl>
                        <Textarea className="min-h-[120px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="q7"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Any recent major life events?</FormLabel>
                      <FormControl>
                        <Textarea className="min-h-[120px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="q8"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rate your sleep quality (1-10)</FormLabel>
                      <FormControl>
                        <Slider
                          min={1}
                          max={10}
                          step={1}
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="q9"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rate your stress level (1-10)</FormLabel>
                      <FormControl>
                        <Slider
                          min={1}
                          max={10}
                          step={1}
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="q10"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Anything else you&apos;d like your therapist to know?</FormLabel>
                      <FormControl>
                        <Textarea className="min-h-[120px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <Button type="button" variant="outline" onClick={previousStep} disabled={step === 1}>
                Back
              </Button>
              {step < 5 ? (
                <Button type="button" onClick={nextStep}>
                  Next
                </Button>
              ) : (
                <Button type="submit">Submit</Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
