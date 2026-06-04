'use client'

import { useEffect, useMemo, useState } from 'react'
import PageContainer from '@/components/shared/PageContainer'
import LoadingState from '@/components/shared/LoadingState'
import {
  getQueue, createQueueItem, updateQueueItem,
  updateQueueStatus, deleteFromQueue,
} from '@/services/contentOpportunities'
import { PILLARS, NARRATIVE_STACKS, STORY_TEMPLATES } from '@/lib/opportunityEngine'
import { PlusIcon, PencilIcon, TrashIcon, XIcon, ChevronRightIcon, ArchiveIcon, RotateCcwIcon } from 'lucide-react'

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUSES = ['Queued', 'Drafting', 'Ready To Record', 'Recorded', 'Ready To Post', 'Posted', 'Archived']
const HISTORY_STATUSES  = ['Posted', 'Archived']
const PRIORITY_OPTIONS  = ['High', 'Medium', 'Low']
const PLATFORM_OPTIONS  = ['Personal', 'Ori', 'Both']
const SOURCE_TYPES      = ['Event', 'PMF', 'State', 'Concept Feature', 'Hybrid', 'Manual']

const STATUS_COLORS = {
  'Queued':          { bg: '#f3f4f6', text: '#6b7280' },
  'Drafting':        { bg: '#fce4ed', text: '#e879a0' },
  'Ready To Record': { bg: '#ede9fe', text: '#7c3aed' },
  'Recorded':        { bg: '#dbeafe', text: '#1d4ed8' },
  'Ready To Post':   { bg: '#dcfce7', text: '#16a34a' },
  'Posted':          { bg: '#bbf7d0', text: '#15803d' },
  'Archived':        { bg: '#e5e7eb', text: '#9ca3af' },
}

const PRIORITY_COLORS = {
  High:   { bg: '#dcfce7', text: '#16a34a' },
  Medium: { bg: '#fce4ed', text: '#e879a0' },
  Low:    { bg: '#f3f4f6', text: '#6b7280' },
}

const PLATFORM_COLORS = {
  Personal: { bg: '#fdf2f6', text: '#e879a0' },
  Ori:      { bg: '#dbeafe', text: '#1d4ed8' },
  Both:     { bg: '#f3f4f6', text: '#374151' },
}

const ALL_TEMPLATES = Object.values(STORY_TEMPLATES)

function fmtDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Shared badge components ───────────────────────────────────────────────────

