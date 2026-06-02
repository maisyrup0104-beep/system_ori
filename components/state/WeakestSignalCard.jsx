'use client'

import Link from 'next/link'
import { scoreColor, scoreLabel, ACTION_MAP } from '@/lib/stateEngine'

// Re-export ACTION_MAP isn't exported from stateEngine — inline the lookup here
const ACTION_LOOKUP = {
  trust:        'Talk to 5 businesses',
  proof:        'Finish one demo',
  relevance:    'Visit a clinic or spa',
  momentum:     'Send 20 outreach messages',
  authority:    'Share an industry observation',
  authenticity: 'Document a current challenge',
  capability:   'Build or improve a demo feature',
  credibility:  'Collect a validation or testimonial',
}

export default function WeakestSignalCard({ signal }) {
  if (!signal) {
    return (
      <div className="rounded-xl border border-[#f0e8ee] bg-white p-5">
        <p className="text-xs text-[#9ca3af] mb-1">Weakest Signal</p>
        <p className="text-sm text-[#c4b5c0]">No state reviews yet.</p>
        <Link href="/personal-state" className="text-xs text-[#e879a0] hover:underline mt-1 inline-block">
          Submit first review →
        </Link>
      </div>
    )
  }

  const c      = scoreColor(signal.value)
  const action = ACTION_LOOKUP[signal.key]

  return (
    <div className="rounded-xl border border-[#f0e8ee] bg-white p-5">
      <p className="text-xs text-[#9ca3af] mb-3 font-medium uppercase tracking-wide">Weakest Signal</p>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl font-bold text-[#1a1a2e]">{signal.value}</span>
        <div>
          <p className="text-base font-semibold text-[#1a1a2e]">{signal.label}</p>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: c.bg, color: c.text }}>
            {scoreLabel(signal.value)}
          </span>
        </div>
      </div>
      {action && (
        <div className="bg-[#fdf7fb] rounded-lg px-3 py-2 border border-[#f0e8ee]">
          <p className="text-[11px] text-[#9ca3af] mb-0.5">Recommended Action</p>
          <p className="text-sm font-medium text-[#1a1a2e]">{action}</p>
        </div>
      )}
    </div>
  )
}
