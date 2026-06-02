'use client'

import { scoreColor, scoreLabel } from '@/lib/stateEngine'
import { TYPE_COLORS } from '@/lib/eventConfig'

function formatDate(str) {
  return new Date(str).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
}

const platformColors = {
  Personal: { bg: '#fce4ed', text: '#e879a0' },
  Ori:      { bg: '#dbeafe', text: '#3b82f6' },
}

export default function ContentRecommendationCard({ rec }) {
  const pc = platformColors[rec.platform] || platformColors.Personal
  const sc = scoreColor(rec.metricValue)

  return (
    <div className="bg-white rounded-xl border border-[#f0e8ee] p-5">
      {/* Platform + category header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: pc.bg, color: pc.text }}>
              {rec.platform}
            </span>
          </div>
          <h3 className="text-base font-semibold text-[#1a1a2e]">{rec.category}</h3>
        </div>
        <div className="text-right flex-shrink-0">
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: sc.bg, color: sc.text }}>
            {rec.metric} {rec.metricValue}/10
          </span>
        </div>
      </div>

      {/* Reason */}
      <p className="text-xs text-[#9ca3af] mb-3">{rec.reason}</p>

      {/* Required event types */}
      <div className="flex flex-wrap gap-1 mb-3">
        {rec.eventTypes.map((t) => {
          const c = TYPE_COLORS[t] || { bg: '#f1f5f9', text: '#64748b' }
          return (
            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: c.bg, color: c.text }}>
              {t}
            </span>
          )
        })}
      </div>

      {/* Supporting events */}
      {rec.supportingEvents.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide">Evidence You Have</p>
          {rec.supportingEvents.map((e) => (
            <div key={e.id} className="flex items-start gap-2 bg-[#fdf7fb] rounded-lg px-2.5 py-2 border border-[#f0e8ee]">
              <span className="text-[10px] font-semibold flex-shrink-0 mt-0.5 text-[#c4b5c0]">{formatDate(e.created_at)}</span>
              <p className="text-xs text-[#374151] line-clamp-1">{e.title}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#fef9c3] rounded-lg px-3 py-2 border border-[#fde68a]">
          <p className="text-xs text-[#d97706]">No supporting events yet — log some to strengthen this category.</p>
        </div>
      )}
    </div>
  )
}