function Chip({ value, map, className = '' }) {
  const s = (map || {})[value] || { bg: '#f3f4f6', text: '#6b7280' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${className}`}
      style={{ backgroundColor: s.bg, color: s.text }}>
      {value}
    </span>
  )
}

function Pills({ items, color = '#fdf2f6', textColor = '#e879a0' }) {
  if (!items?.length) return <span className="text-xs text-[#c4b5c0]">—</span>
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item, i) => (
        <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px]"
          style={{ backgroundColor: color, color: textColor }}>
          {item}
        </span>
      ))}
    </div>
  )
}

const inputCls    = 'w-full border border-[#f0e8ee] rounded-lg px-3 py-2 text-sm text-[#1a1a2e] bg-[#fdf9fb] focus:outline-none focus:ring-2 focus:ring-[#f9a8c3] placeholder-[#c4b5c0]'
const textareaCls = inputCls + ' resize-none'

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#6b7280] mb-1">{label}</label>
      {children}
    </div>
  )
}

// ── Analytics Section ─────────────────────────────────────────────────────────

function AnalyticsSection({ items }) {
  const statusCounts = Object.fromEntries(STATUSES.map(s => [s, 0]))
  for (const item of items) {
    if (statusCounts[item.status] != null) statusCounts[item.status]++
  }

  const pillarCount = {}, narrativeCount = {}, featureCount = {}, eventCount = {}
  for (const item of items) {
    if (item.primary_pillar) pillarCount[item.primary_pillar] = (pillarCount[item.primary_pillar] || 0) + 1
    if (item.narrative_stack) narrativeCount[item.narrative_stack] = (narrativeCount[item.narrative_stack] || 0) + 1
    for (const f of item.source_concept_features || []) featureCount[f] = (featureCount[f] || 0) + 1
    for (const e of item.source_events || []) eventCount[e] = (eventCount[e] || 0) + 1
  }

  const top = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1])[0]
  const topPillar     = top(pillarCount)
  const topNarrative  = top(narrativeCount)
  const topFeature    = top(featureCount)
  const topEvent      = top(eventCount)

  return (
    <div className="mb-6 space-y-3">
      {/* Status counts */}
      <div className="grid grid-cols-7 gap-2">
        {STATUSES.map(s => {
          const style = STATUS_COLORS[s]
          return (
            <div key={s} className="bg-white rounded-xl border border-[#f0e8ee] p-3 text-center">
              <p className="text-xl font-semibold text-[#1a1a2e]">{statusCounts[s]}</p>
              <p className="text-[10px] mt-0.5 font-medium truncate" style={{ color: style.text }}>{s}</p>
            </div>
          )
        })}
      </div>

      {/* Source analytics */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Most Used Pillar',    val: topPillar },
          { label: 'Most Used Narrative', val: topNarrative },
          { label: 'Most Used Concept',   val: topFeature },
          { label: 'Most Used Event',     val: topEvent },
        ].map(({ label, val }) => (
          <div key={label} className="bg-white rounded-xl border border-[#f0e8ee] p-3">
            <p className="text-[11px] text-[#9ca3af] mb-1">{label}</p>
            {val ? (
              <p className="text-sm font-medium text-[#1a1a2e] truncate">
                {val[0]} <span className="text-[11px] text-[#9ca3af] font-normal">×{val[1]}</span>
              </p>
            ) : (
              <p className="text-sm text-[#c4b5c0]">—</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Filters bar ───────────────────────────────────────────────────────────────

const selCls = 'h-8 px-2.5 text-xs border border-[#f0e8ee] rounded-lg bg-white text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-[#f9a8c3]'

function FiltersBar({ filters, onChange, onClear }) {
  const pillars = PILLARS
  return (
    <div className="flex items-center gap-2 mb-4 flex-wrap">
      <input
        type="text"
        value={filters.search}
        onChange={e => onChange({ ...filters, search: e.target.value })}
        placeholder="Search title, pillar, concept…"
        className="h-8 px-3 text-xs border border-[#f0e8ee] rounded-lg bg-white text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-[#f9a8c3] w-52"
      />
      <select className={selCls} value={filters.platform} onChange={e => onChange({ ...filters, platform: e.target.value })}>
        <option value="">All Platforms</option>
        {PLATFORM_OPTIONS.map(p => <option key={p}>{p}</option>)}
      </select>
      <select className={selCls} value={filters.priority} onChange={e => onChange({ ...filters, priority: e.target.value })}>
        <option value="">All Priorities</option>
        {PRIORITY_OPTIONS.map(p => <option key={p}>{p}</option>)}
      </select>
      <select className={selCls} value={filters.status} onChange={e => onChange({ ...filters, status: e.target.value })}>
        <option value="">All Statuses</option>
        {STATUSES.map(s => <option key={s}>{s}</option>)}
      </select>
      <select className={selCls} value={filters.pillar} onChange={e => onChange({ ...filters, pillar: e.target.value })}>
        <option value="">All Pillars</option>
        {pillars.map(p => <option key={p}>{p}</option>)}
      </select>
      <select className={selCls} value={filters.sourceType} onChange={e => onChange({ ...filters, sourceType: e.target.value })}>
        <option value="">All Sources</option>
        {SOURCE_TYPES.map(s => <option key={s}>{s}</option>)}
      </select>
      {Object.values(filters).some(Boolean) && (
        <button onClick={onClear} className="text-xs text-[#9ca3af] hover:text-[#e879a0] transition-colors">
          Clear filters
        </button>
      )}
    </div>
  )
}

// ── Queue Table ───────────────────────────────────────────────────────────────

const thCls = 'px-3 py-2.5 text-left text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide'
const tdCls = 'px-3 py-3 text-sm text-[#1a1a2e]'

function QueueTable({ items, onOpenPanel, onStatusChange, onDelete, updatingId }) {
  return (
    <div className="bg-white rounded-xl border border-[#f0e8ee] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#fdf9fb] border-b border-[#f0e8ee]">
            <tr>
              <th className={thCls}>Priority</th>
              <th className={thCls}>Platform</th>
              <th className={thCls}>Primary Pillar</th>
              <th className={thCls}>Narrative Stack</th>
              <th className={thCls}>Source</th>
              <th className={thCls}>Status</th>
              <th className={thCls}>Created</th>
              <th className={thCls}></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0e8ee]">
            {items.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-[#c4b5c0]">
                  No items in queue.
                </td>
              </tr>
            )}
            {items.map(item => (
              <tr
                key={item.id}
                className="hover:bg-[#fdf9fb] transition-colors cursor-pointer"
                onClick={() => onOpenPanel(item)}
              >
                <td className={tdCls}>
                  <Chip value={item.priority} map={PRIORITY_COLORS} />
                </td>
                <td className={tdCls}>
                  <Chip value={item.platform} map={PLATFORM_COLORS} />
                </td>
                <td className={tdCls}>
                  <div>
                    {item.title && <p className="text-[11px] text-[#9ca3af] leading-none mb-0.5">{item.title}</p>}
                    <p className="font-medium">{item.primary_pillar}</p>
                  </div>
                </td>
                <td className={tdCls + ' text-[#6b7280]'}>{item.narrative_stack || '—'}</td>
                <td className={tdCls}>
                  {item.source_type
                    ? <Chip value={item.source_type} map={{}} />
                    : <span className="text-[#c4b5c0]">—</span>}
                </td>
                <td className={tdCls} onClick={e => e.stopPropagation()}>
                  <select
                    value={item.status}
                    disabled={updatingId === item.id}
                    onChange={e => onStatusChange(item.id, e.target.value)}
                    className="text-[11px] font-medium border-0 rounded-full px-2 py-0.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#f9a8c3]"
                    style={{
                      backgroundColor: STATUS_COLORS[item.status]?.bg || '#f3f4f6',
                      color: STATUS_COLORS[item.status]?.text || '#6b7280',
                    }}
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className={tdCls + ' text-[#9ca3af] text-xs whitespace-nowrap'}>{fmtDate(item.created_at)}</td>
                <td className={tdCls} onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="p-1.5 rounded-lg text-[#9ca3af] hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <TrashIcon size={13} />
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

// ── Detail Panel ──────────────────────────────────────────────────────────────

function DetailPanel({ item, onClose, onStatusChange, onSaveNotes, onDelete, onArchive, onRestore, updatingId }) {
  const [notesDraft, setNotesDraft] = useState(item?.notes || '')
  const [notesChanged, setNotesChanged] = useState(false)
  const [savingNotes, setSavingNotes] = useState(false)

  // Reset notes when item changes
  useEffect(() => {
    setNotesDraft(item?.notes || '')
    setNotesChanged(false)
  }, [item?.id])

  if (!item) return null

  async function handleSaveNotes() {
    setSavingNotes(true)
    try {
      await onSaveNotes(item.id, notesDraft)
      setNotesChanged(false)
    } finally {
      setSavingNotes(false)
    }
  }

  const template = item.story_template_name
    ? { name: item.story_template_name, steps: item.story_template_steps || [] }
    : null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/10 z-30" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-[400px] bg-white border-l border-[#f0e8ee] z-40 flex flex-col shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-[#f0e8ee] shrink-0">
          <div className="flex-1 min-w-0 pr-3">
            <p className="text-[11px] text-[#9ca3af] mb-0.5">{item.title || 'Queue Item'}</p>
            <p className="text-base font-semibold text-[#1a1a2e] leading-tight">{item.primary_pillar}</p>
            <p className="text-sm text-[#e879a0] mt-0.5">{item.narrative_stack}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#9ca3af] hover:text-[#1a1a2e] hover:bg-[#fdf2f6] transition-colors shrink-0">
            <XIcon size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Badges row */}
          <div className="flex flex-wrap gap-2">
            <Chip value={item.platform} map={PLATFORM_COLORS} />
            <Chip value={item.priority} map={PRIORITY_COLORS} />
            {item.source_type && <Chip value={item.source_type} map={{}} />}
          </div>

          {/* Status workflow */}
          <div>
            <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide mb-2">Status</p>
            <div className="flex flex-wrap gap-1">
              {STATUSES.map(s => {
                const isCurrent = item.status === s
                const style = STATUS_COLORS[s]
                return (
                  <button
                    key={s}
                    disabled={updatingId === item.id}
                    onClick={() => onStatusChange(item.id, s)}
                    className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors border"
                    style={isCurrent
                      ? { backgroundColor: style.bg, color: style.text, borderColor: style.text + '55' }
                      : { backgroundColor: 'white', color: '#9ca3af', borderColor: '#f0e8ee' }
                    }
                  >
                    {s}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Supporting Moments */}
          <div>
            <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide mb-1.5">Supporting Moments</p>
            <Pills items={item.supporting_moments} color="#fdf2f6" textColor="#6b5b6e" />
          </div>

          {/* Story Template */}
          {template && (
            <div>
              <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide mb-1.5">
                Whole-Day Story · <span className="normal-case font-normal">{template.name}</span>
              </p>
              <div className="flex items-center gap-1 flex-wrap">
                {template.steps.map((step, i) => (
                  <span key={step} className="flex items-center gap-1">
                    <span className="text-xs font-medium text-[#1a1a2e] bg-[#f9f5fb] border border-[#f0e8ee] px-2 py-0.5 rounded-md">
                      {step}
                    </span>
                    {i < template.steps.length - 1 && <ChevronRightIcon size={11} className="text-[#d1c4cb] shrink-0" />}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Source Events */}
          {item.source_events?.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide mb-1.5">Source Events</p>
              <Pills items={item.source_events} color="#fef9c3" textColor="#ca8a04" />
            </div>
          )}

          {/* Source PMF Assets */}
          {item.source_pmf_assets?.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide mb-1.5">Source PMF Assets</p>
              <Pills items={item.source_pmf_assets} color="#dcfce7" textColor="#16a34a" />
            </div>
          )}

          {/* Source Concept Features */}
          {item.source_concept_features?.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide mb-1.5">Source Concept Features</p>
              <Pills items={item.source_concept_features} color="#fce4ed" textColor="#e879a0" />
            </div>
          )}

          {/* Reason */}
          {item.reason && (
            <div>
              <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide mb-1.5">Reason</p>
              <p className="text-xs text-[#6b7280] italic leading-relaxed border-l-2 border-[#f9a8c3] pl-3">{item.reason}</p>
            </div>
          )}

          {/* Posted At */}
          {item.posted_at && (
            <div>
              <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide mb-1">Posted</p>
              <p className="text-sm text-[#15803d] font-medium">{fmtDate(item.posted_at)}</p>
            </div>
          )}

          {/* Notes */}
          <div>
            <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide mb-1.5">Notes</p>
            <textarea
              className={textareaCls}
              rows={4}
              placeholder="Recording notes, ideas, reminders…"
              value={notesDraft}
              onChange={e => { setNotesDraft(e.target.value); setNotesChanged(true) }}
            />
            {notesChanged && (
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="mt-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#e879a0] text-white hover:bg-[#d4659a] transition-colors disabled:opacity-50"
              >
                {savingNotes ? 'Saving…' : 'Save Notes'}
              </button>
            )}
          </div>

          {/* Timestamps */}
          <div className="text-xs text-[#c4b5c0] space-y-0.5">
            <p>Created: {fmtDate(item.created_at)}</p>
            {item.updated_at && <p>Updated: {fmtDate(item.updated_at)}</p>}
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-5 py-4 border-t border-[#f0e8ee] flex items-center gap-2 shrink-0">
          {item.status === 'Posted' && (
            <button
              onClick={() => onArchive(item.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#f3f4f6] text-[#6b7280] hover:bg-[#e5e7eb] transition-colors"
            >
              <ArchiveIcon size={12} />
              Archive
            </button>
          )}
          {item.status === 'Archived' && (
            <button
              onClick={() => onRestore(item.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#dcfce7] text-[#15803d] hover:bg-[#bbf7d0] transition-colors"
            >
              <RotateCcwIcon size={12} />
              Restore to Posted
            </button>
          )}
          <button
            onClick={() => onDelete(item.id)}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            <TrashIcon size={12} />
            Delete
          </button>
        </div>
      </div>
    </>
  )
}

// ── Add/Edit Modal ────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  title: '', platform: 'Personal', primary_pillar: '', narrative_stack: '',
  supporting_moments: '', story_template_name: '', priority: 'Medium', notes: '',
}

function AddItemModal({ open, onClose, onSave }) {
  const [form, setForm]   = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (open) setForm(EMPTY_FORM) }, [open])

  if (!open) return null

  const narrativeOptions = NARRATIVE_STACKS[form.primary_pillar] || []

  async function handleSave() {
    if (!form.primary_pillar) return
    setSaving(true)
    try {
      const template = ALL_TEMPLATES.find(t => t.name === form.story_template_name)
      await onSave({
        ...form,
        supporting_moments:   form.supporting_moments.split(',').map(s => s.trim()).filter(Boolean),
        story_template_name:  template?.name || null,
        story_template_steps: template?.steps || [],
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl border border-[#f0e8ee] shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0e8ee]">
          <h3 className="text-sm font-semibold text-[#1a1a2e]">Add Queue Item</h3>
          <button onClick={onClose} className="text-[#9ca3af] hover:text-[#1a1a2e] transition-colors"><XIcon size={16} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <Field label="Title (optional)">
            <input className={inputCls} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Custom name for this item" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Platform">
              <select className={inputCls} value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })}>
                {PLATFORM_OPTIONS.map(p => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Priority">
              <select className={inputCls} value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                {PRIORITY_OPTIONS.map(p => <option key={p}>{p}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Primary Pillar *">
            <select className={inputCls} value={form.primary_pillar} onChange={e => setForm({ ...form, primary_pillar: e.target.value, narrative_stack: '' })}>
              <option value="">— Select Pillar —</option>
              {PILLARS.map(p => <option key={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Narrative Stack">
            <select className={inputCls} value={form.narrative_stack} onChange={e => setForm({ ...form, narrative_stack: e.target.value })} disabled={!narrativeOptions.length}>
              <option value="">— Select Narrative —</option>
              {narrativeOptions.map(n => <option key={n}>{n}</option>)}
            </select>
          </Field>
          <Field label="Supporting Moments (comma-separated)">
            <input className={inputCls} value={form.supporting_moments} onChange={e => setForm({ ...form, supporting_moments: e.target.value })} placeholder="Conversation, Insight, Reflection" />
          </Field>
          <Field label="Story Template">
            <select className={inputCls} value={form.story_template_name} onChange={e => setForm({ ...form, story_template_name: e.target.value })}>
              <option value="">— None —</option>
              {ALL_TEMPLATES.map(t => <option key={t.name} value={t.name}>{t.name}: {t.steps.join(' → ')}</option>)}
            </select>
          </Field>
          <Field label="Notes">
            <textarea className={textareaCls} rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Ideas, recording notes, reminders…" />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-[#6b7280] hover:bg-[#fdf2f6] transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.primary_pillar}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-[#e879a0] text-white hover:bg-[#d4659a] transition-colors disabled:opacity-50">
              {saving ? 'Saving…' : 'Add to Queue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const EMPTY_FILTERS = { search: '', platform: '', priority: '', status: '', pillar: '', sourceType: '' }

export default function QueuePage() {
  const [items,       setItems]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [tab,         setTab]         = useState('active')
  const [filters,     setFilters]     = useState(EMPTY_FILTERS)
  const [panelItem,   setPanelItem]   = useState(null)
  const [showModal,   setShowModal]   = useState(false)
  const [updatingId,  setUpdatingId]  = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const data = await getQueue()
      setItems(data || [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  // ── Filtered items ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let base = tab === 'history'
      ? items.filter(i => HISTORY_STATUSES.includes(i.status))
      : items.filter(i => i.status !== 'Archived')

    const q = filters.search.toLowerCase()
    if (q) {
      base = base.filter(i =>
        (i.title || '').toLowerCase().includes(q) ||
        (i.primary_pillar || '').toLowerCase().includes(q) ||
        (i.narrative_stack || '').toLowerCase().includes(q) ||
        (i.source_events || []).join(' ').toLowerCase().includes(q) ||
        (i.source_concept_features || []).join(' ').toLowerCase().includes(q)
      )
    }
    if (filters.platform)   base = base.filter(i => i.platform === filters.platform)
    if (filters.priority)   base = base.filter(i => i.priority === filters.priority)
    if (filters.status)     base = base.filter(i => i.status === filters.status)
    if (filters.pillar)     base = base.filter(i => i.primary_pillar === filters.pillar)
    if (filters.sourceType) base = base.filter(i => i.source_type === filters.sourceType)

    return base
  }, [items, tab, filters])

  // ── Actions ─────────────────────────────────────────────────────────────────

  async function handleStatusChange(id, status) {
    setUpdatingId(id)
    try {
      const updated = await updateQueueStatus(id, status)
      setItems(prev => prev.map(i => i.id === id ? updated : i))
      if (panelItem?.id === id) setPanelItem(updated)
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleSaveNotes(id, notes) {
    const updated = await updateQueueItem(id, { notes })
    setItems(prev => prev.map(i => i.id === id ? updated : i))
    if (panelItem?.id === id) setPanelItem(updated)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this queue item permanently?\n\nSource events and PMF assets are not affected.')) return
    await deleteFromQueue(id)
    setItems(prev => prev.filter(i => i.id !== id))
    if (panelItem?.id === id) setPanelItem(null)
  }

  async function handleArchive(id) {
    await handleStatusChange(id, 'Archived')
  }

  async function handleRestore(id) {
    await handleStatusChange(id, 'Posted')
  }

  async function handleAddItem(values) {
    const created = await createQueueItem(values)
    setItems(prev => [created, ...prev])
  }

  function openPanel(item) {
    setPanelItem(item)
  }

  if (loading) return <LoadingState message="Loading queue…" />

  const activeCount  = items.filter(i => i.status !== 'Archived').length
  const historyCount = items.filter(i => HISTORY_STATUSES.includes(i.status)).length

  return (
    <div className={`min-h-full transition-all ${panelItem ? 'mr-[400px]' : ''}`}>
      <PageContainer className="max-w-7xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-[#1a1a2e] tracking-tight">Content Queue</h1>
            <p className="text-sm text-[#9ca3af] mt-0.5">
              Production workflow — from opportunity to posting.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-[#e879a0] text-white hover:bg-[#d4659a] transition-colors"
          >
            <PlusIcon size={14} />
            Add Item
          </button>
        </div>

        {/* Analytics */}
        <AnalyticsSection items={items} />

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-4">
          {[
            { key: 'active',  label: 'Active Queue', count: activeCount },
            { key: 'history', label: 'History',      count: historyCount },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === key
                  ? 'bg-[#fce4ed] text-[#e879a0]'
                  : 'text-[#6b7280] hover:bg-[#fdf2f6] hover:text-[#e879a0]'
              }`}
            >
              {label}
              <span className="ml-1.5 text-[11px] opacity-70">{count}</span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <FiltersBar filters={filters} onChange={setFilters} onClear={() => setFilters(EMPTY_FILTERS)} />

        {/* Table */}
        <QueueTable
          items={filtered}
          onOpenPanel={openPanel}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
          updatingId={updatingId}
        />
      </PageContainer>

      {/* Detail Panel */}
      {panelItem && (
        <DetailPanel
          item={panelItem}
          onClose={() => setPanelItem(null)}
          onStatusChange={handleStatusChange}
          onSaveNotes={handleSaveNotes}
          onDelete={handleDelete}
          onArchive={handleArchive}
          onRestore={handleRestore}
          updatingId={updatingId}
        />
      )}

      {/* Add Modal */}
      <AddItemModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleAddItem}
      />
    </div>
  )
}
