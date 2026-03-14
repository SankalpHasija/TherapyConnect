import type { ReactElement } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import AppShellHeader from '@/components/layout/AppShellHeader'
import NoteEditor from '@/components/notes/NoteEditor'

type Params = {
  id: string
  noteId: string
}

export default async function NoteDetailPage({
  params,
}: {
  params: Promise<Params>
}): Promise<ReactElement> {
  const session = await auth()
  if (!session) redirect('/login')

  const { id, noteId } = await params

  const note = await prisma.progressNote.findUnique({
    where: { id: noteId },
  })

  if (!note) {
    redirect(`/clients/${id}`)
  }

  return (
    <div className="space-y-6">
      <AppShellHeader title="Progress note" />
      <NoteEditor
        noteId={note.id}
        clientId={id}
        initial={{
          subjective: note.subjective,
          objective: note.objective,
          assessment: note.assessment,
          plan: note.plan,
          aiGenerated: note.aiGenerated,
        }}
      />
    </div>
  )
}
