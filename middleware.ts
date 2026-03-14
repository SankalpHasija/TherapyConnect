import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { nextUrl } = req
  const session = req.auth
  const isLoggedIn = !!session
  const role = session?.user?.role

  const isPractitionerRoute =
    nextUrl.pathname.startsWith('/dashboard') ||
    nextUrl.pathname.startsWith('/appointments') ||
    nextUrl.pathname.startsWith('/clients') ||
    nextUrl.pathname.startsWith('/billing')

  const isClientRoute = nextUrl.pathname.startsWith('/portal')
  const isAdminRoute = nextUrl.pathname.startsWith('/admin')
  const isAuthRoute =
    nextUrl.pathname === '/login' || nextUrl.pathname === '/register'
  const isHomeRoute = nextUrl.pathname === '/'

  // Not logged in → redirect to login
  if (!isLoggedIn && (isPractitionerRoute || isClientRoute || isAdminRoute)) {
    return NextResponse.redirect(new URL('/login', nextUrl))
  }

  // Logged in + on auth page → redirect to their home
  if (isLoggedIn && isAuthRoute) {
    if (role === 'PRACTITIONER')
      return NextResponse.redirect(new URL('/dashboard', nextUrl))
    if (role === 'CLIENT') return NextResponse.redirect(new URL('/portal', nextUrl))
    if (role === 'ADMIN') return NextResponse.redirect(new URL('/admin', nextUrl))
  }

  if (isLoggedIn && isHomeRoute) {
    if (role === 'PRACTITIONER')
      return NextResponse.redirect(new URL('/dashboard', nextUrl))
    if (role === 'CLIENT') return NextResponse.redirect(new URL('/portal', nextUrl))
    if (role === 'ADMIN') return NextResponse.redirect(new URL('/admin', nextUrl))
  }

  // Wrong role for route → redirect to login
  if (isLoggedIn) {
    if (isPractitionerRoute && role !== 'PRACTITIONER')
      return NextResponse.redirect(new URL('/login', nextUrl))
    if (isClientRoute && role !== 'CLIENT')
      return NextResponse.redirect(new URL('/login', nextUrl))
    if (isAdminRoute && role !== 'ADMIN')
      return NextResponse.redirect(new URL('/login', nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
