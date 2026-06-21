import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

// Public routes that never require authentication
const PUBLIC_ROUTES = ['/', '/login', '/signup', '/invite/accept']

const DEMO_ACCESS_COOKIE = 'demo_access'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl

    // Gate all /demo/* routes behind the shared demo password.
    // The gate page and its API route must stay reachable, or no one
    // could ever pass the check.
    if (
      pathname.startsWith('/demo') &&
      pathname !== '/demo/access' &&
      !pathname.startsWith('/api/demo-auth')
    ) {
      const hasAccess = req.cookies.get(DEMO_ACCESS_COOKIE)?.value === 'granted'
      if (!hasAccess) {
        const accessUrl = new URL('/demo/access', req.url)
        accessUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(accessUrl)
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Allow all public routes
        if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '?'))) {
          return true
        }

        // Allow API routes (they handle their own auth via getServerSession)
        if (pathname.startsWith('/api')) {
          return true
        }

        // /demo/* is gated by password (checked above in middleware()), not by
        // NextAuth session — demo visitors are never logged in.
        if (pathname.startsWith('/demo')) {
          return true
        }

        // Require valid session token for all dashboard routes
        if (pathname.startsWith('/dashboard')) {
          return !!token
        }

        return true
      },
    },
    pages: {
      signIn: '/login',
    },
  }
)

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
