'use client'

import { useEffect, useState } from 'react'
import { getSettings } from '@/services/settings'

function formatPHP(value) {
  if (value === null || value === undefined) return '₱—'
  return `₱${Number(value).toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export default function TopHeader() {
  const [settings, setSettings] = useState(null)

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch(() => setSettings(null))
  }, [])

  const revenueGoal = settings?.revenue_goal ?? 0
  const currentRevenue = settings?.current_revenue ?? 0
  const revenueRemaining = Math.max(0, revenueGoal - currentRevenue)
  const daysLeft = settings?.days_remaining ?? '—'
  const currentFocus = settings?.current_focus ?? 'Not set'

  return (
    <header className="fixed top-0 left-56 right-0 h-14 bg-white border-b border-[#f0e8ee] flex items-center px-6 z-10">
      <div className="flex items-center gap-6 flex-1 min-w-0">
        <HeaderStat label="Goal" value={formatPHP(revenueGoal)} />
        <div className="h-4 w-px bg-[#f0e8ee]" />
        <HeaderStat label="Remaining" value={formatPHP(revenueRemaining)} highlight />
        <div className="h-4 w-px bg-[#f0e8ee]" />
        <HeaderStat label="Days Left" value={daysLeft} />
        <div className="h-4 w-px bg-[#f0e8ee]" />
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-[#9ca3af] whitespace-nowrap">Focus</span>
          <span className="text-xs font-medium text-[#1a1a2e] truncate max-w-48">{currentFocus}</span>
        </div>
      </div>
    </header>
  )
}

function HeaderStat({ label, value, highlight }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[#9ca3af]">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? 'text-[#e879a0]' : 'text-[#1a1a2e]'}`}>
        {value}
      </span>
    </div>
  )
}
