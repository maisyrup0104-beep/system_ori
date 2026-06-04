'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import PageContainer from '@/components/shared/PageContainer'
import LoadingState from '@/components/shared/LoadingState'
import { ArrowLeftIcon, PlusIcon, Trash2Icon, SaveIcon, CheckIcon } from 'lucide-react'
import { formatPHP } from '@/lib/currency'
import {
  getClientById, updateClientWorkspace,
  getDiscovery, upsertDiscovery,
  getOpportunityAnalysis, upsertOpportunityAnalysis,
  getProductionWorkspace, upsertProductionWorkspace,
  getDeliveryWorkspace, upsertDeliveryWorkspace,
  getTestimonialWorkspace, upsertTestimonialWorkspace,
  getAssets, createAsset, deleteAsset,
  getValidationSignals, createValidationSignal, deleteValidationSignal,
  getTimeline, addTimelineEntry,
} from '@/services/clientWorkspace'
import { createEvent } from '@/services/events'
import { createQueueItem } from '@/services/contentOpportunities'
import { createClientActivity } from '@/services/clientActivities'
import { deleteClientRecord } from '@/services/clients'

// ── Constants ─────────────────────────────────────────────────────────────────

const PROJECT_STATUSES = ['Discovery', 'Research', 'Concept', 'Production', 'Review', 'Delivered', 'Archived']
const PRODUCTION_STATUSES = ['Not Started', 'In Progress', 'Review Ready', 'Revision Needed', 'Approved']
const DELIVERY_STATUSES = ['Pending', 'Delivered', 'Confirmed']
const TESTIMONIAL_STATUSES = ['Not Requested', 'Requested', 'Received', 'Declined']
const SIGNAL_TYPES = ['Observation', 'Real Validation', 'PMF Discovery', 'Objection', 'Market Evidence', 'Learning']
const ASSET_TYPES = ['Logo', 'Brand Assets', 'Photos', 'Videos', 'Clinic Photos', 'Staff Photos', 'Doctor Photos', 'Social Links', 'Website Assets']
const PILLARS = ['Authority', 'Trust', 'Premium', 'Differentiation', 'Proof']
const PAYMENT_STATUSES = ['Unpaid', 'Partial', 'Paid']

const CONCEPTS = [
  { name: 'The Trust Gap', desc: 'Position around the trust deficit patients face — comparing clinics without real criteria.' },
  { name: 'Why Premium Wins', desc: 'Show why premium clinics attract better patients and command higher prices.' },
  { name: 'The Clinic Nobody Remembers', desc: 'The danger of being generic — what makes a clinic forgettable and how to fix it.' },
  { name: 'Before Trust Comes Expertise', desc: 'Expertise must be visible before trust can form — the expertise-first framework.' },
  { name: 'The Decision Moment', desc: 'What happens in the moment a patient decides to book — and how to win it.' },
]

const TYPE_COLORS = {
  Paid:          { bg: '#dcfce7', text: '#16a34a' },
  'Paid Client': { bg: '#dcfce7', text: '#16a34a' },
  Free:          { bg: '#fef3c7', text: '#d97706' },
  'Free Sample': { bg: '#fef3c7', text: '#d97706' },
  Demo:          { bg: '#e0f2fe', text: '#0369a1' },
}

const STATUS_COLORS = {
  Discovery:  { bg: '#f3f4f6', text: '#6b7280' },
  Research:   { bg: '#ede9fe', text: '#7c3aed' },
  Concept:    { bg: '#dbeafe', text: '#1d4ed8' },
  Production: { bg: '#fef3c7', text: '#d97706' },
  Review:     { bg: '#fce7f3', text: '#db2777' },
  Delivered:  { bg: '#dcfce7', text: '#16a34a' },
  Archived:   { bg: '#f1f5f9', text: '#64748b' },
}

function isPaidType(clientType) {
  return clientType === 'Paid' || clientType === 'Paid Client'
}

// ── Shared UI ─────────────────────────────────────────────────────────────────

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#9ca3af] uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function Input({ value, onChange, placeholder, type = 'text' }) {
  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-white border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#1a1a2e] placeholder-[#9ca3af] focus:outline-none focus:border-[#e879a0] transition-colors"
    />
  )
}

function Textarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full bg-white border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#1a1a2e] placeholder-[#9ca3af] focus:outline-none focus:border-[#e879a0] resize-none transition-colors"
    />
  )
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-white border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#1a1a2e] focus:outline-none focus:border-[#e879a0] transition-colors"
    >
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

function SectionTitle({ children }) {
  return <h3 className="text-xs font-semibold text-[#9ca3af] uppercase tracking-widest mb-4">{children}</h3>
}

function SaveBtn({ onClick, saving }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="flex items-center gap-1.5 px-4 py-2 bg-[#e879a0] hover:bg-[#d4648a] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
    >
      <SaveIcon size={13} />
      {saving ? 'Saving…' : 'Save'}
    </button>
  )
}

function StatusBadge({ value, colors }) {
  const c = colors[value] || { bg: '#f3f4f6', text: '#6b7280' }
  return (
    <span className="text-xs px-2 py-0.5 rounded-md font-medium" style={{ backgroundColor: c.bg, color: c.text }}>
      {value}
    </span>
  )
}

function PillToggle({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
            value === s
              ? 'bg-[#fce4ed] text-[#e879a0] border-[#e879a0]'
              : 'bg-[#f9f0f5] text-[#9ca3af] border-transparent hover:border-[#e879a0]/40'
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  )
}

function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-[#f0e8ee] p-5 ${className}`}>
      {children}
    </div>
  )
}

// ── OVERVIEW TAB ──────────────────────────────────────────────────────────────

