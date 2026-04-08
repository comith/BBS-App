import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Paths that always bypass maintenance mode
const BYPASS_PREFIXES = [
  '/maintenance',  // the maintenance page itself
  '/api/',         // all API routes (including maintenance toggle)
  '/_next/',       // Next.js internals
  '/icons/',       // static assets
  '/img/',
  '/favicon',
  '/dashboard',    // admin must always be able to reach dashboard to turn off maintenance
]

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (BYPASS_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  try {
    const statusUrl = new URL('/api/maintenance-status', request.url)
    const res = await fetch(statusUrl.toString())
    if (res.ok) {
      const { isActive } = await res.json()
      if (isActive) {
        return NextResponse.redirect(new URL('/maintenance', request.url))
      }
    }
  } catch {
    // If status check fails (e.g. DB down), allow request through
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
