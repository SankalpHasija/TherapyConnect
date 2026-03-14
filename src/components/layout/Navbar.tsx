'use client'

import type { ReactElement } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { Menu } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'

const practitionerLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/appointments', label: 'Appointments' },
  { href: '/clients', label: 'Clients' },
  { href: '/billing', label: 'Billing' },
]

const clientLinks = [
  { href: '/portal', label: 'Home' },
  { href: '/portal/book', label: 'Book Session' },
]

const adminLinks = [{ href: '/admin/users', label: 'Users' }]

type NavLink = {
  href: string
  label: string
}

export default function Navbar(): ReactElement {
  const { data: session } = useSession()
  const pathname = usePathname()
  const role = session?.user?.role
  const links: NavLink[] =
    role === 'PRACTITIONER'
      ? practitionerLinks
      : role === 'CLIENT'
        ? clientLinks
        : role === 'ADMIN'
          ? adminLinks
          : []

  return (
    <header className="fixed top-0 z-50 w-full border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-900 text-sm font-semibold text-white">
                TC
              </span>
              <span className="text-lg font-semibold text-slate-900">TherapyConnect Pro</span>
            </Link>
          </div>

          <nav className="hidden md:flex flex-1 items-center justify-center gap-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'text-slate-900'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {session?.user?.name && (
              <span className="text-sm text-slate-600">{session.user.name}</span>
            )}
            {role && <Badge variant="secondary">{role}</Badge>}
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await signOut({ callbackUrl: '/login' })
              }}
            >
              Sign Out
            </Button>
          </div>

          <div className="md:hidden">
            <Sheet>
              <SheetTrigger
                aria-label="Open menu"
                className={buttonVariants({ variant: 'ghost', size: 'icon' })}
              >
                <Menu className="h-5 w-5" />
              </SheetTrigger>
              <SheetContent side="left" className="w-64">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Navigation
                    </p>
                    {links.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="block rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                  <div className="space-y-2 border-t border-slate-200 pt-4">
                    {session?.user?.name && (
                      <p className="text-sm text-slate-600">{session.user.name}</p>
                    )}
                    {role && <Badge variant="secondary">{role}</Badge>}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        await signOut({ callbackUrl: '/login' })
                      }}
                      className="w-full"
                    >
                      Sign Out
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
