'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import PageContainer from '@/components/shared/PageContainer'
import LoadingState from '@/components/shared/LoadingState'
import LeadForm from '@/components/pipeline/LeadForm'
import LeadDrawer from '@/components/pipeline/LeadDrawer'
import { Button } from '@/components/ui/button'
import { getLeads, createLead, updateLead, deleteLead } from '@/services/leads'
import { getClients, createClientRecord, deleteClientRecord } from '@/services/clients'
import { createLeadActivity } from '@/services/leadActivities'
import { createClientActivity } from '@/services/clientActivities'
import { createProductionItem } from '@/services/production'
import { addTimelineEntry } from '@/services/clientWorkspace'
import { STAGE_COLORS, ACTIVE_STAGES, SEGMENTS, SOURCES } from '@/lib/pipelineConfig'
import { formatPHP } from '@/lib/currency'
import {
  PlusIcon, SearchIcon, Trash2Icon, PencilIcon, ExternalLinkIcon, ChevronDownIcon,
} from 'lucide-react'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

function StatusBadge({ stage }) {
  const c = STAGE_COLORS[stage] || STAGE_COLORS.Lead
  return (
    <span className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: c.bg, color: c.text }}>
      {stage}
    </span>
  )
}

function TypeBadge({ type }) {
  const colors = {
    Paid: { bg: '#dcfce7', text: '#16a34a' },
    Free: { bg: '#fef3c7', text: '#d97706' },
    Demo: { bg: '#e0f2fe', text: '#0369a1' },
  }
  const c = colors[type] || colors.Paid
  return (
    <span className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: c.bg, color: c.text }}>
      {type}
    </span>
  )
}

const thCls = 'text-left px-3 py-2.5 text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wide whitespace-nowrap'
const tdCls = 'px-3 py-2.5 text-sm text-[#374151] whitespace-nowrap'

// ── Metrics ───────────────────────────────────────────────────────────────────

function PipelineMetrics({ leads }) {
  const active = leads.filter((l) => l.stage !== 'Closed')
  const counts = {
    'Active Leads': active.length,
    Contacted:  active.filter((l) => l.stage === 'Contacted').length,
    Replied:    active.filter((l) => l.stage === 'Replied').length,
    Qualified:  active.filter((l) => l.stage === 'Qualified').length,
    Proposal:   active.filter((l) => l.stage === 'Proposal').length,
    Closed:     leads.filter((l) => l.stage === 'Closed').length,
  }

  return (
    <div className="grid grid-cols-6 gap-3 mb-6">
      {Object.entries(counts).map(([label, value]) => (
        <div key={label} className="bg-white rounded-xl border border-[#f0e8ee] p-3 text-center">
          <p className="text-xs text-[#9ca3af] mb-1 leading-tight">{label}</p>
          <p className={`text-xl font-bold ${label === 'Closed' ? 'text-[#16a34a]' : label === 'Active Leads' ? 'text-[#e879a0]' : 'text-[#1a1a2e]'}`}>
            {value}
          </p>
        </div>
      ))}
    </div>
  )
}

// ── Search + Filter bar ───────────────────────────────────────────────────────

