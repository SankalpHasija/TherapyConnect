import type { ReactElement } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import AppShellHeader from '@/components/layout/AppShellHeader'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const statusStyles: Record<string, string> = {
  PAID: 'bg-green-100 text-green-700 border-green-200',
  PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
  FAILED: 'bg-red-100 text-red-700 border-red-200',
  REFUNDED: 'bg-slate-100 text-slate-700 border-slate-200',
}

export default async function BillingPage(): Promise<ReactElement> {
  const session = await auth()
  if (!session) redirect('/login')

  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const [payments, totalRevenue, pendingCount, monthRevenue] = await Promise.all([
    prisma.payment.findMany({
      where: {
        appointment: { practitionerId: session.user.id },
      },
      include: {
        appointment: {
          include: { client: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: 'PAID',
        appointment: { practitionerId: session.user.id },
      },
    }),
    prisma.payment.count({
      where: {
        status: 'PENDING',
        appointment: { practitionerId: session.user.id },
      },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: 'PAID',
        appointment: { practitionerId: session.user.id },
        createdAt: { gte: monthStart, lte: monthEnd },
      },
    }),
  ])

  const totalRevenueDollars = ((totalRevenue._sum.amount ?? 0) / 100).toFixed(2)
  const monthRevenueDollars = ((monthRevenue._sum.amount ?? 0) / 100).toFixed(2)

  return (
    <div className="space-y-6">
      <AppShellHeader title="Billing" />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-slate-900">${totalRevenueDollars}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pending Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-slate-900">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-slate-900">${monthRevenueDollars}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Appointment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-sm text-slate-500">
                    No payments found.
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id} className="table-row-hover">
                    <TableCell className="font-medium text-slate-900">
                      {payment.appointment.client.name}
                    </TableCell>
                    <TableCell>{format(payment.createdAt, 'PPP')}</TableCell>
                    <TableCell>${(payment.amount / 100).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusStyles[payment.status] ?? 'bg-slate-100 text-slate-700'}
                      >
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/appointments/${payment.appointmentId}`}
                        className="text-sm text-slate-700 hover:text-slate-900"
                      >
                        View
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
