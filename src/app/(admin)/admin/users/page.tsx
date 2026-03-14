import type { ReactElement } from 'react'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import AppShellHeader from '@/components/layout/AppShellHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import UserTable, { type UserRow } from '@/components/admin/UserTable'

export default async function AdminUsersPage(): Promise<ReactElement> {
  const session = await auth()
  if (!session) redirect('/login')

  const [users, totalUsers, practitioners, clients, admins] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count(),
    prisma.user.count({ where: { role: 'PRACTITIONER' } }),
    prisma.user.count({ where: { role: 'CLIENT' } }),
    prisma.user.count({ where: { role: 'ADMIN' } }),
  ])

  const rows: UserRow[] = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    createdAtLabel: format(user.createdAt, 'PPP'),
  }))

  return (
    <div className="space-y-6">
      <AppShellHeader title="User management" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="space-y-1 p-4">
            <p className="text-xs text-slate-500">Total users</p>
            <p className="text-xl font-semibold text-slate-900">{totalUsers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 p-4">
            <p className="text-xs text-slate-500">Practitioners</p>
            <p className="text-xl font-semibold text-slate-900">{practitioners}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 p-4">
            <p className="text-xs text-slate-500">Clients</p>
            <p className="text-xl font-semibold text-slate-900">{clients}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 p-4">
            <p className="text-xs text-slate-500">Admins</p>
            <p className="text-xl font-semibold text-slate-900">{admins}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <UserTable users={rows} />
        </CardContent>
      </Card>
    </div>
  )
}