function OverviewTab({ client, timeline, onProjectStatusChange, onLogEvent, onSaveToQueue }) {
  const [logForm, setLogForm] = useState({ open: false, actionType: '', actionSubtype: '', title: '', notes: '' })
  const [queueForm, setQueueForm] = useState({ open: false, title: '', priority: 'Medium', primary_pillar: 'Authority' })
  const [savingStatus, setSavingStatus] = useState(false)
  const [savingQueue, setSavingQueue] = useState(false)
  const [savingLog, setSavingLog] = useState(false)

  const typeColors = TYPE_COLORS[client.client_type] || { bg: '#f3f4f6', text: '#6b7280' }
  const totalRevenue = isPaidType(client.client_type) ? (Number(client.actual_revenue) || 0) : 0

  async function handleStatusChange(status) {
    setSavingStatus(true)
    try { await onProjectStatusChange(status) }
    finally { setSavingStatus(false) }
  }

  async function handleLogSubmit() {
    if (!logForm.title) return
    setSavingLog(true)
    try {
      await onLogEvent(logForm.actionType, logForm.actionSubtype, logForm.title, logForm.notes)
      setLogForm({ open: false, actionType: '', actionSubtype: '', title: '', notes: '' })
    } finally { setSavingLog(false) }
  }

  async function handleQueueSubmit() {
    if (!queueForm.title) return
    setSavingQueue(true)
    try {
      await onSaveToQueue(queueForm)
      setQueueForm({ open: false, title: '', priority: 'Medium', primary_pillar: 'Authority' })
    } finally { setSavingQueue(false) }
  }

  const quickActions = [
    { label: 'Log Conversation',  actionType: 'Signal',     actionSubtype: 'Client Conversation' },
    { label: 'Log Discovery',     actionType: 'Validation', actionSubtype: 'PMF Discovery' },
    { label: 'Log Observation',   actionType: 'Observation', actionSubtype: 'Market Observation' },
    { label: 'Log Validation',    actionType: 'Validation', actionSubtype: 'Real Validation' },
    { label: 'Log Learning',      actionType: 'Validation', actionSubtype: 'Learning' },
    { label: 'Log Revenue',       actionType: 'Revenue',    actionSubtype: 'Client Revenue' },
  ]

  return (
    <div className="space-y-5">
      {/* Client summary */}
      <Card>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-[#1a1a2e]">{client.business_name}</h2>
            {client.segment && <p className="text-sm text-[#9ca3af] mt-0.5">{client.segment}</p>}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded-md font-medium" style={{ backgroundColor: typeColors.bg, color: typeColors.text }}>
              {client.client_type}
            </span>
            <StatusBadge value={client.project_status || 'Discovery'} colors={STATUS_COLORS} />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-[#fdf7fb] rounded-lg p-3">
            <p className="text-xs text-[#9ca3af] mb-1">Created</p>
            <p className="text-sm font-medium text-[#1a1a2e]">{new Date(client.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
          </div>
          <div className="bg-[#fdf7fb] rounded-lg p-3">
            <p className="text-xs text-[#9ca3af] mb-1">Concept</p>
            <p className="text-sm font-medium text-[#1a1a2e] truncate">{client.selected_concept || '—'}</p>
          </div>
          <div className="bg-[#fdf7fb] rounded-lg p-3">
            <p className="text-xs text-[#9ca3af] mb-1">Testimonial</p>
            <p className="text-sm font-medium text-[#1a1a2e]">{client.testimonial_status || 'Not Requested'}</p>
          </div>
          <div className="bg-[#fdf7fb] rounded-lg p-3">
            <p className="text-xs text-[#9ca3af] mb-1">{isPaidType(client.client_type) ? 'Revenue' : 'Type'}</p>
            <p className="text-sm font-medium" style={{ color: isPaidType(client.client_type) ? '#16a34a' : '#9ca3af' }}>
              {isPaidType(client.client_type) ? formatPHP(totalRevenue) : client.client_type}
            </p>
          </div>
        </div>
      </Card>

      {/* Project status */}
      <Card>
        <SectionTitle>Project Status</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {PROJECT_STATUSES.map((s) => {
            const c = STATUS_COLORS[s]
            const isActive = (client.project_status || 'Discovery') === s
            return (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                disabled={savingStatus}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  isActive ? 'ring-1 ring-[#e879a0] border-[#e879a0]' : 'border-transparent hover:border-[#e879a0]/40'
                }`}
                style={{ backgroundColor: c.bg, color: c.text }}
              >
                {s}
              </button>
            )
          })}
        </div>
      </Card>

      {/* Quick actions → Event Log */}
      <Card>
        <SectionTitle>Quick Actions — Event Log</SectionTitle>
        <div className="flex flex-wrap gap-2 mb-4">
          {quickActions.map((a) => (
            <button
              key={a.label}
              onClick={() => setLogForm({ open: true, actionType: a.actionType, actionSubtype: a.actionSubtype, title: '', notes: '' })}
              className="px-3 py-1.5 bg-[#f9f0f5] hover:bg-[#fce4ed] text-[#e879a0] text-xs font-medium rounded-lg transition-colors"
            >
              {a.label}
            </button>
          ))}
        </div>

        {logForm.open && (
          <div className="border border-[#f0e8ee] rounded-lg p-4 space-y-3 bg-[#fdf7fb]">
            <p className="text-xs font-semibold text-[#6b7280]">{logForm.actionType} — {logForm.actionSubtype}</p>
            <Field label="Title">
              <Input value={logForm.title} onChange={(v) => setLogForm((p) => ({ ...p, title: v }))} placeholder="Event title…" />
            </Field>
            <Field label="Notes">
              <Textarea value={logForm.notes} onChange={(v) => setLogForm((p) => ({ ...p, notes: v }))} placeholder="Notes…" rows={2} />
            </Field>
            <div className="flex gap-2">
              <button
                onClick={handleLogSubmit}
                disabled={savingLog}
                className="px-3 py-1.5 bg-[#e879a0] text-white text-xs font-medium rounded-lg hover:bg-[#d4648a] disabled:opacity-50"
              >
                {savingLog ? 'Logging…' : 'Log Event'}
              </button>
              <button onClick={() => setLogForm({ open: false, actionType: '', actionSubtype: '', title: '', notes: '' })} className="px-3 py-1.5 text-[#9ca3af] text-xs rounded-lg hover:text-[#6b7280]">
                Cancel
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Save to Queue */}
      <Card>
        <SectionTitle>Create Content Opportunity</SectionTitle>
        {!queueForm.open ? (
          <button
            onClick={() => setQueueForm((p) => ({ ...p, open: true }))}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#f9f0f5] hover:bg-[#fce4ed] text-[#e879a0] text-sm font-medium rounded-lg transition-colors"
          >
            <PlusIcon size={13} /> Save to Queue
          </button>
        ) : (
          <div className="space-y-3">
            <Field label="Title">
              <Input value={queueForm.title} onChange={(v) => setQueueForm((p) => ({ ...p, title: v }))} placeholder="Content title…" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Priority">
                <Select value={queueForm.priority} onChange={(v) => setQueueForm((p) => ({ ...p, priority: v }))} options={['High', 'Medium', 'Low']} />
              </Field>
              <Field label="Pillar">
                <Select value={queueForm.primary_pillar} onChange={(v) => setQueueForm((p) => ({ ...p, primary_pillar: v }))} options={PILLARS} />
              </Field>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleQueueSubmit}
                disabled={savingQueue}
                className="px-3 py-1.5 bg-[#e879a0] text-white text-xs font-medium rounded-lg hover:bg-[#d4648a] disabled:opacity-50"
              >
                {savingQueue ? 'Saving…' : 'Save to Queue'}
              </button>
              <button onClick={() => setQueueForm((p) => ({ ...p, open: false }))} className="px-3 py-1.5 text-[#9ca3af] text-xs rounded-lg hover:text-[#6b7280]">
                Cancel
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Timeline */}
      <Card>
        <SectionTitle>Project Timeline</SectionTitle>
        {timeline.length === 0 ? (
          <p className="text-sm text-[#9ca3af]">No timeline entries yet.</p>
        ) : (
          <div className="space-y-3">
            {timeline.map((t) => (
              <div key={t.id} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#e879a0] mt-2 flex-shrink-0" />
                <div>
                  <p className="text-sm text-[#1a1a2e]">{t.description}</p>
                  <p className="text-xs text-[#9ca3af] mt-0.5">
                    {new Date(t.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

// ── DISCOVERY TAB ─────────────────────────────────────────────────────────────

function DiscoveryTab({ clientId, data, signals, onSave, onAddSignal, onDeleteSignal }) {
  const empty = {
    owner_name: '', contact_person: '', phone: '', email: '', website: '', facebook: '', instagram: '',
    target_service: '', target_patient: '', desired_patient_type: '', most_profitable_service: '',
    q_biggest_focus: '', q_most_revenue: '', q_differentiation: '', q_patient_questions: '',
    q_concerns_booking: '', q_biggest_competitors: '', q_patient_type_wanted: '',
  }
  const [form, setForm] = useState({ ...empty, ...data })
  const [saving, setSaving] = useState(false)
  const [newSignal, setNewSignal] = useState({ signal: '', signal_type: 'Observation', segment: '' })
  const [addingSignal, setAddingSignal] = useState(false)
  const [savingSignal, setSavingSignal] = useState(false)

  useEffect(() => { if (data) setForm((p) => ({ ...p, ...data })) }, [data])

  const set = (k) => (v) => setForm((p) => ({ ...p, [k]: v }))

  async function handleSave() {
    setSaving(true)
    try { await onSave(form) }
    finally { setSaving(false) }
  }

  async function handleAddSignal() {
    if (!newSignal.signal) return
    setSavingSignal(true)
    try {
      await onAddSignal(newSignal)
      setNewSignal({ signal: '', signal_type: 'Observation', segment: '' })
      setAddingSignal(false)
    } finally { setSavingSignal(false) }
  }

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle>Business Information</SectionTitle>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Owner Name"><Input value={form.owner_name} onChange={set('owner_name')} placeholder="Owner / Founder" /></Field>
          <Field label="Contact Person"><Input value={form.contact_person} onChange={set('contact_person')} placeholder="Primary contact" /></Field>
          <Field label="Phone"><Input value={form.phone} onChange={set('phone')} placeholder="+63 900 000 0000" /></Field>
          <Field label="Email"><Input value={form.email} onChange={set('email')} placeholder="email@clinic.com" /></Field>
          <Field label="Website"><Input value={form.website} onChange={set('website')} placeholder="https://" /></Field>
          <Field label="Facebook"><Input value={form.facebook} onChange={set('facebook')} placeholder="Facebook URL" /></Field>
          <Field label="Instagram"><Input value={form.instagram} onChange={set('instagram')} placeholder="Instagram URL" /></Field>
        </div>
      </Card>

      <Card>
        <SectionTitle>Target Information</SectionTitle>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Target Service"><Input value={form.target_service} onChange={set('target_service')} placeholder="Primary service to promote" /></Field>
          <Field label="Target Patient"><Input value={form.target_patient} onChange={set('target_patient')} placeholder="Ideal patient profile" /></Field>
          <Field label="Desired Patient Type"><Input value={form.desired_patient_type} onChange={set('desired_patient_type')} placeholder="Who they want more of" /></Field>
          <Field label="Most Profitable Service"><Input value={form.most_profitable_service} onChange={set('most_profitable_service')} placeholder="Highest-margin service" /></Field>
        </div>
      </Card>

      <Card>
        <SectionTitle>Discovery Questions</SectionTitle>
        <div className="space-y-4">
          {[
            ['q_biggest_focus',      'What services are your biggest focus right now?'],
            ['q_most_revenue',       'What treatments generate the most revenue?'],
            ['q_differentiation',    'What makes you different?'],
            ['q_patient_questions',  'What questions do patients ask most?'],
            ['q_concerns_booking',   'What concerns stop patients from booking?'],
            ['q_biggest_competitors','Who are your biggest competitors?'],
            ['q_patient_type_wanted','What type of patients do you want more of?'],
          ].map(([key, label]) => (
            <Field key={key} label={label}>
              <Textarea value={form[key]} onChange={set(key)} placeholder="Answer…" rows={2} />
            </Field>
          ))}
        </div>
      </Card>

      <div className="flex justify-end">
        <SaveBtn onClick={handleSave} saving={saving} />
      </div>

      {/* Validation Signals */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <SectionTitle>Validation Signals</SectionTitle>
          <button
            onClick={() => setAddingSignal(true)}
            className="flex items-center gap-1 text-xs text-[#e879a0] font-medium hover:text-[#d4648a]"
          >
            <PlusIcon size={12} /> Add Signal
          </button>
        </div>

        {addingSignal && (
          <div className="border border-[#f0e8ee] rounded-lg p-4 space-y-3 bg-[#fdf7fb] mb-4">
            <Field label="Signal">
              <Textarea value={newSignal.signal} onChange={(v) => setNewSignal((p) => ({ ...p, signal: v }))} placeholder="What did the patient or client say?" rows={2} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type">
                <Select value={newSignal.signal_type} onChange={(v) => setNewSignal((p) => ({ ...p, signal_type: v }))} options={SIGNAL_TYPES} />
              </Field>
              <Field label="Segment (optional)">
                <Input value={newSignal.segment} onChange={(v) => setNewSignal((p) => ({ ...p, segment: v }))} placeholder="e.g. Dental, Aesthetic" />
              </Field>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddSignal}
                disabled={savingSignal}
                className="px-3 py-1.5 bg-[#e879a0] text-white text-xs font-medium rounded-lg hover:bg-[#d4648a] disabled:opacity-50"
              >
                {savingSignal ? 'Saving…' : 'Save Signal'}
              </button>
              <button onClick={() => setAddingSignal(false)} className="px-3 py-1.5 text-[#9ca3af] text-xs rounded-lg hover:text-[#6b7280]">
                Cancel
              </button>
            </div>
          </div>
        )}

        {signals.length === 0 ? (
          <p className="text-sm text-[#9ca3af]">No signals yet. Capture what patients say during discovery — these feed PMF Intelligence.</p>
        ) : (
          <div className="space-y-0">
            {signals.map((s) => (
              <div key={s.id} className="flex items-start justify-between gap-3 py-3 border-b border-[#f9f0f5] last:border-0">
                <div className="flex-1">
                  <p className="text-sm text-[#1a1a2e]">"{s.signal}"</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] px-1.5 py-0.5 bg-[#f3e8ff] text-[#7c3aed] rounded font-medium">{s.signal_type}</span>
                    {s.segment && <span className="text-[10px] text-[#9ca3af]">{s.segment}</span>}
                    <span className="text-[10px] text-[#c4b5c0]">{new Date(s.created_at).toLocaleDateString('en-PH')}</span>
                  </div>
                </div>
                <button onClick={() => onDeleteSignal(s.id)} className="p-1 text-[#9ca3af] hover:text-[#ef4444] transition-colors flex-shrink-0">
                  <Trash2Icon size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

// ── ASSETS TAB ────────────────────────────────────────────────────────────────

function AssetsTab({ assets, onAdd, onDelete }) {
  const [form, setForm] = useState({ asset_type: 'Logo', label: '', url: '', notes: '' })
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleAdd() {
    if (!form.url) return
    setSaving(true)
    try {
      await onAdd(form)
      setForm({ asset_type: 'Logo', label: '', url: '', notes: '' })
      setAdding(false)
    } finally { setSaving(false) }
  }

  const grouped = ASSET_TYPES.reduce((acc, type) => {
    const items = assets.filter((a) => a.asset_type === type)
    if (items.length > 0) acc[type] = items
    return acc
  }, {})

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <SectionTitle>Client Assets</SectionTitle>
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 text-xs text-[#e879a0] font-medium hover:text-[#d4648a]"
          >
            <PlusIcon size={12} /> Add Asset
          </button>
        </div>

        {adding && (
          <div className="border border-[#f0e8ee] rounded-lg p-4 space-y-3 bg-[#fdf7fb] mb-5">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type">
                <Select value={form.asset_type} onChange={(v) => setForm((p) => ({ ...p, asset_type: v }))} options={ASSET_TYPES} />
              </Field>
              <Field label="Label (optional)">
                <Input value={form.label} onChange={(v) => setForm((p) => ({ ...p, label: v }))} placeholder="e.g. Main Logo" />
              </Field>
            </div>
            <Field label="URL / Link">
              <Input value={form.url} onChange={(v) => setForm((p) => ({ ...p, url: v }))} placeholder="https://drive.google.com/…" />
            </Field>
            <Field label="Notes (optional)">
              <Input value={form.notes} onChange={(v) => setForm((p) => ({ ...p, notes: v }))} placeholder="Any notes about this asset" />
            </Field>
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={saving}
                className="px-3 py-1.5 bg-[#e879a0] text-white text-xs font-medium rounded-lg hover:bg-[#d4648a] disabled:opacity-50"
              >
                {saving ? 'Adding…' : 'Add'}
              </button>
              <button onClick={() => setAdding(false)} className="px-3 py-1.5 text-[#9ca3af] text-xs rounded-lg hover:text-[#6b7280]">
                Cancel
              </button>
            </div>
          </div>
        )}

        {assets.length === 0 ? (
          <p className="text-sm text-[#9ca3af]">No assets yet. Add links to client materials — logos, photos, videos, social links.</p>
        ) : (
          <div className="space-y-5">
            {Object.entries(grouped).map(([type, items]) => (
              <div key={type}>
                <p className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wide mb-2">{type}</p>
                <div className="space-y-0">
                  {items.map((a) => (
                    <div key={a.id} className="flex items-center justify-between gap-3 py-2.5 border-b border-[#f9f0f5] last:border-0">
                      <div className="flex-1 min-w-0">
                        <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-sm text-[#e879a0] hover:text-[#d4648a] truncate block">
                          {a.label || a.url}
                        </a>
                        {a.notes && <p className="text-xs text-[#9ca3af] mt-0.5">{a.notes}</p>}
                      </div>
                      <button onClick={() => onDelete(a.id)} className="p-1 text-[#9ca3af] hover:text-[#ef4444] transition-colors flex-shrink-0">
                        <Trash2Icon size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

// ── OPPORTUNITY ANALYSIS TAB ──────────────────────────────────────────────────

function OpportunityTab({ data, onSave }) {
  const empty = { trust_gap: '', authority_gap: '', premium_gap: '', differentiation_gap: '', additional_notes: '', opportunities: '', observations: '' }
  const [form, setForm] = useState({ ...empty, ...data })
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (data) setForm((p) => ({ ...p, ...data })) }, [data])

  const set = (k) => (v) => setForm((p) => ({ ...p, [k]: v }))

  async function handleSave() {
    setSaving(true)
    try { await onSave(form) }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle>Gap Analysis</SectionTitle>
        <p className="text-xs text-[#9ca3af] -mt-2 mb-4">Internal only. Not client-facing.</p>
        <div className="space-y-4">
          <Field label="Trust Gap"><Textarea value={form.trust_gap} onChange={set('trust_gap')} placeholder="Where is the trust deficit?" rows={2} /></Field>
          <Field label="Authority Gap"><Textarea value={form.authority_gap} onChange={set('authority_gap')} placeholder="Where is the authority deficit?" rows={2} /></Field>
          <Field label="Premium Gap"><Textarea value={form.premium_gap} onChange={set('premium_gap')} placeholder="Where is the premium positioning gap?" rows={2} /></Field>
          <Field label="Differentiation Gap"><Textarea value={form.differentiation_gap} onChange={set('differentiation_gap')} placeholder="What makes them undifferentiated?" rows={2} /></Field>
        </div>
      </Card>

      <Card>
        <SectionTitle>Findings</SectionTitle>
        <div className="space-y-4">
          <Field label="Opportunities"><Textarea value={form.opportunities} onChange={set('opportunities')} placeholder="Strategic opportunities identified…" rows={3} /></Field>
          <Field label="Observations"><Textarea value={form.observations} onChange={set('observations')} placeholder="Market / competitive observations…" rows={3} /></Field>
          <Field label="Additional Notes"><Textarea value={form.additional_notes} onChange={set('additional_notes')} placeholder="Any additional strategic notes…" rows={2} /></Field>
        </div>
      </Card>

      <div className="flex justify-end">
        <SaveBtn onClick={handleSave} saving={saving} />
      </div>
    </div>
  )
}

// ── CONCEPT SELECTION TAB ─────────────────────────────────────────────────────

function ConceptTab({ client, onSelectConcept }) {
  const [reason, setReason] = useState(client.selected_concept_reason || '')
  const [custom, setCustom] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => { setReason(client.selected_concept_reason || '') }, [client.selected_concept_reason])

  async function handleSelect(name) {
    setSaving(true)
    try { await onSelectConcept(name, reason, new Date().toISOString().split('T')[0]) }
    finally { setSaving(false) }
  }

  async function handleCustomSave() {
    if (!custom) return
    setSaving(true)
    try { await onSelectConcept(custom, reason, new Date().toISOString().split('T')[0]) }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-5">
      {client.selected_concept && (
        <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-4">
          <p className="text-xs font-semibold text-[#16a34a] uppercase tracking-wide mb-1">Selected Concept</p>
          <p className="text-sm font-semibold text-[#1a1a2e]">{client.selected_concept}</p>
          {client.selected_concept_reason && <p className="text-xs text-[#6b7280] mt-1">{client.selected_concept_reason}</p>}
          {client.selected_concept_date && (
            <p className="text-xs text-[#9ca3af] mt-1">
              Selected {new Date(client.selected_concept_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>
      )}

      <Card>
        <SectionTitle>Concept Library</SectionTitle>
        <div className="space-y-3 mb-5">
          {CONCEPTS.map((c) => {
            const isSelected = client.selected_concept === c.name
            return (
              <div
                key={c.name}
                className={`border rounded-xl p-4 transition-all ${
                  isSelected ? 'border-[#e879a0] bg-[#fdf2f6]' : 'border-[#f0e8ee] bg-white hover:border-[#e879a0]/50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#1a1a2e]">{c.name}</p>
                    <p className="text-xs text-[#9ca3af] mt-0.5">{c.desc}</p>
                  </div>
                  {isSelected ? (
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#e879a0] flex items-center justify-center">
                      <CheckIcon size={11} className="text-white" />
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSelect(c.name)}
                      disabled={saving}
                      className="flex-shrink-0 text-xs px-3 py-1 bg-[#f9f0f5] hover:bg-[#fce4ed] text-[#e879a0] font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      Select
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <Field label="Reason for Selection (optional)">
          <Textarea value={reason} onChange={setReason} placeholder="Why this concept fits this client…" rows={2} />
        </Field>

        <div className="mt-4 pt-4 border-t border-[#f0e8ee]">
          {!showCustom ? (
            <button onClick={() => setShowCustom(true)} className="text-xs text-[#9ca3af] hover:text-[#e879a0] font-medium transition-colors">
              + Create custom concept
            </button>
          ) : (
            <div className="space-y-3">
              <Field label="Custom Concept Name">
                <Input value={custom} onChange={setCustom} placeholder="Your concept name…" />
              </Field>
              <div className="flex gap-2">
                <button
                  onClick={handleCustomSave}
                  disabled={saving}
                  className="px-3 py-1.5 bg-[#e879a0] text-white text-xs font-medium rounded-lg hover:bg-[#d4648a] disabled:opacity-50"
                >
                  Save Custom Concept
                </button>
                <button onClick={() => setShowCustom(false)} className="px-3 py-1.5 text-[#9ca3af] text-xs rounded-lg hover:text-[#6b7280]">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

// ── PRODUCTION TAB ────────────────────────────────────────────────────────────

function ProductionTab({ data, onSave }) {
  const empty = { creative_brief: '', storyboard: '', scene_notes: '', wardrobe_notes: '', location_notes: '', props_notes: '', production_status: 'Not Started', draft_links: [], production_notes: '' }
  const [form, setForm] = useState({ ...empty, ...data, draft_links: data?.draft_links || [] })
  const [saving, setSaving] = useState(false)
  const [newLink, setNewLink] = useState('')

  useEffect(() => { if (data) setForm((p) => ({ ...p, ...data, draft_links: data.draft_links || [] })) }, [data])

  const set = (k) => (v) => setForm((p) => ({ ...p, [k]: v }))

  function addLink() {
    if (!newLink) return
    setForm((p) => ({ ...p, draft_links: [...p.draft_links, newLink] }))
    setNewLink('')
  }

  function removeLink(i) {
    setForm((p) => ({ ...p, draft_links: p.draft_links.filter((_, idx) => idx !== i) }))
  }

  async function handleSave() {
    setSaving(true)
    try { await onSave(form) }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle>Production Status</SectionTitle>
        <PillToggle options={PRODUCTION_STATUSES} value={form.production_status} onChange={set('production_status')} />
      </Card>

      <Card>
        <SectionTitle>Creative Brief</SectionTitle>
        <div className="space-y-4">
          <Field label="Creative Brief"><Textarea value={form.creative_brief} onChange={set('creative_brief')} placeholder="Overall creative direction…" rows={4} /></Field>
          <Field label="Storyboard"><Textarea value={form.storyboard} onChange={set('storyboard')} placeholder="Shot-by-shot breakdown…" rows={4} /></Field>
        </div>
      </Card>

      <Card>
        <SectionTitle>Production Notes</SectionTitle>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Scene Notes"><Textarea value={form.scene_notes} onChange={set('scene_notes')} placeholder="Scene notes…" rows={3} /></Field>
          <Field label="Wardrobe Notes"><Textarea value={form.wardrobe_notes} onChange={set('wardrobe_notes')} placeholder="Wardrobe notes…" rows={3} /></Field>
          <Field label="Location Notes"><Textarea value={form.location_notes} onChange={set('location_notes')} placeholder="Location notes…" rows={3} /></Field>
          <Field label="Props Notes"><Textarea value={form.props_notes} onChange={set('props_notes')} placeholder="Props notes…" rows={3} /></Field>
        </div>
        <div className="mt-4">
          <Field label="General Notes"><Textarea value={form.production_notes} onChange={set('production_notes')} placeholder="Other notes…" rows={2} /></Field>
        </div>
      </Card>

      <Card>
        <SectionTitle>Draft Links</SectionTitle>
        <div className="space-y-2 mb-3">
          {form.draft_links.map((link, i) => (
            <div key={i} className="flex items-center gap-2">
              <a href={link} target="_blank" rel="noopener noreferrer" className="flex-1 text-sm text-[#e879a0] hover:text-[#d4648a] truncate">{link}</a>
              <button onClick={() => removeLink(i)} className="p-1 text-[#9ca3af] hover:text-[#ef4444] transition-colors">
                <Trash2Icon size={13} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newLink}
            onChange={(e) => setNewLink(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addLink() }}
            placeholder="https://…"
            className="flex-1 bg-white border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#e879a0] transition-colors"
          />
          <button onClick={addLink} className="px-3 py-2 bg-[#f9f0f5] hover:bg-[#fce4ed] text-[#e879a0] text-xs font-medium rounded-lg transition-colors">
            Add
          </button>
        </div>
      </Card>

      <div className="flex justify-end">
        <SaveBtn onClick={handleSave} saving={saving} />
      </div>
    </div>
  )
}

// ── DELIVERY TAB ──────────────────────────────────────────────────────────────

function DeliveryTab({ data, onSave }) {
  const empty = { deliverables: '', delivery_date: '', delivery_notes: '', client_confirmation: '', delivery_status: 'Pending', final_asset_links: [] }
  const [form, setForm] = useState({ ...empty, ...data, final_asset_links: data?.final_asset_links || [] })
  const [saving, setSaving] = useState(false)
  const [newLink, setNewLink] = useState('')

  useEffect(() => { if (data) setForm((p) => ({ ...p, ...data, final_asset_links: data.final_asset_links || [] })) }, [data])

  const set = (k) => (v) => setForm((p) => ({ ...p, [k]: v }))

  function addLink() {
    if (!newLink) return
    setForm((p) => ({ ...p, final_asset_links: [...p.final_asset_links, newLink] }))
    setNewLink('')
  }

  function removeLink(i) {
    setForm((p) => ({ ...p, final_asset_links: p.final_asset_links.filter((_, idx) => idx !== i) }))
  }

  async function handleSave() {
    setSaving(true)
    try { await onSave(form) }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle>Delivery Status</SectionTitle>
        <PillToggle options={DELIVERY_STATUSES} value={form.delivery_status} onChange={set('delivery_status')} />
      </Card>

      <Card>
        <SectionTitle>Delivery Details</SectionTitle>
        <div className="space-y-4">
          <Field label="Deliverables"><Textarea value={form.deliverables} onChange={set('deliverables')} placeholder="List of deliverables…" rows={3} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Delivery Date"><Input type="date" value={form.delivery_date} onChange={set('delivery_date')} /></Field>
            <Field label="Client Confirmation"><Input value={form.client_confirmation} onChange={set('client_confirmation')} placeholder="How client confirmed receipt" /></Field>
          </div>
          <Field label="Delivery Notes"><Textarea value={form.delivery_notes} onChange={set('delivery_notes')} placeholder="Notes about the delivery…" rows={2} /></Field>
        </div>
      </Card>

      <Card>
        <SectionTitle>Final Asset Links</SectionTitle>
        <div className="space-y-2 mb-3">
          {form.final_asset_links.map((link, i) => (
            <div key={i} className="flex items-center gap-2">
              <a href={link} target="_blank" rel="noopener noreferrer" className="flex-1 text-sm text-[#e879a0] hover:text-[#d4648a] truncate">{link}</a>
              <button onClick={() => removeLink(i)} className="p-1 text-[#9ca3af] hover:text-[#ef4444] transition-colors">
                <Trash2Icon size={13} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newLink}
            onChange={(e) => setNewLink(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addLink() }}
            placeholder="https://…"
            className="flex-1 bg-white border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#e879a0] transition-colors"
          />
          <button onClick={addLink} className="px-3 py-2 bg-[#f9f0f5] hover:bg-[#fce4ed] text-[#e879a0] text-xs font-medium rounded-lg transition-colors">
            Add
          </button>
        </div>
      </Card>

      <div className="flex justify-end">
        <SaveBtn onClick={handleSave} saving={saving} />
      </div>
    </div>
  )
}

// ── TESTIMONIAL TAB ───────────────────────────────────────────────────────────

function TestimonialTab({ client, workspaceData, onSave, onUpdateClient }) {
  const [status, setStatus] = useState(client.testimonial_status || 'Not Requested')
  const [form, setForm] = useState({ feedback: '', permission_showcase: false, case_study_permission: false, ...workspaceData })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setStatus(client.testimonial_status || 'Not Requested')
    if (workspaceData) setForm((p) => ({ ...p, ...workspaceData }))
  }, [client.testimonial_status, workspaceData])

  async function handleSave() {
    setSaving(true)
    try {
      await onUpdateClient({ testimonial_status: status })
      await onSave({ ...form, testimonial_status: status })
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle>Testimonial Status</SectionTitle>
        <div className="mb-5">
          <PillToggle options={TESTIMONIAL_STATUSES} value={status} onChange={setStatus} />
        </div>
        <Field label="Feedback">
          <Textarea value={form.feedback} onChange={(v) => setForm((p) => ({ ...p, feedback: v }))} placeholder="Client feedback or testimonial text…" rows={5} />
        </Field>
      </Card>

      <Card>
        <SectionTitle>Permissions</SectionTitle>
        <div className="space-y-3">
          {[
            ['permission_showcase', 'Permission to Showcase'],
            ['case_study_permission', 'Case Study Permission'],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setForm((p) => ({ ...p, [key]: !p[key] }))}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  form[key] ? 'bg-[#e879a0] border-[#e879a0]' : 'border-[#e5e7eb] bg-white'
                }`}
              >
                {form[key] && <CheckIcon size={11} className="text-white" />}
              </div>
              <span className="text-sm text-[#4b5563]">{label}</span>
            </label>
          ))}
        </div>
      </Card>

      <div className="flex justify-end">
        <SaveBtn onClick={handleSave} saving={saving} />
      </div>
    </div>
  )
}

// ── REVENUE TAB ───────────────────────────────────────────────────────────────

function RevenueTab({ client, onUpdateClient }) {
  const paid = isPaidType(client.client_type)
  const [form, setForm] = useState({
    price:          client.price ?? '',
    actual_revenue: client.actual_revenue ?? 0,
    payment_status: client.payment_status ?? 'Unpaid',
    revenue_notes:  client.revenue_notes ?? '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm({
      price:          client.price ?? '',
      actual_revenue: client.actual_revenue ?? 0,
      payment_status: client.payment_status ?? 'Unpaid',
      revenue_notes:  client.revenue_notes ?? '',
    })
  }, [client])

  const set = (k) => (v) => setForm((p) => ({ ...p, [k]: v }))
  const typeColors = TYPE_COLORS[client.client_type] || { bg: '#f3f4f6', text: '#6b7280' }

  async function handleSave() {
    setSaving(true)
    try { await onUpdateClient(form) }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex items-center gap-2 mb-5">
          <SectionTitle>Revenue</SectionTitle>
          <span className="text-xs px-2 py-0.5 rounded-md font-medium -mt-4" style={{ backgroundColor: typeColors.bg, color: typeColors.text }}>
            {client.client_type}
          </span>
        </div>

        {paid ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Quoted Price (₱)">
                <Input type="number" value={form.price} onChange={set('price')} placeholder="0.00" />
              </Field>
              <Field label="Actual Revenue (₱)">
                <Input type="number" value={form.actual_revenue} onChange={set('actual_revenue')} placeholder="0.00" />
              </Field>
            </div>
            <Field label="Payment Status">
              <PillToggle options={PAYMENT_STATUSES} value={form.payment_status} onChange={set('payment_status')} />
            </Field>
            <Field label="Revenue Notes">
              <Textarea value={form.revenue_notes} onChange={set('revenue_notes')} placeholder="Payment terms, notes…" rows={2} />
            </Field>
            <div className="flex justify-end">
              <SaveBtn onClick={handleSave} saving={saving} />
            </div>
          </div>
        ) : (
          <div className="bg-[#fafafa] rounded-lg p-4 border border-[#f0e8ee]">
            <p className="text-sm text-[#9ca3af]">Revenue tracking is disabled for {client.client_type} clients.</p>
            <p className="text-xs text-[#c4b5c0] mt-1">Testimonial and case study permissions are available in the Testimonial tab.</p>
          </div>
        )}
      </Card>
    </div>
  )
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'overview',    label: 'Overview' },
  { id: 'discovery',   label: 'Discovery' },
  { id: 'assets',      label: 'Assets' },
  { id: 'opportunity', label: 'Opportunity Analysis' },
  { id: 'concept',     label: 'Concept Selection' },
  { id: 'production',  label: 'Production' },
  { id: 'delivery',    label: 'Delivery' },
  { id: 'testimonial', label: 'Testimonial' },
  { id: 'revenue',     label: 'Revenue' },
]

export default function ClientWorkspacePage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params?.id

  const [client,       setClient]       = useState(null)
  const [discovery,    setDiscovery]    = useState(null)
  const [opportunity,  setOpportunity]  = useState(null)
  const [production,   setProduction]   = useState(null)
  const [delivery,     setDelivery]     = useState(null)
  const [testimonialWS,setTestimonialWS]= useState(null)
  const [assets,       setAssets]       = useState([])
  const [signals,      setSignals]      = useState([])
  const [timeline,     setTimeline]     = useState([])
  const [activeTab,    setActiveTab]    = useState('overview')
  const [loading,      setLoading]      = useState(true)

  useEffect(() => { if (clientId) loadAll() }, [clientId])

  async function loadAll() {
    setLoading(true)
    try {
      const [c, d, o, p, del, tw, a, s, tl] = await Promise.all([
        getClientById(clientId),
        getDiscovery(clientId).catch(() => null),
        getOpportunityAnalysis(clientId).catch(() => null),
        getProductionWorkspace(clientId).catch(() => null),
        getDeliveryWorkspace(clientId).catch(() => null),
        getTestimonialWorkspace(clientId).catch(() => null),
        getAssets(clientId).catch(() => []),
        getValidationSignals(clientId).catch(() => []),
        getTimeline(clientId).catch(() => []),
      ])
      setClient(c)
      setDiscovery(d)
      setOpportunity(o)
      setProduction(p)
      setDelivery(del)
      setTestimonialWS(tw)
      setAssets(a || [])
      setSignals(s || [])

      // Seed initial timeline entry if workspace is brand new
      if ((tl || []).length === 0 && c) {
        const entry = await addTimelineEntry(clientId, 'client_created', `Client workspace opened — ${c.client_type}`).catch(() => null)
        setTimeline(entry ? [entry] : [])
      } else {
        setTimeline(tl || [])
      }
    } catch (err) {
      console.error('Workspace load error', err)
    } finally {
      setLoading(false)
    }
  }

  async function updateClient(values) {
    const updated = await updateClientWorkspace(clientId, values)
    setClient(updated)
    return updated
  }

  // ── Event handlers ────────────────────────────────────────────────────────

  async function handleProjectStatusChange(status) {
    await updateClient({ project_status: status })
    const entry = await addTimelineEntry(clientId, 'status_change', `Project status → ${status}`)
    setTimeline((prev) => [entry, ...prev])
  }

  async function handleLogEvent(actionType, actionSubtype, title, notes) {
    await createEvent({
      title,
      event_type:        actionType,
      event_subtype:     actionSubtype,
      segment:           client.segment || '',
      visibility_target: 'Both',
      strength:          3,
      notes:             `[Client: ${client.business_name}]${notes ? ' ' + notes : ''}`,
    })
    const entry = await addTimelineEntry(clientId, 'event_logged', `Event logged: ${title}`)
    setTimeline((prev) => [entry, ...prev])
    await createClientActivity(clientId, 'note', `Event logged: ${title}`)
  }

  async function handleSaveToQueue({ title, priority, primary_pillar }) {
    await createQueueItem({
      title:         `[${client.business_name}] ${title}`,
      platform:      'Both',
      priority,
      primary_pillar,
      notes:         `Created from Client Workspace — ${client.business_name}`,
    })
    const entry = await addTimelineEntry(clientId, 'queue_created', `Content saved to queue: ${title}`)
    setTimeline((prev) => [entry, ...prev])
  }

  async function handleSaveDiscovery(values) {
    const saved = await upsertDiscovery(clientId, values)
    setDiscovery(saved)
    const entry = await addTimelineEntry(clientId, 'discovery_saved', 'Discovery information saved')
    setTimeline((prev) => [entry, ...prev])
    await createClientActivity(clientId, 'note', 'Discovery information updated')
  }

  async function handleAddSignal(values) {
    const saved = await createValidationSignal(clientId, values)
    setSignals((prev) => [saved, ...prev])
    const entry = await addTimelineEntry(clientId, 'signal_added', `Validation signal: ${values.signal.slice(0, 60)}`)
    setTimeline((prev) => [entry, ...prev])
  }

  async function handleDeleteSignal(id) {
    await deleteValidationSignal(id)
    setSignals((prev) => prev.filter((s) => s.id !== id))
  }

  async function handleSaveOpportunity(values) {
    const saved = await upsertOpportunityAnalysis(clientId, values)
    setOpportunity(saved)
    const entry = await addTimelineEntry(clientId, 'opportunity_saved', 'Opportunity analysis updated')
    setTimeline((prev) => [entry, ...prev])
  }

  async function handleSelectConcept(name, reason, date) {
    await updateClient({ selected_concept: name, selected_concept_reason: reason, selected_concept_date: date })
    const entry = await addTimelineEntry(clientId, 'concept_selected', `Concept selected: ${name}`)
    setTimeline((prev) => [entry, ...prev])
    await createClientActivity(clientId, 'note', `Concept selected: ${name}`)
  }

  async function handleSaveProduction(values) {
    const saved = await upsertProductionWorkspace(clientId, values)
    setProduction(saved)
    const entry = await addTimelineEntry(clientId, 'production_saved', `Production updated — ${values.production_status}`)
    setTimeline((prev) => [entry, ...prev])
  }

  async function handleSaveDelivery(values) {
    const saved = await upsertDeliveryWorkspace(clientId, values)
    setDelivery(saved)
    const entry = await addTimelineEntry(clientId, 'delivery_saved', `Delivery updated — ${values.delivery_status}`)
    setTimeline((prev) => [entry, ...prev])
    if (values.delivery_status === 'Delivered' || values.delivery_status === 'Confirmed') {
      await createClientActivity(clientId, 'delivery', `Delivery marked as ${values.delivery_status}`)
    }
  }

  async function handleSaveTestimonial(values) {
    const saved = await upsertTestimonialWorkspace(clientId, values)
    setTestimonialWS(saved)
    const entry = await addTimelineEntry(clientId, 'testimonial_updated', `Testimonial: ${values.testimonial_status}`)
    setTimeline((prev) => [entry, ...prev])
  }

  async function handleAddAsset(values) {
    const saved = await createAsset(clientId, values)
    setAssets((prev) => [...prev, saved])
    const entry = await addTimelineEntry(clientId, 'asset_added', `Asset added: ${values.label || values.asset_type}`)
    setTimeline((prev) => [entry, ...prev])
  }

  async function handleDeleteAsset(id) {
    await deleteAsset(id)
    setAssets((prev) => prev.filter((a) => a.id !== id))
  }

  async function handleDeleteClient() {
    if (!confirm(`Delete "${client?.business_name}"?\n\nThis will permanently remove the workspace, all project data, revenue records, and timeline.\n\nThis cannot be undone.`)) return
    await deleteClientRecord(clientId)
    router.push('/clients')
  }

  // ─────────────────────────────────────────────────────────────────────────

  if (loading) return <LoadingState message="Loading workspace…" />
  if (!client) {
    return (
      <PageContainer>
        <div className="text-center py-20">
          <p className="text-sm text-[#9ca3af]">Client not found.</p>
          <Link href="/clients" className="text-xs text-[#e879a0] mt-2 inline-block hover:underline">← Back to Clients</Link>
        </div>
      </PageContainer>
    )
  }

  const typeColors = TYPE_COLORS[client.client_type] || { bg: '#f3f4f6', text: '#6b7280' }

  return (
    <PageContainer className="max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/clients"
            className="p-1.5 rounded-lg text-[#9ca3af] hover:text-[#e879a0] hover:bg-[#fce4ed]/60 transition-colors"
          >
            <ArrowLeftIcon size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-semibold text-[#1a1a2e] tracking-tight">{client.business_name}</h1>
              <span className="text-xs px-2 py-0.5 rounded-md font-medium" style={{ backgroundColor: typeColors.bg, color: typeColors.text }}>
                {client.client_type}
              </span>
              <StatusBadge value={client.project_status || 'Discovery'} colors={STATUS_COLORS} />
            </div>
            {client.segment && <p className="text-sm text-[#9ca3af] mt-0.5">{client.segment}</p>}
          </div>
        </div>
        <button
          onClick={handleDeleteClient}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#9ca3af] hover:text-[#ef4444] hover:bg-[#fee2e2]/60 rounded-lg transition-colors"
        >
          <Trash2Icon size={13} />
          Delete Client
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-0.5 bg-[#f9f0f5] rounded-xl p-1 mb-6 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
              activeTab === t.id ? 'bg-white text-[#e879a0] shadow-sm' : 'text-[#9ca3af] hover:text-[#6b7280]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <OverviewTab
          client={client}
          timeline={timeline}
          onProjectStatusChange={handleProjectStatusChange}
          onLogEvent={handleLogEvent}
          onSaveToQueue={handleSaveToQueue}
        />
      )}
      {activeTab === 'discovery' && (
        <DiscoveryTab
          clientId={clientId}
          data={discovery}
          signals={signals}
          onSave={handleSaveDiscovery}
          onAddSignal={handleAddSignal}
          onDeleteSignal={handleDeleteSignal}
        />
      )}
      {activeTab === 'assets' && (
        <AssetsTab
          assets={assets}
          onAdd={handleAddAsset}
          onDelete={handleDeleteAsset}
        />
      )}
      {activeTab === 'opportunity' && (
        <OpportunityTab
          data={opportunity}
          onSave={handleSaveOpportunity}
        />
      )}
      {activeTab === 'concept' && (
        <ConceptTab
          client={client}
          onSelectConcept={handleSelectConcept}
        />
      )}
      {activeTab === 'production' && (
        <ProductionTab
          data={production}
          onSave={handleSaveProduction}
        />
      )}
      {activeTab === 'delivery' && (
        <DeliveryTab
          data={delivery}
          onSave={handleSaveDelivery}
        />
      )}
      {activeTab === 'testimonial' && (
        <TestimonialTab
          client={client}
          workspaceData={testimonialWS}
          onSave={handleSaveTestimonial}
          onUpdateClient={updateClient}
        />
      )}
      {activeTab === 'revenue' && (
        <RevenueTab
          client={client}
          onUpdateClient={updateClient}
        />
      )}
    </PageContainer>
  )
}
