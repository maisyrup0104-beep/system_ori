'use client'

import { useEffect, useState } from 'react'
import {
  CLIENT_TYPE_COLORS, CLIENT_STATUS_COLORS, PAYMENT_COLORS,
  TESTIMONIAL_COLORS, TESTIMONIAL_STATUSES, INTAKE_ITEMS,
} from '@/lib/clientsConfig'
import { getClientActivities, createClientActivity } from '@/services/clientActivities'
import { formatPHP } from '@/lib/currency'
import { XIcon, PencilIcon, ExternalLinkIcon, Trash2Icon } from 'lucide-react'

function DeleteConfirmModal({ client, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-[#f0e8ee] w-full max-w-sm mx-4 p-6">
        <h2 className="text-base font-semibold text-[#1a1a2e] mb-1">Delete Client?</h2>
        <p className="text-sm font-medium text-[#4b5563] mb-3">{client.business_name}</p>
        <div className="bg-[#fff5f5] rounded-lg border border-[#fecaca] px-3 py-2.5 mb-4 space-y-0.5">
          <p className="text-xs font-medium text-[#ef4444]">This will permanently remove:</p>
          {['Client Record', 'Production Record', 'Revenue Contribution', 'Timeline History'].map((item) => (
            <p key={item} className="text-xs text-[#ef4444]">— {item}</p>
          ))}
          <p className="text-xs text-[#ef4444] font-semibold mt-1">This cannot be undone.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 h-9 text-sm text-[#6b7280] border border-[#f0e8ee] rounded-lg hover:bg-[#f9f0f5] transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 h-9 text-sm font-semibold text-white bg-[#ef4444] rounded-lg hover:bg-[#dc2626] transition-colors">
            Delete Client
          </button>
        </div>
      </div>
    </div>
  )
}

function formatDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}
function formatDateTime(str) {
  return new Date(str).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function Badge({ value, colors, fallback = '#f1f5f9' }) {
  if (!value) return null
  const c = colors[value] || { bg: fallback, text: '#64748b' }
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: c.bg, color: c.text }}>
      {value}
    </span>
  )
}

function AssetLink({ href, label }) {
  if (!href) return null
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-[#3b82f6] hover:underline">
      <ExternalLinkIcon size={11} />
      {label}
    </a>
  )
}

function activityIcon(type) {
  const icons = { stage_change: '→', delivery: '📦', review: '👁', feedback: '💬', request: '📋', note: '📝' }
  return icons[type] || '📝'
}
function activityColor(type) {
  const map = {
    stage_change: { bg: '#dbeafe', text: '#3b82f6' },
    delivery:     { bg: '#dcfce7', text: '#16a34a' },
    review:       { bg: '#fce4ed', text: '#e879a0' },
    feedback:     { bg: '#fef3c7', text: '#d97706' },
    request:      { bg: '#ede9fe', text: '#8b5cf6' },
    note:         { bg: '#fdf7fb', text: '#e879a0' },
  }
  return map[type] || map.note
}

const sel = 'w-full h-8 px-2 text-sm border border-[#f0e8ee] rounded-lg bg-white text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-[#f9a8c3]'

