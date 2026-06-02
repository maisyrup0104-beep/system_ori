'use client'

import { scoreColor, trendArrow } from '@/lib/stateEngine'
import { Trash2Icon } from 'lucide-react'

function formatDate(str) {
  return new Date(str).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

function Sparkline({ values }) {
  if (values.length < 2) return null
  const W = 72, H = 22
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W
    const y = H - ((v - 1) / 9) * H
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  return (
    <svg width={W} height={H} className="overflow-visible" aria-hidden>
      <polyline
        points={pts}
        fill="none"
        stroke="#86efac"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {values.map((v, i) => {
        const x = (i / (values.length - 1)) * W
        const y = H - ((v - 1) / 9) * H
        return <circle key={i} cx={x} cy={y} r="2" fill="#e879a0" />
      })}
    </svg>
  )
}

function ValueCell({ value }) {
  if (value == null) return <td className="px-3 py-2.5 text-center text-xs text-[#c4b5c0]">—</td>
  const c = scoreColor(value)
  return (
    <td className="px-3 py-2.5 text-center">
      <span className="inline-block w-7 h-7 rounded-lg text-xs font-bold leading-7" style={{ backgroundColor: c.bg, color: c.text }}>
        {value}
      </span>
    </td>
  )
}

export default function StateHistoryChart({ snapshots, metrics, onDelete }) {
  if (!snapshots || snapshots.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#f0e8ee] py-10 text-center">
        <p className="text-sm text-[#9ca3af]">No reviews yet.</p>
        <p className="text-xs text-[#c4b5c0] mt-1">Submit your first review above.</p>
      </div>
    )
  }

  // Sparkline data per metric (chronological order, oldest first)
  const chronological = [...snapshots].reverse()

  return (
    <div className="space-y-6">
      {/* Trend sparklines */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {metrics.map((m) => {
          const values     = chronological.map(s => s[m.key]).filter(v => v != null)
          const latest     = snapshots[0]?.[m.key]
          const previous   = snapshots[1]?.[m.key]
          const trend      = trendArrow(latest, previous)
          const c          = scoreColor(latest)
          return (
            <div key={m.key} className="bg-white rounded-xl border border-[#f0e8ee] p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs text-[#9ca3af]">{m.label}</p>
                {latest != null && (
                  <span className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: c.bg, color: c.text }}>
                    {latest}/10
                  </span>
                )}
              </div>
              {values.length > 1 ? (
                <Sparkline values={values} />
              ) : (
                <p className="text-2xl font-bold text-[#1a1a2e]">{latest ?? '—'}</p>
              )}
              {previous != null && (
                <p className="text-[11px] font-medium mt-1" style={{ color: trend.color }}>{trend.symbol}</p>
              )}
            </div>
          )
        })}
      </div>

      {/* History table */}
      <div className="bg-white rounded-xl border border-[#f0e8ee] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#f0e8ee] bg-[#fafafa]">
          <p className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Review History</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#f0e8ee]">
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#9ca3af]">Date</th>
              {metrics.map((m) => (
                <th key={m.key} className="text-center px-3 py-2.5 text-xs font-semibold text-[#9ca3af]">{m.label}</th>
              ))}
              <th className="px-3 py-2.5 text-xs font-semibold text-[#9ca3af] text-left">Notes</th>
              <th className="px-3 py-2.5 w-8" />
            </tr>
          </thead>
          <tbody>
            {snapshots.map((snap, i) => (
              <tr key={snap.id} className={`border-b border-[#f9f0f5] hover:bg-[#fdf7fb] ${i === 0 ? 'bg-[#fffbfd]' : ''} ${i === snapshots.length - 1 ? 'border-b-0' : ''}`}>
                <td className="px-4 py-2.5 text-xs text-[#6b7280] whitespace-nowrap">
                  {i === 0 && <span className="text-[10px] font-bold text-[#e879a0] mr-1.5">Latest</span>}
                  {formatDate(snap.created_at)}
                </td>
                {metrics.map((m) => <ValueCell key={m.key} value={snap[m.key]} />)}
                <td className="px-3 py-2.5 text-xs text-[#9ca3af] max-w-[180px] truncate">{snap.notes || '—'}</td>
                <td className="px-3 py-2.5">
                  <button
                    onClick={() => onDelete(snap.id)}
                    className="p-1 rounded hover:bg-[#fee2e2]/60 text-[#d1d5db] hover:text-[#ef4444] transition-colors"
                  >
                    <Trash2Icon size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
