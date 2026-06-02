'use client'

import { TYPE_COLORS } from '@/lib/eventConfig'
import { PencilIcon, Trash2Icon, EyeIcon } from 'lucide-react'

function formatDate(str) {
  return new Date(str).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
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

function StrengthBadge({ value }) {
  let bg, text
  if (!value)          { bg = '#f1f5f9'; text = '#64748b' }
  else if (value >= 70) { bg = '#fce4ed'; text = '#e879a0' }
  else if (value >= 40) { bg = '#d1fae5'; text = '#10b981' }
  else if (value >= 20) { bg = '#dbeafe'; text = '#3b82f6' }
  else                  { bg = '#f1f5f9'; text = '#64748b' }

  return (
    <span
      className="inline-block px-2 py-0.5 rounded-md text-xs font-semibold tabular-nums"
      style={{ backgroundColor: bg, color: text }}
    >
      {value ?? '—'}
    </span>
  )
}

export default function EventTable({ events, onEdit, onDelete, onView }) {
  if (events.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#f0e8ee] py-16 text-center">
        <p className="text-sm text-[#9ca3af]">No events found.</p>
        <p className="text-xs text-[#c4b5c0] mt-1">Add your first event or adjust the filters.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-[#f0e8ee] overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#f0e8ee] bg-[#fafafa]">
            {['Date', 'Title', 'Type', 'Subtype', 'Segment', 'Visibility', 'Strength', ''].map((h) => (
              <th
                key={h}
                className="text-left px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wide whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {events.map((event, i) => (
            <tr
              key={event.id}
              className={`border-b border-[#f9f0f5] transition-colors hover:bg-[#fdf7fb] cursor-pointer ${
                i === events.length - 1 ? 'border-b-0' : ''
              }`}
              onClick={() => onView(event)}
            >
              <td className="px-4 py-3 text-xs text-[#9ca3af] whitespace-nowrap">
                {formatDate(event.created_at)}
              </td>
              <td className="px-4 py-3 font-medium text-[#1a1a2e] max-w-xs">
                <span className="line-clamp-1">{event.title}</span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <TypeBadge type={event.event_type} />
              </td>
              <td className="px-4 py-3 text-xs text-[#6b7280] whitespace-nowrap">
                {event.event_subtype || '—'}
              </td>
              <td className="px-4 py-3 text-xs text-[#6b7280] whitespace-nowrap">
                {event.segment || '—'}
              </td>
              <td className="px-4 py-3 text-xs text-[#6b7280] whitespace-nowrap">
                {event.visibility_target || '—'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <StrengthBadge value={event.strength} />
              </td>
              <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onView(event)}
                    className="p-1 rounded hover:bg-[#fce4ed]/60 text-[#9ca3af] hover:text-[#e879a0] transition-colors"
                    title="View"
                  >
                    <EyeIcon size={14} />
                  </button>
                  <button
                    onClick={() => onEdit(event)}
                    className="p-1 rounded hover:bg-[#dbeafe]/60 text-[#9ca3af] hover:text-[#3b82f6] transition-colors"
                    title="Edit"
                  >
                    <PencilIcon size={14} />
                  </button>
                  <button
                    onClick={() => onDelete(event.id)}
                    className="p-1 rounded hover:bg-[#fee2e2]/60 text-[#9ca3af] hover:text-[#ef4444] transition-colors"
                    title="Delete"
                  >
                    <Trash2Icon size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
