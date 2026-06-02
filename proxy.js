import { NextResponse } from 'next/server'
import crypto from 'crypto'

const COOKIE_NAME = 'ori_session'

// Inline token computation — avoids import issues in the proxy context.
// Must stay in sync with lib/auth.js computeSessionToken().
function expectedToken() {
  const username = process.env.APP_USERNAME       || 'admin'
  const password = process.env.APP_PASSWORD       || 'ori2026'
  const secret   = process.env.APP_SESSION_SECRET || 'ori-sprint-os-2026'
  return crypto
    .createHash('sha256')
    .update(`${username}|${password}|${secret}`)
    .digest('hex')
}

export default function proxy(request) {
  const { pathname } = request.nextUrl
  const session = request.cookies.get(COOKIE_NAME)
  const authed  = session?.value === expectedToken()

  // Login page — allow unauthenticated; redirect away if already logged in
  if (pathname.startsWith('/login')) {
    if (authed) return NextResponse.redirect(new URL('/', request.url))
    return NextResponse.next()
  }

  // Everything else requires a valid session
  if (!authed) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

// Exclude static assets and auth API routes from proxy checks
export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon\\.ico).*)'],
}
