'use client'

import { formatPHP } from '@/lib/currency'

export default function RevenueGoalWidget({ goal, current, daysLeft }) {
  const remaining = Math.max(0, goal - current)
  const pct       = goal > 0 ? Math.min(100, Math.round((current / goal) * 100)) : 0
  const perDay    = daysLeft > 0 ? Math.ceil(remaining / daysLeft) : 0

  return (
    <div className="bg-white rounded-2xl border border-[#f0e8ee] p-6 mb-6">
      {/* Progress bar */}
      <div className="mb-5">
        <div className="flex items-end justify-between mb-2">
          <div>
            <p className="text-xs text-[#9ca3af] mb-0.5">Revenue Progress</p>
            <p className="text-2xl font-bold text-[#1a1a2e] tracking-tight">
              {formatPHP(current)}
              <span className="text-sm font-normal text-[#9ca3af] ml-1">/ {formatPHP(goal)}</span>
            </p>
          </div>
          <p className="text-3xl font-bold text-[#e879a0]">{pct}%</p>
        </div>
        <div className="h-3 rounded-full bg-[#fce4ed] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#86efac] transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 pt-4 border-t border-[#f0e8ee]">
        <div>
          <p className="text-[11px] text-[#9ca3af] mb-0.5">Revenue Goal</p>
          <p className="text-base font-semibold text-[#1a1a2e]">{formatPHP(goal)}</p>
        </div>
        <div>
          <p className="text-[11px] text-[#9ca3af] mb-0.5">Current Revenue</p>
          <p className="text-base font-semibold text-[#16a34a]">{formatPHP(current)}</p>
        </div>
        <div>
          <p className="text-[11px] text-[#9ca3af] mb-0.5">Remaining</p>
          <p className="text-base font-semibold text-[#e879a0]">{formatPHP(remaining)}</p>
        </div>
        <div>
          <p className="text-[11px] text-[#9ca3af] mb-0.5">Required / Day</p>
          <p className="text-base font-semibold text-[#1a1a2e]">
            {daysLeft > 0 ? `${formatPHP(perDay)}/day` : '—'}
          </p>
          {daysLeft > 0 && <p className="text-[10px] text-[#c4b5c0]">{daysLeft} days left</p>}
        </div>
      </div>
    </div>
  )
}
