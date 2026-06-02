'use client'

import { useEffect, useState } from 'react'
import { TYPE_COLORS, VISIBILITY_COLORS, VISIBILITY_TARGETS } from '@/lib/eventConfig'
import { XIcon, PencilIcon, ExternalLinkIcon } from 'lucide-react'

function formatDate(str) {
  return new Date(str).toLocaleDateString('en-PH', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

function formatTime(str) {
  return new Date(str).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
}

function VisibilityBadge({ value }) {
  if (!value) return <span className="text-sm text-[#c4b5c0]">—</span>
  const colors = VISIBILITY_COLORS[value] || { bg: '#f1f5f9', text: '#64748b' }
  return (
    <span
      className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {value}
    </span>
  )
}

function Row({ label, value }) {
  if (!value) return null
  return (
    <div className="space-y-0.5">
      <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide">{label}</p>
      <p className="text-sm text-[#1a1a2e]">{value}</p>
    </div>
  )
}

const sel = 'flex-1 h-8 px-2 text-sm border border-[#f0e8ee] rounded-lg bg-white text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-[#f9a8c3]'

export default function EventDrawer({ open, event, onClose, onEdit, onVisibilityOverride }) {
  const [overrideOpen, setOverrideOpen]   = useState(false)
  const [overrideValue, setOverrideValue] = useState('')
  const [overrideSaving, setOverrideSaving] = useState(false)

  useEffect(() => {
    setOverrideOpen(false)
    setOverrideValue(event?.visibility_target || '')
  }, [event?.id])

  async function handleOverrideSave() {
    setOverrideSaving(true)
    try {
      await onVisibilityOverride(event.id, overrideValue)
      setOverrideOpen(false)
    } finally {
      setOverrideSaving(false)
    }
  }

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/10" onClick={onClose} />
      )}

      <div
        className={`fixed inset-y-0 right-0 z-50 w-96 bg-white shadow-2xl border-l border-[#f0e8ee] flex flex-col transform transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0e8ee] flex-shrink-0">
          <p className="text-sm font-semibold text-[#1a1a2e]">Event Detail</p>
          <div className="flex items-center gap-1">
            {event && (
              <button
                onClick={() => onEdit(event)}
                className="p-1.5 rounded-lg hover:bg-[#dbeafe]/60 text-[#9ca3af] hover:text-[#3b82f6] transition-colors"
                title="Edit"
              >
                <PencilIcon size={14} />
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#9ca3af] transition-colors">
              <XIcon size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {event && (
            <>
              {/* Type badge + title */}
              <div>
                {event.event_type && (() => {
                  const colors = TYPE_COLORS[event.event_type] || { bg: '#f1f5f9', text: '#64748b' }
                  return (
                    <span
                      className="inline-block px-2 py-0.5 rounded-md text-xs font-medium mb-2"
                      style={{ backgroundColor: colors.bg, color: colors.text }}
                    >
                      {event.event_type}
                    </span>
                  )
                })()}
                <p className="text-lg font-semibold text-[#1a1a2e] leading-snug">{event.title}</p>
              </div>

              {/* Date */}
              <div className="space-y-0.5">
                <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide">Date</p>
                <p className="text-sm text-[#1a1a2e]">{formatDate(event.created_at)}</p>
                <p className="text-xs text-[#c4b5c0]">{formatTime(event.created_at)}</p>
              </div>

              {/* Metadata grid */}
              <div className="grid grid-cols-2 gap-4">
                <Row label="Subtype" value={event.event_subtype} />
                <Row label="Segment" value={event.segment} />
                {event.strength != null && (
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide">Strength</p>
                    <p className="text-sm font-semibold text-[#e879a0]">{event.strength}</p>
                  </div>
                )}
              </div>

              {/* Auto Visibility + override */}
              <div className="space-y-2 pt-1 pb-1 border-t border-[#f0e8ee]">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide">Auto Visibility</p>
                  {!overrideOpen && (
                    <button
                      onClick={() => { setOverrideValue(event.visibility_target || ''); setOverrideOpen(true) }}
                      className="text-[11px] text-[#9ca3af] hover:text-[#6b7280] underline underline-offset-2 transition-colors"
                    >
                      Override
                    </button>
                  )}
                </div>

                {!overrideOpen ? (
                  <VisibilityBadge value={event.visibility_target} />
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <select
                        value={overrideValue}
                        onChange={(e) => setOverrideValue(e.target.value)}
                        className={sel}
                      >
                        {VISIBILITY_TARGETS.map((v) => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleOverrideSave}
                        disabled={overrideSaving}
                        className="h-7 px-3 text-xs font-medium bg-[#e879a0] text-white rounded-lg hover:bg-[#d4648a] disabled:opacity-50 transition-colors"
                      >
                        {overrideSaving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => setOverrideOpen(false)}
                        className="h-7 px-3 text-xs text-[#9ca3af] border border-[#f0e8ee] rounded-lg hover:bg-[#f9f0f5] transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              {event.notes && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide">Notes</p>
                  <div className="bg-[#fdf7fb] rounded-xl border border-[#f0e8ee] p-3">
                    <p className="text-sm text-[#374151] whitespace-pre-wrap leading-relaxed">{event.notes}</p>
                  </div>
                </div>
              )}

              {/* Proof URL */}
              {event.proof_url && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide">Proof URL</p>
                  <a
                    href={event.proof_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-[#3b82f6] hover:underline"
                  >
                    <ExternalLinkIcon size={13} />
                    View proof
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
