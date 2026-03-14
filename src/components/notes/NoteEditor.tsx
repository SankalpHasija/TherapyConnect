'use client'

import type { ReactElement } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'

const NoteSchema = z.object({
  subjective: z.string().optional(),
  objective: z.string().optional(),
  assessment: z.string().optional(),
  plan: z.string().optional(),
})

type NoteValues = z.infer<typeof NoteSchema>

type NoteEditorProps = {
  noteId: string
  clientId: string
  initial: {
    subjective: string | null
    objective: string | null
    assessment: string | null
    plan: string | null
    aiGenerated: boolean
  }
}

export default function NoteEditor({
  noteId,
  clientId,
  initial,
}: NoteEditorProps): ReactElement {
  const router = useRouter()

  const form = useForm<NoteValues>({
    resolver: zodResolver(NoteSchema),
    defaultValues: {
      subjective: initial.subjective ?? '',
      objective: initial.objective ?? '',
      assessment: initial.assessment ?? '',
      plan: initial.plan ?? '',
    },
  })

  const onSubmit = async (values: NoteValues): Promise<void> => {
    const response = await fetch(`/api/notes/${noteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })

    if (!response.ok) {
      toast.error('Unable to save note')
      return
    }

    toast.success('Note saved')
    router.refresh()
  }

  const onDelete = async (): Promise<void> => {
    const response = await fetch(`/api/notes/${noteId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      toast.error('Unable to delete note')
      return
    }

    toast.success('Note deleted')
    router.push(`/clients/${clientId}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Progress Note</h1>
          <p className="text-slate-600">Edit clinical note content.</p>
        </div>
        {initial.aiGenerated && <Badge variant="secondary">AI Generated</Badge>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SOAP Note</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="subjective"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subjective</FormLabel>
                    <FormControl>
                      <Textarea className="min-h-[120px]" {...field} />
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
                      <Textarea className="min-h-[120px]" {...field} />
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
                      <Textarea className="min-h-[120px]" {...field} />
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
                      <Textarea className="min-h-[120px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-wrap gap-3">
                <Button type="submit" className="btn-teal">
                  Save
                </Button>
                <Dialog>
                  <DialogTrigger
                    type="button"
                    className={buttonVariants({ variant: 'destructive' })}
                  >
                    Delete
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete note?</DialogTitle>
                      <DialogDescription>
                        This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose
                        type="button"
                        className={buttonVariants({ variant: 'outline' })}
                      >
                        Cancel
                      </DialogClose>
                      <Button type="button" variant="destructive" onClick={onDelete}>
                        Confirm Delete
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
