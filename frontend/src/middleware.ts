import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const userType = req.nextauth.token?.userType

    // If trying to access protected routes without auth
    if (pathname.startsWith('/cv-result') || pathname.startsWith('/dashboard') || pathname.startsWith('/company') || pathname.startsWith('/candidate')) {
      if (!req.nextauth.token) {
        return NextResponse.redirect(new URL('/auth/login', req.url))
      }
    }

    // If authenticated user tries to access auth pages
    if (pathname.startsWith('/auth/login') || pathname.startsWith('/auth/signup')) {
      if (req.nextauth.token) {
        return NextResponse.redirect(new URL('/', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized({ req, token }) {
        // Protect specific routes
        if (req.nextUrl.pathname.startsWith('/cv-result') || 
            req.nextUrl.pathname.startsWith('/dashboard') ||
            req.nextUrl.pathname.startsWith('/company') || 
            req.nextUrl.pathname.startsWith('/candidate')) {
          return token !== null
        }
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    '/cv-result/:path*',
    '/dashboard/:path*',
    '/company/:path*',
    '/candidate/:path*',
    '/auth/login',
    '/auth/signup',
  ],
} 