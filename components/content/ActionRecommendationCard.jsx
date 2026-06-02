'use client'

import { scoreColor, scoreLabel } from '@/lib/stateEngine'

const kindColors = {
  personal: { bg: '#fce4ed', text: '#e879a0', label: 'Personal' },
  ori:      { bg: '#dbeafe', text: '#3b82f6', label: 'Ori' },
}

export default function ActionRecommendationCard({ rec, rank }) {
  const c    = scoreColor(rec.value)
  const kind = kindColors[rec.kind] || kindColors.personal

  return (
    <div className="bg-white rounded-xl border border-[#f0e8ee] p-4 flex gap-4">
      {/* Rank */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#fdf7fb] border border-[#f0e8ee] flex items-center justify-center text-sm font-bold text-[#e879a0]">
        {rank}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: kind.bg, color: kind.text }}>
            {kind.label}
          </span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: c.bg, color: c.text }}>
            {rec.metric} {rec.value}/10
          </span>
        </div>
        <p className="text-sm font-semibold text-[#1a1a2e]">{rec.action}</p>
        <p className="text-xs text-[#9ca3af] mt-0.5">{rec.detail}</p>
      </div>
    </div>
  )
}
