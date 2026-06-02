'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [form,    setForm]    = useState({ username: '', password: '' })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  function set(key, value) { setForm((p) => ({ ...p, [key]: value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        router.push('/')
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Invalid username or password.')
      }
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fdf7fb] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#fce4ed] mb-4">
            <span className="text-[#e879a0] text-xl font-bold">O</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1a1a2e] tracking-tight">ORI Sprint OS</h1>
          <p className="text-sm text-[#9ca3af] mt-1">18-Day Revenue System</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-[#f0e8ee] shadow-sm p-8">
          <h2 className="text-base font-semibold text-[#1a1a2e] mb-5">Sign In</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="username" className="text-xs font-medium text-[#4b5563]">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={form.username}
                onChange={(e) => set('username', e.target.value)}
                placeholder="Enter username"
                autoComplete="username"
                required
                className="w-full h-9 px-3 text-sm border border-[#f0e8ee] rounded-lg bg-white text-[#1a1a2e] placeholder:text-[#c4b5c0] focus:outline-none focus:ring-2 focus:ring-[#f9a8c3] focus:border-transparent transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-medium text-[#4b5563]">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                required
                className="w-full h-9 px-3 text-sm border border-[#f0e8ee] rounded-lg bg-white text-[#1a1a2e] placeholder:text-[#c4b5c0] focus:outline-none focus:ring-2 focus:ring-[#f9a8c3] focus:border-transparent transition-all"
              />
            </div>

            {error && (
              <div className="bg-[#fff5f5] border border-[#fecaca] rounded-lg px-3 py-2.5">
                <p className="text-xs text-[#ef4444]">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-9 bg-[#e879a0] hover:bg-[#d4648a] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#c4b5c0] mt-6">
          ORI Sprint OS · Internal Access Only
        </p>
      </div>
    </div>
  )
}
