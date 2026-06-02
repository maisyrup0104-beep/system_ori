'use client'

import { CONTENT_CATEGORIES, getEvidenceCounts } from '@/lib/stateEngine'
import { TYPE_COLORS } from '@/lib/eventConfig'

function evidenceStatus(count) {
  if (count === 0) return { label: 'Missing', bg: '#fee2e2', text: '#ef4444' }
  if (count <= 2)  return { label: 'Weak',    bg: '#fef3c7', text: '#d97706' }
  if (count <= 5)  return { label: 'Moderate',bg: '#dbeafe', text: '#3b82f6' }
  return              { label: 'Strong',  bg: '#dcfce7', text: '#16a34a' }
}

const SECTIONS = [
  { title: 'Personal',          keys: ['Real Validation', 'Building Journey', 'PMF Discoveries', 'Industry Observations'] },
  { title: 'Ori',               keys: ['Concept Features', 'Trust', 'Market Evidence', 'Differentiation', 'Premium Perception'] },
]

export default function EvidencePanel({ events }) {
  const counts = getEvidenceCounts(events)

  return (
    <div className="space-y-6">
      {SECTIONS.map(({ title, keys }) => (
        <div key={title}>
          <p className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wide mb-3">{title} Content</p>
          <div className="grid grid-cols-1 gap-2">
            {keys.map((cat) => {
              const cfg    = CONTENT_CATEGORIES[cat]
              const count  = counts[cat] ?? 0
              const status = evidenceStatus(count)
              return (
                <div key={cat} className="bg-white rounded-xl border border-[#f0e8ee] px-4 py-3 flex items-center gap-4">
                  {/* Category */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1a1a2e]">{cat}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {cfg.eventTypes.map((t) => {
                        const c = TYPE_COLORS[t] || { bg: '#f1f5f9', text: '#64748b' }
                        return (
                          <span key={t} className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: c.bg, color: c.text }}>
                            {t}
                          </span>
                        )
                      })}
                    </div>
                  </div>

                  {/* Count + status */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-xl font-bold text-[#1a1a2e]">{count}</p>
                      <p className="text-[10px] text-[#9ca3af]">events</p>
                    </div>
                    <span
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-full min-w-[64px] text-center"
                      style={{ backgroundColor: status.bg, color: status.text }}
                    >
                      {status.label}
                    </span>

                    {/* Mini bar */}
                    <div className="w-20 h-2 rounded-full bg-[#f1f5f9] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (count / 10) * 100)}%`,
                          backgroundColor: status.text,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
