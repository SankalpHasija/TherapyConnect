'use client'

import type { ReactElement } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  Activity,
  Calendar,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type NavItem = {
  label: string
  href: string
  icon: LucideIcon
}

const practitionerNav: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Appointments', href: '/appointments', icon: Calendar },
  { label: 'Clients', href: '/clients', icon: Users },
  { label: 'Notes', href: '/clients', icon: FileText },
  { label: 'Billing', href: '/billing', icon: CreditCard },
]

const clientNav: NavItem[] = [
  { label: 'Home', href: '/portal', icon: LayoutDashboard },
  { label: 'Book session', href: '/portal/book', icon: Calendar },
  { label: 'Assessments', href: '/portal/assessments', icon: Activity },
]

const adminNav: NavItem[] = [{ label: 'Users', href: '/admin/users', icon: Users }]

type SidebarProps = {
  variant?: 'desktop' | 'sheet'
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0][0] ?? ''
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`
}

export default function Sidebar({ variant = 'desktop' }: SidebarProps): ReactElement {
  const { data: session } = useSession()
  const pathname = usePathname()
  const role = session?.user?.role

  const navItems =
    role === 'PRACTITIONER'
      ? practitionerNav
      : role === 'CLIENT'
        ? clientNav
        : role === 'ADMIN'
          ? adminNav
          : []

  const mainNav =
    role === 'PRACTITIONER'
      ? navItems.filter((item) => item.label !== 'Billing')
      : navItems

  const financeNav =
    role === 'PRACTITIONER'
      ? navItems.filter((item) => item.label === 'Billing')
      : []

  const containerClasses =
    variant === 'desktop'
      ? 'app-sidebar'
      : 'w-[220px] h-full'

  return (
    <aside
      className={cn(
        containerClasses,
        'flex flex-col bg-[var(--sidebar-bg)] text-[var(--sidebar-text)]'
      )}
    >
      <div className="border-b border-[var(--sidebar-border)] px-4 py-4">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-bold text-white">TherapyConnect</span>
          <span className="rounded-full bg-[var(--sidebar-accent)] px-2 py-0.5 text-[10px] font-semibold text-slate-900">
            Pro
          </span>
        </div>
        <p className="mt-1 text-[11px] text-[rgba(255,255,255,0.4)]">
          Practice Management
        </p>
      </div>

      <div className="flex-1 py-3">
        <p className="px-5 pb-2 text-[10px] uppercase tracking-[0.06em] text-[var(--sidebar-accent)]">
          Main
        </p>
        <nav className="space-y-1">
          {mainNav.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'mx-2 flex items-center gap-2 rounded-[7px] px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'border-l-2 border-[var(--sidebar-accent)] bg-[var(--sidebar-bg-active)] text-white'
                    : 'hover:bg-[var(--sidebar-bg-hover)]'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {role === 'PRACTITIONER' && (
          <>
            <p className="px-5 pb-2 pt-4 text-[10px] uppercase tracking-[0.06em] text-[var(--sidebar-accent)]">
              Finance
            </p>
            <nav className="space-y-1">
              {financeNav.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'mx-2 flex items-center gap-2 rounded-[7px] px-3 py-2 text-sm transition-colors',
                      isActive
                        ? 'border-l-2 border-[var(--sidebar-accent)] bg-[var(--sidebar-bg-active)] text-white'
                        : 'hover:bg-[var(--sidebar-bg-hover)]'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </>
        )}
      </div>

      <div className="border-t border-[var(--sidebar-border)] px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--sidebar-accent)] text-xs font-semibold text-slate-900">
            {getInitials(session?.user?.name ?? 'User')}
          </div>
          <div>
            <p className="text-[12px] font-medium text-white">
              {session?.user?.name ?? 'User'}
            </p>
            <p className="text-[10px] text-[rgba(255,255,255,0.4)]">{role ?? '—'}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Sign out"
            onClick={async () => {
              await signOut({ callbackUrl: '/login' })
            }}
            className="ml-auto text-[rgba(255,255,255,0.4)] hover:bg-transparent hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  )
}
