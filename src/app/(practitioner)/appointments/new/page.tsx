import type { ReactElement } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import AppShellHeader from '@/components/layout/AppShellHeader'
import BookingForm from '@/components/appointments/BookingForm'

export default async function NewAppointmentPage(): Promise<ReactElement> {
  const session = await auth()
  if (!session) redirect('/login')

  const clients = await prisma.user.findMany({
    where: {
      role: 'CLIENT',
      clientProfile: { practitionerId: session.user.id },
    },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="space-y-6">
      <AppShellHeader title="Book appointment" />
      <div className="mx-auto w-full max-w-[560px]">
        <BookingForm clients={clients} />
      </div>
    </div>
  )
}
