import { NextResponse } from 'next/server'
import { computeSessionToken, COOKIE_NAME, COOKIE_MAX_AGE } from '@/lib/auth'

export async function POST(request) {
  const { username, password } = await request.json()

  const validUsername = process.env.APP_USERNAME || 'admin'
  const validPassword = process.env.APP_PASSWORD || 'ori2026'

  if (username !== validUsername || password !== validPassword) {
    return NextResponse.json(
      { error: 'Invalid username or password.' },
      { status: 401 },
    )
  }

  const token    = computeSessionToken()
  const response = NextResponse.json({ success: true })

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'strict',
    path:     '/',
    maxAge:   COOKIE_MAX_AGE,
  })

  return response
}
