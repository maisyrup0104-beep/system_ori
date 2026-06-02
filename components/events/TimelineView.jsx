'use client'

import { TYPE_COLORS } from '@/lib/eventConfig'
import { PencilIcon, Trash2Icon } from 'lucide-react'

function formatDay(str) {
  return new Date(str).toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

function formatTime(str) {
  return new Date(str).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
}

function getDateKey(str) {
  const d = new Date(str)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function TypeBadge({ type }) {
  const colors = TYPE_COLORS[type] || { bg: '#f1f5f9', text: '#64748b' }
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-md text-xs font-medium"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {type}
    </span>
  )
}

export default function TimelineView({ events, onEdit, onDelete, onView }) {
  if (events.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#f0e8ee] py-16 text-center">
        <p className="text-sm text-[#9ca3af]">No events found.</p>
        <p className="text-xs text-[#c4b5c0] mt-1">Add your first event or adjust the filters.</p>
      </div>
    )
  }

  // Group by day (newest first)
  const sorted = [...events].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  const groups = []
  const seen = {}
  for (const ev of sorted) {
    const key = getDateKey(ev.created_at)
    if (!seen[key]) {
      seen[key] = true
      groups.push({ key, date: ev.created_at, items: [] })
    }
    groups[groups.length - 1].items.push(ev)
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <div key={group.key}>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px flex-1 bg-[#f0e8ee]" />
            <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wide whitespace-nowrap">
              {formatDay(group.date)}
            </span>
            <div className="h-px flex-1 bg-[#f0e8ee]" />
          </div>

          <div className="space-y-2 pl-4 border-l-2 border-[#f0e8ee]">
            {group.items.map((event) => {
              const colors = TYPE_COLORS[event.event_type] || { bg: '#f1f5f9', text: '#64748b' }
              return (
                <div
                  key={event.id}
                  className="relative bg-white rounded-xl border border-[#f0e8ee] p-4 hover:border-[#fce4ed] hover:shadow-sm transition-all cursor-pointer group"
                  onClick={() => onView(event)}
                >
                  {/* timeline dot */}
                  <div
                    className="absolute -left-[21px] top-4 w-3 h-3 rounded-full border-2 border-white"
                    style={{ backgroundColor: colors.text }}
                  />

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <TypeBadge type={event.event_type} />
                        {event.event_subtype && (
                          <span className="text-xs text-[#9ca3af]">{event.event_subtype}</span>
                        )}
                        {event.strength != null && (
                          <span className="text-xs font-semibold text-[#e879a0]">+{event.strength}</span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-[#1a1a2e] leading-snug">{event.title}</p>
                      {event.notes && (
                        <p className="text-xs text-[#9ca3af] mt-1 line-clamp-2">{event.notes}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[11px] text-[#c4b5c0]">{formatTime(event.created_at)}</span>
                        {event.segment && (
                          <span className="text-[11px] text-[#c4b5c0]">{event.segment}</span>
                        )}
                        {event.visibility_target && (
                          <span className="text-[11px] text-[#c4b5c0]">{event.visibility_target}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onEdit(event)}
                        className="p-1.5 rounded hover:bg-[#dbeafe]/60 text-[#9ca3af] hover:text-[#3b82f6] transition-colors"
                      >
                        <PencilIcon size={13} />
                      </button>
                      <button
                        onClick={() => onDelete(event.id)}
                        className="p-1.5 rounded hover:bg-[#fee2e2]/60 text-[#9ca3af] hover:text-[#ef4444] transition-colors"
                      >
                        <Trash2Icon size={13} />
                      </button>
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
