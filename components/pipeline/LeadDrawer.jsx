'use client'

import { useEffect, useState } from 'react'
import { STAGES, STAGE_COLORS, computePriority, PRIORITY_COLORS } from '@/lib/pipelineConfig'
import { getLeadActivities, createLeadActivity } from '@/services/leadActivities'
import { XIcon, PencilIcon, ExternalLinkIcon, LinkIcon, GlobeIcon, PhoneIcon, Trash2Icon } from 'lucide-react'

function formatDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatDateTime(str) {
  return new Date(str).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function activityIcon(type) {
  if (type === 'stage_change') return '→'
  if (type === 'followup')     return '📅'
  return '📝'
}

function activityColor(type) {
  if (type === 'stage_change') return { bg: '#dbeafe', text: '#3b82f6' }
  if (type === 'followup')     return { bg: '#dcfce7', text: '#16a34a' }
  return { bg: '#fdf7fb', text: '#e879a0' }
}

const sel = 'w-full h-8 px-2 text-sm border border-[#f0e8ee] rounded-lg bg-white text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-[#f9a8c3]'

export default function LeadDrawer({
  open, lead, onClose, onEdit, onDelete,
  onStageChange, onFollowUpSet,
}) {
  const [activities, setActivities] = useState([])
  const [loadingActs, setLoadingActs] = useState(false)
  const [note, setNote]             = useState('')
  const [addingNote, setAddingNote] = useState(false)
  const [followUpDate, setFollowUpDate] = useState('')
  const [savingFollowUp, setSavingFollowUp] = useState(false)
  const [showFollowUpInput, setShowFollowUpInput] = useState(false)

  useEffect(() => {
    if (open && lead?.id) {
      loadActivities(lead.id)
      setFollowUpDate(lead.next_followup_date || '')
      setNote('')
      setAddingNote(false)
      setShowFollowUpInput(false)
    }
  }, [open, lead?.id])

  async function loadActivities(leadId) {
    setLoadingActs(true)
    try {
      const data = await getLeadActivities(leadId)
      setActivities(data || [])
    } catch { /* silent */ }
    finally { setLoadingActs(false) }
  }

  async function handleAddNote() {
    if (!note.trim()) return
    setAddingNote(true)
    try {
      await createLeadActivity(lead.id, 'note', note.trim())
      setNote('')
      await loadActivities(lead.id)
    } finally { setAddingNote(false) }
  }

  async function handleSaveFollowUp() {
    setSavingFollowUp(true)
    try {
      await onFollowUpSet(lead.id, followUpDate)
      await createLeadActivity(lead.id, 'followup', `Follow-up scheduled: ${followUpDate}`)
      await loadActivities(lead.id)
      setShowFollowUpInput(false)
    } finally { setSavingFollowUp(false) }
  }

  async function handleStageSelect(e) {
    const newStage = e.target.value
    await onStageChange(lead.id, newStage, lead.stage)
    await loadActivities(lead.id)
  }

  if (!lead && !open) return null

  const priority = lead ? computePriority(lead.stage) : null
  const pColors  = priority ? PRIORITY_COLORS[priority] : null

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/10" onClick={onClose} />}

      <div className={`fixed inset-y-0 right-0 z-50 w-[420px] bg-white shadow-2xl border-l border-[#f0e8ee] flex flex-col transform transition-transform duration-300 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0e8ee] flex-shrink-0">
          <p className="text-sm font-semibold text-[#1a1a2e]">Lead Profile</p>
          <div className="flex items-center gap-1">
            {lead && (
              <>
                <button onClick={() => onEdit(lead)} className="p-1.5 rounded-lg hover:bg-[#dbeafe]/60 text-[#9ca3af] hover:text-[#3b82f6] transition-colors" title="Edit">
                  <PencilIcon size={14} />
                </button>
                <button onClick={() => onDelete(lead)} className="p-1.5 rounded-lg hover:bg-[#fee2e2]/60 text-[#9ca3af] hover:text-[#ef4444] transition-colors" title="Delete lead">
                  <Trash2Icon size={14} />
                </button>
              </>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#9ca3af] transition-colors">
              <XIcon size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {lead && (
            <>
              {/* Identity */}
              <div className="px-5 py-4 border-b border-[#f0e8ee]">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-lg font-semibold text-[#1a1a2e] leading-snug">{lead.business_name}</p>
                  {pColors && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: pColors.bg, color: pColors.text }}>
                      {priority}
                    </span>
                  )}
                </div>
                {lead.segment && <p className="text-xs text-[#9ca3af]">{lead.segment}</p>}
                {lead.contact_name && <p className="text-xs text-[#6b7280] mt-1">{lead.contact_name}</p>}
              </div>

              {/* Stage */}
              <div className="px-5 py-4 border-b border-[#f0e8ee]">
                <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide mb-2">Stage</p>
                <select value={lead.stage || 'Prospect'} onChange={handleStageSelect} className={sel}>
                  {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Contact details */}
              {(lead.facebook_link || lead.instagram_link || lead.website || lead.phone) && (
                <div className="px-5 py-4 border-b border-[#f0e8ee] space-y-2">
                  <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide">Contact</p>
                  {lead.phone && (
                    <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-sm text-[#4b5563] hover:text-[#e879a0]">
                      <PhoneIcon size={13} className="text-[#9ca3af]" />
                      {lead.phone}
                    </a>
                  )}
                  {lead.facebook_link && (
                    <a href={lead.facebook_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[#3b82f6] hover:underline">
                      <LinkIcon size={13} />
                      Facebook
                    </a>
                  )}
                  {lead.instagram_link && (
                    <a href={lead.instagram_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[#e879a0] hover:underline">
                      <LinkIcon size={13} />
                      Instagram
                    </a>
                  )}
                  {lead.website && (
                    <a href={lead.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[#3b82f6] hover:underline">
                      <GlobeIcon size={13} />
                      Website
                    </a>
                  )}
                </div>
              )}

              {/* Dates */}
              <div className="px-5 py-4 border-b border-[#f0e8ee]">
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide mb-0.5">Last Contact</p>
                    <p className="text-sm text-[#1a1a2e]">{formatDate(lead.last_contact_date)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide mb-0.5">Next Follow-Up</p>
                    <p className="text-sm text-[#1a1a2e]">{formatDate(lead.next_followup_date)}</p>
                  </div>
                </div>

                {/* Schedule follow-up */}
                {!showFollowUpInput ? (
                  <button
                    onClick={() => setShowFollowUpInput(true)}
                    className="text-xs text-[#9ca3af] hover:text-[#e879a0] underline underline-offset-2 transition-colors"
                  >
                    Set follow-up date
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="h-8 px-2 text-sm border border-[#f0e8ee] rounded-lg bg-white flex-1 focus:outline-none focus:ring-2 focus:ring-[#f9a8c3]"
                    />
                    <button
                      onClick={handleSaveFollowUp}
                      disabled={savingFollowUp}
                      className="h-7 px-3 text-xs font-medium bg-[#e879a0] text-white rounded-lg hover:bg-[#d4648a] disabled:opacity-50"
                    >
                      {savingFollowUp ? '...' : 'Save'}
                    </button>
                    <button onClick={() => setShowFollowUpInput(false)} className="h-7 px-2 text-xs text-[#9ca3af] border border-[#f0e8ee] rounded-lg hover:bg-[#f9f0f5]">
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Notes */}
              {lead.notes && (
                <div className="px-5 py-4 border-b border-[#f0e8ee]">
                  <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide mb-1.5">Notes</p>
                  <p className="text-sm text-[#374151] whitespace-pre-wrap">{lead.notes}</p>
                </div>
              )}

              {/* Activity timeline */}
              <div className="px-5 py-4">
                <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide mb-3">Activity Timeline</p>

                {/* Add note */}
                <div className="mb-4">
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add a note, observation, or interaction..."
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

                {/* Timeline entries */}
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
                          <div
                            className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px]"
                            style={{ backgroundColor: c.bg, color: c.text }}
                          >
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
    </>
  )
}
