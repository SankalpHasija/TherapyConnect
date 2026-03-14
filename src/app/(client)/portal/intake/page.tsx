import type { ReactElement } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import AppShellHeader from '@/components/layout/AppShellHeader'
import IntakeForm from '@/components/clients/IntakeForm'

export default async function IntakePage(): Promise<ReactElement> {
  const session = await auth()
  if (!session) redirect('/login')

  const profile = await prisma.clientProfile.findUnique({
    where: { userId: session.user.id },
  })

  if (!profile) {
    redirect('/portal')
  }

  return (
    <div className="space-y-6">
      <AppShellHeader title="Client intake" />
      <IntakeForm clientProfileId={profile.id} />
    </div>
  )
}
