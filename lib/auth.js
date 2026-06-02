import crypto from 'crypto'

export const COOKIE_NAME = 'ori_session'
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

// Deterministic session token derived from credentials + secret.
// Changing any env var immediately invalidates all existing sessions.
export function computeSessionToken() {
  const username = process.env.APP_USERNAME       || 'admin'
  const password = process.env.APP_PASSWORD       || 'ori2026'
  const secret   = process.env.APP_SESSION_SECRET || 'ori-sprint-os-2026'
  return crypto
    .createHash('sha256')
    .update(`${username}|${password}|${secret}`)
    .digest('hex')
}
