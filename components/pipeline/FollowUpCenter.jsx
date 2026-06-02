'use client'

import { CalendarIcon } from 'lucide-react'
import { STAGE_COLORS, computePriority, PRIORITY_COLORS } from '@/lib/pipelineConfig'

function formatDate(str) {
  if (!str) return ''
  return new Date(str).toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' })
}

function bucketLead(lead) {
  if (!lead.next_followup_date) return null
  const d = new Date(lead.next_followup_date)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  d.setHours(0, 0, 0, 0)
  if (d < today)                    return 'overdue'
  if (d.getTime() === today.getTime())     return 'today'
  if (d.getTime() === tomorrow.getTime())  return 'tomorrow'
  return 'upcoming'
}

const BUCKET_CONFIG = {
  overdue:  { label: 'Overdue',   bg: '#fee2e2', border: '#fca5a5', text: '#ef4444', dot: '#ef4444' },
  today:    { label: 'Today',     bg: '#fef3c7', border: '#fde68a', text: '#d97706', dot: '#f59e0b' },
  tomorrow: { label: 'Tomorrow',  bg: '#dcfce7', border: '#86efac', text: '#16a34a', dot: '#22c55e' },
  upcoming: { label: 'Upcoming',  bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d', dot: '#86efac' },
}

function LeadRow({ lead, onView }) {
  const stageColors = STAGE_COLORS[lead.stage] || STAGE_COLORS['Prospect']
  const priority    = computePriority(lead.stage)
  const pColors     = priority ? PRIORITY_COLORS[priority] : null

  return (
    <div
      className="flex items-center justify-between gap-3 px-4 py-3 bg-white rounded-xl border border-[#f0e8ee] hover:border-[#fce4ed] hover:shadow-sm transition-all cursor-pointer"
      onClick={() => onView(lead)}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#1a1a2e] truncate">{lead.business_name}</p>
        {lead.contact_name && <p className="text-xs text-[#9ca3af]">{lead.contact_name}</p>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {lead.segment && (
          <span className="text-[10px] text-[#9ca3af] font-medium">{lead.segment}</span>
        )}
        <span className="text-xs px-2 py-0.5 rounded-md font-medium" style={{ backgroundColor: stageColors.bg, color: stageColors.text }}>
          {lead.stage}
        </span>
        {pColors && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: pColors.bg, color: pColors.text }}>
            {priority}
          </span>
        )}
        <div className="flex items-center gap-1 text-xs text-[#9ca3af]">
          <CalendarIcon size={11} />
          {formatDate(lead.next_followup_date)}
        </div>
      </div>
    </div>
  )
}

function BucketSection({ bucket, leads, onView }) {
  if (leads.length === 0) return null
  const cfg = BUCKET_CONFIG[bucket]

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.dot }} />
        <h3 className="text-sm font-semibold" style={{ color: cfg.text }}>{cfg.label}</h3>
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ backgroundColor: cfg.bg, color: cfg.text }}
        >
          {leads.length}
        </span>
      </div>
      <div className="space-y-2 pl-4 border-l-2" style={{ borderColor: cfg.border }}>
        {leads.map((lead) => (
          <LeadRow key={lead.id} lead={lead} onView={onView} />
        ))}
      </div>
    </div>
  )
}

export default function FollowUpCenter({ leads, onView }) {
  const buckets = { overdue: [], today: [], tomorrow: [], upcoming: [] }

  for (const lead of leads) {
    if (lead.stage === 'Closed' || lead.stage === 'Lost') continue
    const bucket = bucketLead(lead)
    if (bucket) buckets[bucket].push(lead)
  }

  const total = Object.values(buckets).reduce((s, arr) => s + arr.length, 0)

  return (
    <div>
      {total === 0 ? (
        <div className="bg-white rounded-xl border border-[#f0e8ee] py-16 text-center">
          <p className="text-sm text-[#9ca3af]">No follow-ups scheduled.</p>
          <p className="text-xs text-[#c4b5c0] mt-1">Open a lead and set a follow-up date.</p>
        </div>
      ) : (
        <>
          <BucketSection bucket="overdue"  leads={buckets.overdue}  onView={onView} />
          <BucketSection bucket="today"    leads={buckets.today}    onView={onView} />
          <BucketSection bucket="tomorrow" leads={buckets.tomorrow} onView={onView} />
          <BucketSection bucket="upcoming" leads={buckets.upcoming} onView={onView} />
        </>
      )}
    </div>
  )
}