function SearchFilterBar({ search, onSearch, filterStatus, onFilterStatus, filterSegment, onFilterSegment, filterSource, onFilterSource, view }) {
  return (
    <div className="flex items-center gap-2 mb-4 flex-wrap">
      <div className="relative flex-1 min-w-[180px] max-w-xs">
        <SearchIcon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search business, contact…"
          className="w-full pl-8 pr-3 h-8 text-sm border border-[#e5e7eb] rounded-lg bg-white focus:outline-none focus:border-[#e879a0] transition-colors placeholder-[#9ca3af]"
        />
      </div>

      {view === 'active' && (
        <select
          value={filterStatus}
          onChange={(e) => onFilterStatus(e.target.value)}
          className="h-8 px-3 text-xs border border-[#e5e7eb] rounded-lg bg-white text-[#374151] focus:outline-none focus:border-[#e879a0] transition-colors"
        >
          <option value="">All Statuses</option>
          {ACTIVE_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      )}

      <select
        value={filterSegment}
        onChange={(e) => onFilterSegment(e.target.value)}
        className="h-8 px-3 text-xs border border-[#e5e7eb] rounded-lg bg-white text-[#374151] focus:outline-none focus:border-[#e879a0] transition-colors"
      >
        <option value="">All Segments</option>
        {SEGMENTS.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>

      {view === 'active' && (
        <select
          value={filterSource}
          onChange={(e) => onFilterSource(e.target.value)}
          className="h-8 px-3 text-xs border border-[#e5e7eb] rounded-lg bg-white text-[#374151] focus:outline-none focus:border-[#e879a0] transition-colors"
        >
          <option value="">All Sources</option>
          {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      )}
    </div>
  )
}

// ── Inline status dropdown ────────────────────────────────────────────────────

function StatusSelect({ lead, onChange }) {
  const c = STAGE_COLORS[lead.stage] || STAGE_COLORS.Lead
  return (
    <select
      value={lead.stage || 'Lead'}
      onChange={(e) => onChange(lead.id, e.target.value, lead.stage)}
      className="h-7 px-1.5 text-[11px] font-semibold rounded border focus:outline-none focus:ring-1 focus:ring-[#e879a0] cursor-pointer"
      style={{ backgroundColor: c.bg, color: c.text, borderColor: c.border }}
    >
      {ACTIVE_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
      <option value="Closed">Closed</option>
    </select>
  )
}

// ── Active Pipeline Table ─────────────────────────────────────────────────────

function ActivePipelineTable({ leads, onView, onEdit, onDelete, onStatusChange }) {
  if (leads.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#f0e8ee] py-16 text-center">
        <p className="text-sm text-[#9ca3af]">No active leads match your filters.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-[#f0e8ee] overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#f0e8ee] bg-[#fafafa]">
            <th className={`${thCls} w-8`}>#</th>
            <th className={thCls}>Status</th>
            <th className={thCls}>Business Name</th>
            <th className={thCls}>Segment</th>
            <th className={thCls}>Contact</th>
            <th className={thCls}>Source</th>
            <th className={thCls}>Last Activity</th>
            <th className={thCls}>Created</th>
            <th className={`${thCls} text-right`}></th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead, i) => (
            <tr
              key={lead.id}
              className={`border-b border-[#f9f0f5] hover:bg-[#fdf7fb] transition-colors ${i === leads.length - 1 ? 'border-b-0' : ''}`}
            >
              <td className={`${tdCls} text-[#c4b5c0] text-xs font-medium w-8`}>#{i + 1}</td>
              <td className={tdCls}>
                <StatusSelect lead={lead} onChange={onStatusChange} />
              </td>
              <td className={`${tdCls} font-medium text-[#1a1a2e] max-w-[180px] truncate`}>
                {lead.business_name}
              </td>
              <td className={`${tdCls} text-[#6b7280] text-xs`}>{lead.segment || '—'}</td>
              <td className={`${tdCls} text-[#6b7280] text-xs max-w-[120px] truncate`}>{lead.contact_name || '—'}</td>
              <td className={`${tdCls} text-xs`}>
                {lead.source ? (
                  <span className="px-1.5 py-0.5 bg-[#f1f5f9] text-[#64748b] rounded text-[10px] font-medium">{lead.source}</span>
                ) : '—'}
              </td>
              <td className={`${tdCls} text-xs text-[#9ca3af]`}>{fmtDate(lead.last_contact_date)}</td>
              <td className={`${tdCls} text-xs text-[#9ca3af]`}>{fmtDate(lead.created_at)}</td>
              <td className={`${tdCls} text-right`}>
                <div className="flex items-center justify-end gap-0.5">
                  <button
                    onClick={() => onView(lead)}
                    title="Open"
                    className="p-1.5 rounded hover:bg-[#dbeafe]/60 text-[#9ca3af] hover:text-[#3b82f6] transition-colors"
                  >
                    <ExternalLinkIcon size={13} />
                  </button>
                  <button
                    onClick={() => onEdit(lead)}
                    title="Edit"
                    className="p-1.5 rounded hover:bg-[#fce4ed]/60 text-[#9ca3af] hover:text-[#e879a0] transition-colors"
                  >
                    <PencilIcon size={13} />
                  </button>
                  <button
                    onClick={() => onDelete(lead)}
                    title="Delete"
                    className="p-1.5 rounded hover:bg-[#fee2e2]/60 text-[#9ca3af] hover:text-[#ef4444] transition-colors"
                  >
                    <Trash2Icon size={13} />
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

// ── Closed Table ──────────────────────────────────────────────────────────────

function ClosedTable({ leads, clients, onDelete }) {
  if (leads.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#f0e8ee] py-16 text-center">
        <p className="text-sm text-[#9ca3af]">No closed records yet.</p>
        <p className="text-xs text-[#c4b5c0] mt-1">Leads appear here when their status is set to Closed.</p>
      </div>
    )
  }

  function findClient(lead) {
    if (lead.client_id) return clients.find((c) => c.id === lead.client_id) || null
    return clients.find((c) => c.business_name === lead.business_name) || null
  }

  function getClientType(lead) {
    const c = findClient(lead)
    if (!c) return null
    // Normalise legacy type names
    if (c.client_type === 'Paid Client' || c.client_type === 'Paid') return 'Paid'
    if (c.client_type === 'Free Sample' || c.client_type === 'Free') return 'Free'
    if (c.client_type === 'Demo') return 'Demo'
    return c.client_type
  }

  function isPaid(lead) { const t = getClientType(lead); return t === 'Paid' }

  return (
    <div className="bg-white rounded-xl border border-[#f0e8ee] overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#f0e8ee] bg-[#fafafa]">
            <th className={`${thCls} w-8`}>#</th>
            <th className={thCls}>Type</th>
            <th className={thCls}>Business Name</th>
            <th className={thCls}>Segment</th>
            <th className={thCls}>Revenue</th>
            <th className={thCls}>Payment</th>
            <th className={thCls}>Closed Date</th>
            <th className={`${thCls} text-right`}></th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead, i) => {
            const client  = findClient(lead)
            const cType   = getClientType(lead)
            const paid    = isPaid(lead)
            return (
              <tr
                key={lead.id}
                className={`border-b border-[#f9f0f5] hover:bg-[#fdf7fb] transition-colors ${i === leads.length - 1 ? 'border-b-0' : ''}`}
              >
                <td className={`${tdCls} text-[#c4b5c0] text-xs font-medium w-8`}>#{i + 1}</td>
                <td className={tdCls}>
                  {cType ? <TypeBadge type={cType} /> : <span className="text-xs text-[#9ca3af]">—</span>}
                </td>
                <td className={`${tdCls} font-medium text-[#1a1a2e] max-w-[180px] truncate`}>{lead.business_name}</td>
                <td className={`${tdCls} text-[#6b7280] text-xs`}>{lead.segment || '—'}</td>
                <td className={`${tdCls} font-semibold`}>
                  {paid && client ? (
                    <span className="text-[#16a34a]">{formatPHP(Number(client.actual_revenue) || 0)}</span>
                  ) : (
                    <span className="text-[#9ca3af]">—</span>
                  )}
                </td>
                <td className={tdCls}>
                  {paid && client?.payment_status ? (
                    <span className="text-xs font-medium text-[#374151]">{client.payment_status}</span>
                  ) : (
                    <span className="text-xs text-[#9ca3af]">—</span>
                  )}
                </td>
                <td className={`${tdCls} text-xs text-[#9ca3af]`}>{fmtDate(lead.last_contact_date || lead.created_at)}</td>
                <td className={`${tdCls} text-right`}>
                  <div className="flex items-center justify-end gap-1">
                    {client && (
                      <Link
                        href={`/clients/${client.id}`}
                        className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium bg-[#f9f0f5] hover:bg-[#fce4ed] text-[#e879a0] rounded-lg transition-colors whitespace-nowrap"
                      >
                        <ExternalLinkIcon size={11} /> Workspace
                      </Link>
                    )}
                    <button
                      onClick={() => onDelete(lead, client)}
                      title="Delete"
                      className="p-1.5 rounded hover:bg-[#fee2e2]/60 text-[#9ca3af] hover:text-[#ef4444] transition-colors"
                    >
                      <Trash2Icon size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Delete modal ──────────────────────────────────────────────────────────────

function DeleteModal({ item, isClosedRecord, onConfirm, onCancel }) {
  if (!item) return null
  const { lead } = item
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-[#f0e8ee] w-full max-w-sm mx-4 p-6">
        <h2 className="text-base font-semibold text-[#1a1a2e] mb-1">
          {isClosedRecord ? 'Delete Closed Record?' : 'Delete Lead?'}
        </h2>
        <p className="text-sm font-medium text-[#4b5563] mb-4">{lead.business_name}</p>

        <div className="bg-[#fff5f5] rounded-lg border border-[#fecaca] px-3 py-2.5 mb-5 space-y-0.5">
          <p className="text-xs font-medium text-[#ef4444]">This will permanently remove:</p>
          {isClosedRecord ? (
            <>
              <p className="text-xs text-[#ef4444]">— Pipeline Record</p>
              <p className="text-xs text-[#ef4444]">— Client Workspace</p>
              <p className="text-xs text-[#ef4444]">— Revenue Records</p>
              <p className="text-xs text-[#ef4444]">— Project Timeline</p>
            </>
          ) : (
            <>
              <p className="text-xs text-[#ef4444]">— Lead Record</p>
              <p className="text-xs text-[#ef4444]">— Lead Notes</p>
              <p className="text-xs text-[#ef4444]">— Activity Timeline</p>
            </>
          )}
          <p className="text-xs font-semibold text-[#ef4444] mt-1">This cannot be undone.</p>
        </div>

        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 h-9 text-sm text-[#6b7280] border border-[#f0e8ee] rounded-lg hover:bg-[#f9f0f5] transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 h-9 text-sm font-semibold text-white bg-[#ef4444] rounded-lg hover:bg-[#dc2626] transition-colors">
            {isClosedRecord ? 'Delete Everything' : 'Delete Lead'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Convert to Client modal ───────────────────────────────────────────────────

function ConvertToClientModal({ lead, onConvert, onCancel }) {
  if (!lead) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-[#f0e8ee] w-full max-w-sm mx-4 p-6">
        <h2 className="text-base font-semibold text-[#1a1a2e] mb-1">Create Client Workspace</h2>
        <p className="text-sm font-medium text-[#4b5563] mb-0.5">{lead.business_name}</p>
        {lead.segment && <p className="text-xs text-[#9ca3af] mb-4">{lead.segment}</p>}

        <p className="text-sm text-[#6b7280] mb-4">
          Select client type to create the workspace.
        </p>

        <div className="space-y-2 mb-5">
          <button
            onClick={() => onConvert('Paid')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] hover:bg-[#dcfce7] transition-colors text-left"
          >
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-[#16a34a]" />
            <div>
              <p className="text-sm font-semibold text-[#16a34a]">Paid</p>
              <p className="text-xs text-[#9ca3af]">Revenue tracked · Payment status: Unpaid</p>
            </div>
          </button>

          <button
            onClick={() => onConvert('Free')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[#fde68a] bg-[#fefce8] hover:bg-[#fef3c7] transition-colors text-left"
          >
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-[#d97706]" />
            <div>
              <p className="text-sm font-semibold text-[#d97706]">Free</p>
              <p className="text-xs text-[#9ca3af]">No revenue tracking · Testimonial enabled</p>
            </div>
          </button>

          <button
            onClick={() => onConvert('Demo')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[#bae6fd] bg-[#f0f9ff] hover:bg-[#e0f2fe] transition-colors text-left"
          >
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-[#0369a1]" />
            <div>
              <p className="text-sm font-semibold text-[#0369a1]">Demo</p>
              <p className="text-xs text-[#9ca3af]">No revenue tracking · Showcase and proof collection</p>
            </div>
          </button>
        </div>

        <button onClick={onCancel} className="w-full text-sm text-[#9ca3af] hover:text-[#6b7280] transition-colors py-1">
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PipelinePage() {
  const [leads,   setLeads]   = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)

  const [view,          setView]          = useState('active')
  const [search,        setSearch]        = useState('')
  const [filterStatus,  setFilterStatus]  = useState('')
  const [filterSegment, setFilterSegment] = useState('')
  const [filterSource,  setFilterSource]  = useState('')

  const [leadModal,    setLeadModal]    = useState({ open: false, mode: 'add', lead: null })
  const [drawerLead,   setDrawerLead]   = useState(null)
  const [drawerOpen,   setDrawerOpen]   = useState(false)
  const [convertModal, setConvertModal] = useState({ open: false, lead: null })
  const [deleteModal,  setDeleteModal]  = useState({ open: false, lead: null, client: null, isClosedRecord: false })

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [l, c] = await Promise.all([
        getLeads().catch(() => []),
        getClients().catch(() => []),
      ])
      setLeads(l ?? [])
      setClients(c ?? [])
    } finally {
      setLoading(false)
    }
  }

  // ── Derived data ────────────────────────────────────────────────────────────

  const activeLeads = useMemo(() => {
    let list = leads.filter((l) => l.stage !== 'Closed')
    if (search)        list = list.filter((l) => `${l.business_name} ${l.contact_name} ${l.segment}`.toLowerCase().includes(search.toLowerCase()))
    if (filterStatus)  list = list.filter((l) => l.stage === filterStatus)
    if (filterSegment) list = list.filter((l) => l.segment === filterSegment)
    if (filterSource)  list = list.filter((l) => l.source === filterSource)
    return list
  }, [leads, search, filterStatus, filterSegment, filterSource])

  const closedLeads = useMemo(() => {
    let list = leads.filter((l) => l.stage === 'Closed')
    if (search)        list = list.filter((l) => `${l.business_name} ${l.contact_name} ${l.segment}`.toLowerCase().includes(search.toLowerCase()))
    if (filterSegment) list = list.filter((l) => l.segment === filterSegment)
    return list
  }, [leads, search, filterSegment])

  // ── Lead handlers ───────────────────────────────────────────────────────────

  async function handleLeadSave(values) {
    if (leadModal.mode === 'add') {
      const created = await createLead(values)
      await createLeadActivity(created.id, 'stage_change', `Lead added — ${values.stage || 'Lead'}`)
    } else {
      const prev = leadModal.lead
      await updateLead(leadModal.lead.id, values)
      if (prev.stage !== values.stage) {
        await createLeadActivity(leadModal.lead.id, 'stage_change', `Status: ${prev.stage} → ${values.stage}`)
      }
    }
    setLeadModal({ open: false, mode: 'add', lead: null })
    await loadAll()
  }

  async function handleStatusChange(leadId, newStage, oldStage) {
    if (newStage === oldStage) return

    await updateLead(leadId, { stage: newStage })
    await createLeadActivity(leadId, 'stage_change', `Status: ${oldStage} → ${newStage}`)
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, stage: newStage } : l))

    if (newStage === 'Closed') {
      const lead = leads.find((l) => l.id === leadId)
      if (lead) setConvertModal({ open: true, lead: { ...lead, stage: 'Closed' } })
    }
  }

  async function handleConvert(clientType) {
    const lead = convertModal.lead
    setConvertModal({ open: false, lead: null })

    const client = await createClientRecord({
      business_name:  lead.business_name,
      segment:        lead.segment || '',
      client_type:    clientType,
      client_status:  'Active',
      payment_status: clientType === 'Paid' ? 'Unpaid' : 'Free',
      actual_revenue: 0,
      notes:          lead.notes || '',
    })

    // Link client back to lead
    await updateLead(lead.id, { client_id: client.id })
    await createProductionItem({ client_id: client.id, stage: 'Waiting Assets' })
    await createClientActivity(
      client.id, 'stage_change',
      `Client workspace created from pipeline — lead closed ${new Date().toLocaleDateString('en-PH')}`,
    )
    await addTimelineEntry(client.id, 'client_created', `Client workspace created — ${clientType}`)

    await loadAll()
  }

  async function handleFollowUpSet(leadId, date) {
    await updateLead(leadId, { next_followup_date: date || null })
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, next_followup_date: date } : l))
    if (drawerLead?.id === leadId) setDrawerLead((p) => ({ ...p, next_followup_date: date }))
  }

  function openEdit(lead) {
    setDrawerOpen(false)
    setLeadModal({ open: true, mode: 'edit', lead })
  }

  function openView(lead) {
    setDrawerLead(lead)
    setDrawerOpen(true)
  }

  function openDeleteActive(lead) {
    setDrawerOpen(false)
    setDeleteModal({ open: true, lead, client: null, isClosedRecord: false })
  }

  function openDeleteClosed(lead, client) {
    setDeleteModal({ open: true, lead, client: client || null, isClosedRecord: true })
  }

  async function confirmDelete() {
    const { lead, client, isClosedRecord } = deleteModal
    setDeleteModal({ open: false, lead: null, client: null, isClosedRecord: false })
    if (!lead) return

    if (isClosedRecord && client) {
      // Delete client workspace (cascades to all workspace tables)
      await deleteClientRecord(client.id)
    }
    await deleteLead(lead.id)
    await loadAll()
  }

  // ─────────────────────────────────────────────────────────────────────────

  if (loading) return <LoadingState message="Loading pipeline…" />

  return (
    <>
      <PageContainer className="max-w-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-[#1a1a2e] tracking-tight">Pipeline</h1>
            <p className="text-sm text-[#9ca3af] mt-0.5">
              {activeLeads.length} active · {closedLeads.length} closed
            </p>
          </div>
          <Button
            onClick={() => setLeadModal({ open: true, mode: 'add', lead: null })}
            className="bg-[#e879a0] hover:bg-[#d4648a] text-white gap-1.5"
          >
            <PlusIcon size={14} /> Add Lead
          </Button>
        </div>

        {/* Metrics */}
        <PipelineMetrics leads={leads} />

        {/* View tabs */}
        <div className="flex items-center gap-1 bg-[#f9f0f5] rounded-lg p-1 w-fit mb-5">
          {[
            { id: 'active', label: 'Active Pipeline' },
            { id: 'closed', label: `Closed${closedLeads.length > 0 ? ` (${closedLeads.length})` : ''}` },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                view === t.id ? 'bg-white text-[#e879a0] shadow-sm' : 'text-[#9ca3af] hover:text-[#6b7280]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search + filters */}
        <SearchFilterBar
          search={search}
          onSearch={setSearch}
          filterStatus={filterStatus}
          onFilterStatus={setFilterStatus}
          filterSegment={filterSegment}
          onFilterSegment={setFilterSegment}
          filterSource={filterSource}
          onFilterSource={setFilterSource}
          view={view}
        />

        {/* Tables */}
        {view === 'active' ? (
          <ActivePipelineTable
            leads={activeLeads}
            onView={openView}
            onEdit={openEdit}
            onDelete={openDeleteActive}
            onStatusChange={handleStatusChange}
          />
        ) : (
          <ClosedTable
            leads={closedLeads}
            clients={clients}
            onDelete={openDeleteClosed}
          />
        )}
      </PageContainer>

      {/* Lead form modal */}
      <LeadForm
        open={leadModal.open}
        mode={leadModal.mode}
        lead={leadModal.lead}
        onSave={handleLeadSave}
        onClose={() => setLeadModal({ ...leadModal, open: false })}
      />

      {/* Record detail drawer */}
      <LeadDrawer
        open={drawerOpen}
        lead={drawerLead}
        onClose={() => setDrawerOpen(false)}
        onEdit={openEdit}
        onDelete={openDeleteActive}
        onStageChange={handleStatusChange}
        onFollowUpSet={handleFollowUpSet}
      />

      {/* Convert to Client */}
      {convertModal.open && (
        <ConvertToClientModal
          lead={convertModal.lead}
          onConvert={handleConvert}
          onCancel={() => setConvertModal({ open: false, lead: null })}
        />
      )}

      {/* Delete confirmation */}
      {deleteModal.open && (
        <DeleteModal
          item={deleteModal}
          isClosedRecord={deleteModal.isClosedRecord}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteModal({ open: false, lead: null, client: null, isClosedRecord: false })}
        />
      )}
    </>
  )
}
