import type { ReactElement } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import AppShellHeader from '@/components/layout/AppShellHeader'
import ClientBookingForm from '@/components/appointments/ClientBookingForm'

export default async function ClientBookPage(): Promise<ReactElement> {
  const session = await auth()
  if (!session) redirect('/login')

  const practitioners = await prisma.user.findMany({
    where: { role: 'PRACTITIONER' },
    select: { id: true, name: true, specialty: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="space-y-6">
      <AppShellHeader title="Book session" />
      <div className="mx-auto w-full max-w-[560px]">
        <ClientBookingForm practitioners={practitioners} />
      </div>
    </div>
  )
}
