import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

// Public routes that never require authentication
const PUBLIC_ROUTES = ['/', '/login', '/signup', '/invite/accept']

export default withAuth(
  function middleware(req) {
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