export default function ClientProfile({
  open, client, onClose, onEdit, onDelete,
  onChecklistChange, onTestimonialChange,
}) {
  const [activities,    setActivities]    = useState([])
  const [loadingActs,   setLoadingActs]   = useState(false)
  const [note,          setNote]          = useState('')
  const [addingNote,    setAddingNote]    = useState(false)
  const [testimSaving,  setTestimSaving]  = useState(false)
  const [showDelete,    setShowDelete]    = useState(false)

  const isPaid = !client || client.client_type === 'Paid Client'

  useEffect(() => {
    if (open && client?.id) {
      loadActivities(client.id)
      setNote('')
    }
  }, [open, client?.id])

  async function loadActivities(id) {
    setLoadingActs(true)
    try { setActivities((await getClientActivities(id)) || []) }
    catch { /* silent */ }
    finally { setLoadingActs(false) }
  }

  async function handleAddNote() {
    if (!note.trim()) return
    setAddingNote(true)
    try {
      await createClientActivity(client.id, 'note', note.trim())
      setNote('')
      await loadActivities(client.id)
    } finally { setAddingNote(false) }
  }

  async function handleTestimonialChange(e) {
    setTestimSaving(true)
    try {
      await onTestimonialChange(client.id, e.target.value)
      await createClientActivity(client.id, 'request', `Testimonial status: ${e.target.value}`)
      await loadActivities(client.id)
    } finally { setTestimSaving(false) }
  }

  const checklist = client?.asset_checklist || {}

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/10" onClick={onClose} />}

      <div className={`fixed inset-y-0 right-0 z-50 w-[480px] bg-white shadow-2xl border-l border-[#f0e8ee] flex flex-col transform transition-transform duration-300 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0e8ee] flex-shrink-0">
          <p className="text-sm font-semibold text-[#1a1a2e]">Client Profile</p>
          <div className="flex items-center gap-1">
            {client && (
              <>
                <button onClick={() => onEdit(client)} className="p-1.5 rounded-lg hover:bg-[#dbeafe]/60 text-[#9ca3af] hover:text-[#3b82f6] transition-colors" title="Edit">
                  <PencilIcon size={14} />
                </button>
                <button onClick={() => setShowDelete(true)} className="p-1.5 rounded-lg hover:bg-[#fee2e2]/60 text-[#9ca3af] hover:text-[#ef4444] transition-colors" title="Delete">
                  <Trash2Icon size={14} />
                </button>
              </>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#9ca3af]"><XIcon size={16} /></button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {client && (
            <>
              {/* Identity */}
              <div className="px-5 py-4 border-b border-[#f0e8ee]">
                <div className="flex flex-wrap gap-1 mb-2">
                  <Badge value={client.client_type} colors={CLIENT_TYPE_COLORS} />
                  <Badge value={client.client_status} colors={CLIENT_STATUS_COLORS} />
                </div>
                <p className="text-xl font-semibold text-[#1a1a2e]">{client.business_name}</p>
                {client.segment    && <p className="text-xs text-[#9ca3af] mt-0.5">{client.segment}</p>}
                {client.package_name && <p className="text-xs text-[#6b7280] mt-0.5">{client.package_name}</p>}
              </div>

              {/* Revenue — Paid Clients only */}
              {isPaid ? (
                <div className="px-5 py-4 border-b border-[#f0e8ee]">
                  <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide mb-3">Revenue</p>
                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <div>
                      <p className="text-[10px] text-[#c4b5c0]">Quoted</p>
                      <p className="text-sm text-[#9ca3af]">{client.price != null ? formatPHP(client.price) : '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#c4b5c0]">Actual Revenue</p>
                      <p className="text-base font-semibold text-[#16a34a]">{formatPHP(client.actual_revenue)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge value={client.payment_status || 'Unpaid'} colors={PAYMENT_COLORS} />
                    {client.revenue_notes && <p className="text-xs text-[#9ca3af] italic">{client.revenue_notes}</p>}
                  </div>
                </div>
              ) : (
                <div className="px-5 py-4 border-b border-[#f0e8ee]">
                  <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide mb-2">Revenue</p>
                  <div className="flex items-center gap-2">
                    <Badge value={client.client_type} colors={CLIENT_TYPE_COLORS} />
                    <p className="text-xs text-[#c4b5c0]">Revenue not tracked for this client type.</p>
                  </div>
                </div>
              )}

              {/* Delivery */}
              <div className="px-5 py-4 border-b border-[#f0e8ee]">
                <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide mb-3">Delivery</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-[10px] text-[#c4b5c0]">Start</p>
                    <p className="text-xs text-[#1a1a2e]">{formatDate(client.start_date)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#c4b5c0]">Target</p>
                    <p className="text-xs text-[#1a1a2e]">{formatDate(client.delivery_date)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#c4b5c0]">Delivered</p>
                    <p className="text-xs text-[#1a1a2e]">{formatDate(client.delivered_date)}</p>
                  </div>
                </div>
              </div>

              {/* Asset links */}
              {(client.drive_link || client.photos_link || client.videos_link || client.brand_ref_link) && (
                <div className="px-5 py-4 border-b border-[#f0e8ee]">
                  <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide mb-3">Assets</p>
                  <div className="space-y-1.5">
                    <AssetLink href={client.drive_link}     label="Google Drive" />
                    <AssetLink href={client.photos_link}    label="Photos" />
                    <AssetLink href={client.videos_link}    label="Videos" />
                    <AssetLink href={client.brand_ref_link} label="Brand References" />
                  </div>
                </div>
              )}

              {/* Intake checklist */}
              <div className="px-5 py-4 border-b border-[#f0e8ee]">
                <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide mb-3">Client Intake</p>
                <div className="space-y-2">
                  {INTAKE_ITEMS.map((item) => {
                    const checked = !!checklist[item.key]
                    return (
                      <label key={item.key} className="flex items-center gap-2.5 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => onChecklistChange(client.id, item.key, e.target.checked)}
                          className="w-4 h-4 rounded border-[#f0e8ee] accent-[#e879a0]"
                        />
                        <span className={`text-sm transition-colors ${checked ? 'text-[#16a34a] line-through' : 'text-[#4b5563]'}`}>
                          {item.label}
                        </span>
                        {checked && <span className="text-[10px] text-[#16a34a]">✓ Received</span>}
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Testimonial */}
              <div className="px-5 py-4 border-b border-[#f0e8ee]">
                <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide mb-3">Testimonial</p>
                <div className="flex items-center gap-3">
                  <Badge value={client.testimonial_status || 'Not Requested'} colors={TESTIMONIAL_COLORS} />
                  <select
                    value={client.testimonial_status || 'Not Requested'}
                    onChange={handleTestimonialChange}
                    disabled={testimSaving}
                    className={`${sel} flex-1`}
                  >
                    {TESTIMONIAL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                {client.client_status === 'Delivered' && client.testimonial_status === 'Not Requested' && (
                  <div className="mt-2 bg-[#fef3c7] rounded-lg px-3 py-2 border border-[#fde68a]">
                    <p className="text-xs text-[#d97706] font-medium">★ Project delivered — time to request a testimonial</p>
                  </div>
                )}
              </div>

              {/* Notes */}
              {client.notes && (
                <div className="px-5 py-4 border-b border-[#f0e8ee]">
                  <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide mb-2">Notes</p>
                  <p className="text-sm text-[#374151] whitespace-pre-wrap">{client.notes}</p>
                </div>
              )}

              {/* Timeline */}
              <div className="px-5 py-4">
                <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide mb-3">Timeline</p>
                <div className="mb-4">
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add a note, delivery update, feedback..."
                    rows={2}
                    className="w-full text-sm border border-[#f0e8ee] rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#f9a8c3] placeholder:text-[#c4b5c0]"
                  />
                  <div className="flex justify-end mt-1.5">
                    <button
                      onClick={handleAddNote}
                      disabled={!note.trim() || addingNote}
                      className="h-7 px-3 text-xs font-medium bg-[#e879a0] text-white rounded-lg hover:bg-[#d4648a] disabled:opacity-40 transition-colors"
                    >
                      {addingNote ? 'Adding...' : 'Add Note'}
                    </button>
                  </div>
                </div>
                {loadingActs ? (
                  <p className="text-xs text-[#9ca3af]">Loading...</p>
                ) : activities.length === 0 ? (
                  <p className="text-xs text-[#c4b5c0]">No activity yet.</p>
                ) : (
                  <div className="space-y-2">
                    {activities.map((act) => {
                      const c = activityColor(act.type)
                      return (
                        <div key={act.id} className="flex gap-2.5">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px]" style={{ backgroundColor: c.bg, color: c.text }}>
                            {activityIcon(act.type)}
                          </div>
                          <div>
                            <p className="text-xs text-[#374151] leading-relaxed">{act.content}</p>
                            <p className="text-[10px] text-[#c4b5c0] mt-0.5">{formatDateTime(act.created_at)}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {showDelete && client && (
        <DeleteConfirmModal
          client={client}
          onConfirm={() => { setShowDelete(false); onClose(); onDelete(client.id) }}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </>
  )
}
