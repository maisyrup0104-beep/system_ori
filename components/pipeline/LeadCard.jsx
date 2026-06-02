'use client'

import { useState } from 'react'
import { STAGES, computePriority, PRIORITY_COLORS } from '@/lib/pipelineConfig'
import { CalendarIcon, UserIcon, MoreVerticalIcon } from 'lucide-react'

function formatDate(str) {
  if (!str) return null
  return new Date(str).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
}

function followUpStatus(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  d.setHours(0, 0, 0, 0)
  if (d < today)                    return 'overdue'
  if (d.getTime() === today.getTime())     return 'today'
  if (d.getTime() === tomorrow.getTime())  return 'tomorrow'
  return 'upcoming'
}

const followUpColors = {
  overdue:  { text: '#ef4444', bg: '#fee2e2' },
  today:    { text: '#d97706', bg: '#fef3c7' },
  tomorrow: { text: '#16a34a', bg: '#dcfce7' },
  upcoming: { text: '#64748b', bg: '#f1f5f9' },
}

export default function LeadCard({
  lead, onView, onStageChange, onAddNote,
  onScheduleFollowUp, onEdit, onDelete,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const priority  = computePriority(lead.stage)
  const pColors   = priority ? PRIORITY_COLORS[priority] : null
  const fuStatus  = followUpStatus(lead.next_followup_date)
  const fuColors  = fuStatus ? followUpColors[fuStatus] : null

  function handleStageChange(e) {
    e.stopPropagation()
    onStageChange(lead.id, e.target.value, lead.stage)
  }

  const menuItems = [
    { label: 'Open',              action: () => onView(lead),             style: 'normal' },
    { label: 'Edit',              action: () => onEdit(lead),             style: 'normal' },
    { label: 'Schedule Follow-Up',action: () => onScheduleFollowUp(lead), style: 'normal' },
    { label: 'Delete Lead',       action: () => onDelete(lead),           style: 'danger' },
  ]

  return (
    <div
      className="bg-white rounded-xl border border-[#f0e8ee] p-3.5 cursor-pointer hover:border-[#fce4ed] hover:shadow-sm transition-all"
      onClick={() => onView(lead)}
    >
      {/* Top row: segment + priority */}
      <div className="flex items-center justify-between gap-2 mb-2">
        {lead.segment ? (
          <span className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wide">{lead.segment}</span>
        ) : <span />}
        {pColors && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: pColors.bg, color: pColors.text }}>
            {priority}
          </span>
        )}
      </div>

      {/* Business name */}
      <p className="text-sm font-semibold text-[#1a1a2e] leading-snug mb-1">{lead.business_name}</p>
      {lead.contact_name && <p className="text-xs text-[#9ca3af] mb-2">{lead.contact_name}</p>}

      {/* Dates */}
      <div className="space-y-1 mb-3">
        {lead.last_contact_date && (
          <div className="flex items-center gap-1.5 text-[11px] text-[#9ca3af]">
            <UserIcon size={10} />
            <span>Last: {formatDate(lead.last_contact_date)}</span>
          </div>
        )}
        {lead.next_followup_date && fuColors && (
          <div className="flex items-center gap-1.5 text-[11px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: fuColors.bg, color: fuColors.text }}>
            <CalendarIcon size={10} />
            <span>
              {fuStatus === 'overdue' ? 'Overdue' : fuStatus === 'today' ? 'Today' : fuStatus === 'tomorrow' ? 'Tomorrow' : formatDate(lead.next_followup_date)}
            </span>
          </div>
        )}
      </div>

      {/* Action row */}
      <div className="flex items-center gap-1.5 pt-2.5 border-t border-[#f0e8ee]" onClick={(e) => e.stopPropagation()}>
        <select
          value={lead.stage || 'Prospect'}
          onChange={handleStageChange}
          className="flex-1 h-7 px-2 text-xs border border-[#f0e8ee] rounded-lg bg-white text-[#4b5563] focus:outline-none focus:ring-1 focus:ring-[#f9a8c3] cursor-pointer"
        >
          {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* ⋮ menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#9ca3af] hover:text-[#6b7280] transition-colors"
            title="More actions"
          >
            <MoreVerticalIcon size={13} />
          </button>

          {menuOpen && (
            <>
              {/* backdrop to close */}
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              {/* dropdown */}
              <div className="absolute right-0 bottom-full mb-1 z-50 bg-white rounded-xl shadow-lg border border-[#f0e8ee] py-1 w-44 overflow-hidden">
                {menuItems.map((item, i) => (
                  <button
                    key={item.label}
                    onClick={() => { setMenuOpen(false); item.action() }}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                      item.style === 'danger'
                        ? 'text-[#ef4444] hover:bg-[#fee2e2]/50 font-medium'
                        : 'text-[#4b5563] hover:bg-[#f9f0f5]'
                    } ${i === menuItems.length - 2 ? 'border-b border-[#f0e8ee]' : ''}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
