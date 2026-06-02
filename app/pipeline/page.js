'use client'

import { useEffect, useMemo, useState } from 'react'
import PageContainer from '@/components/shared/PageContainer'
import LoadingState from '@/components/shared/LoadingState'
import PipelineBoard from '@/components/pipeline/PipelineBoard'
import LeadForm from '@/components/pipeline/LeadForm'
import LeadDrawer from '@/components/pipeline/LeadDrawer'
import FollowUpCenter from '@/components/pipeline/FollowUpCenter'
import RevenueGoalWidget from '@/components/revenue/RevenueGoalWidget'
import ClientForm from '@/components/revenue/ClientForm'
import { Button } from '@/components/ui/button'
import { getLeads, createLead, updateLead, deleteLead } from '@/services/leads'
import { getClients, createClientRecord, updateClientRecord, deleteClientRecord } from '@/services/clients'
import { createProductionItem } from '@/services/production'
import { getSettings } from '@/services/settings'
import { createLeadActivity } from '@/services/leadActivities'
import { createClientActivity } from '@/services/clientActivities'
import { computePriority, STAGE_COLORS, PAYMENT_STATUSES } from '@/lib/pipelineConfig'
import { formatPHP } from '@/lib/currency'
import { PlusIcon, Trash2Icon, PencilIcon } from 'lucide-react'

// ── Pipeline metrics ─────────────────────────────────────────────────────────
function PipelineStats({ leads }) {
  const counts = {
    Prospect:  0, Contacted: 0, Replied: 0, Interested: 0,
    Qualified: 0, Proposal:  0, Closed:  0, Lost:       0,
  }
  for (const l of leads) counts[l.stage || 'Prospect'] = (counts[l.stage || 'Prospect'] || 0) + 1

  const stats = [
    { label: 'Total Leads',  value: leads.length },
    { label: 'Replies',      value: counts.Replied },
    { label: 'Interested',   value: counts.Interested },
    { label: 'Qualified',    value: counts.Qualified },
    { label: 'Closed',       value: counts.Closed, accent: true },
  ]

  const replyRate    = counts.Contacted > 0 ? Math.round((counts.Replied    / counts.Contacted)  * 100) : 0
  const interestRate = counts.Replied   > 0 ? Math.round((counts.Interested / counts.Replied)    * 100) : 0
  const closeRate    = counts.Qualified > 0 ? Math.round((counts.Closed     / counts.Qualified)  * 100) : 0

  return (
    <div className="grid grid-cols-8 gap-3 mb-6">
      {stats.map((s) => (
        <div key={s.label} className="col-span-1 bg-white rounded-xl border border-[#f0e8ee] p-3 text-center">
          <p className="text-xs text-[#9ca3af] mb-1 leading-tight">{s.label}</p>
          <p className={`text-xl font-bold ${s.accent ? 'text-[#16a34a]' : 'text-[#1a1a2e]'}`}>{s.value}</p>
        </div>
      ))}
      <div className="bg-white rounded-xl border border-[#f0e8ee] p-3 text-center">
        <p className="text-xs text-[#9ca3af] mb-1 leading-tight">Reply Rate</p>
        <p className="text-xl font-bold text-[#1a1a2e]">{replyRate}%</p>
      </div>
      <div className="bg-white rounded-xl border border-[#f0e8ee] p-3 text-center">
        <p className="text-xs text-[#9ca3af] mb-1 leading-tight">Interest Rate</p>
        <p className="text-xl font-bold text-[#1a1a2e]">{interestRate}%</p>
      </div>
      <div className="bg-white rounded-xl border border-[#f0e8ee] p-3 text-center">
        <p className="text-xs text-[#9ca3af] mb-1 leading-tight">Close Rate</p>
        <p className="text-xl font-bold text-[#16a34a]">{closeRate}%</p>
      </div>
    </div>
  )
}

// ── Revenue tab ───────────────────────────────────────────────────────────────
const paymentColors = {
  Paid:    { bg: '#dcfce7', text: '#16a34a' },
  Partial: { bg: '#fef3c7', text: '#d97706' },
  Unpaid:  { bg: '#fee2e2', text: '#ef4444' },
  Free:    { bg: '#f1f5f9', text: '#64748b' },
}

function RevenueTab({ clients, settings, onAddClient, onEditClient, onDeleteClient }) {
  const goal    = settings?.revenue_goal    ?? 0
  const daysLeft = settings?.days_remaining ?? 0
  const current = clients.filter(c => c.client_type === 'Paid Client').reduce((s, c) => s + (Number(c.actual_revenue) || 0), 0)

  return (
    <div>
      <RevenueGoalWidget goal={goal} current={current} daysLeft={daysLeft} />

      {/* Client list */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#1a1a2e]">Clients — Actual Revenue</h3>
        <Button onClick={onAddClient} className="bg-[#e879a0] hover:bg-[#d4648a] text-white gap-1.5" size="sm">
          <PlusIcon size={13} /> Add Client
        </Button>
      </div>

      {clients.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#f0e8ee] py-12 text-center">
          <p className="text-sm text-[#9ca3af]">No clients yet.</p>
          <p className="text-xs text-[#c4b5c0] mt-1">Add your first closed client to track revenue.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#f0e8ee] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#f0e8ee] bg-[#fafafa]">
                {['Business', 'Segment', 'Package', 'Quoted', 'Actual Revenue', 'Status', 'Notes', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map((c, i) => {
                const pc = paymentColors[c.payment_status] || paymentColors.Unpaid
                return (
                  <tr key={c.id} className={`border-b border-[#f9f0f5] hover:bg-[#fdf7fb] ${i === clients.length - 1 ? 'border-b-0' : ''}`}>
                    <td className="px-4 py-3 font-medium text-[#1a1a2e]">{c.business_name}</td>
                    <td className="px-4 py-3 text-xs text-[#6b7280]">{c.segment || '—'}</td>
                    <td className="px-4 py-3 text-xs text-[#6b7280]">{c.package_name || '—'}</td>
                    <td className="px-4 py-3 text-xs text-[#9ca3af]">{c.price != null ? formatPHP(c.price) : '—'}</td>
                    <td className="px-4 py-3 font-semibold text-[#16a34a]">{formatPHP(c.actual_revenue)}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-md font-medium" style={{ backgroundColor: pc.bg, color: pc.text }}>
                        {c.payment_status || 'Unpaid'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#9ca3af] max-w-[160px] truncate">{c.revenue_notes || '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button onClick={() => onEditClient(c)} className="p-1 rounded hover:bg-[#dbeafe]/60 text-[#9ca3af] hover:text-[#3b82f6] transition-colors">
                          <PencilIcon size={13} />
                        </button>
                        <button onClick={() => onDeleteClient(c.id)} className="p-1 rounded hover:bg-[#fee2e2]/60 text-[#9ca3af] hover:text-[#ef4444] transition-colors">
                          <Trash2Icon size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[#f0e8ee] bg-[#fdf7fb]">
                <td colSpan={4} className="px-4 py-3 text-xs font-semibold text-[#9ca3af]">Total</td>
                <td className="px-4 py-3 font-bold text-[#16a34a]">{formatPHP(current)}</td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Tab bar ───────────────────────────────────────────────────────────────────
function TabBar({ active, onChange, overdueCt }) {
  const tabs = [
    { id: 'pipeline', label: 'Pipeline' },
    { id: 'followup', label: `Follow-Up${overdueCt > 0 ? ` (${overdueCt})` : ''}` },
    { id: 'revenue',  label: 'Revenue' },
  ]
  return (
    <div className="flex items-center gap-1 bg-[#f9f0f5] rounded-lg p-1 w-fit mb-6">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
            active === t.id ? 'bg-white text-[#e879a0] shadow-sm' : 'text-[#9ca3af] hover:text-[#6b7280]'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

// ── Delete Lead modal ─────────────────────────────────────────────────────────
function DeleteLeadModal({ lead, onConfirm, onCancel }) {
  if (!lead) return null
  const wasConverted = lead.stage === 'Closed'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-[#f0e8ee] w-full max-w-sm mx-4 p-6">
        <h2 className="text-base font-semibold text-[#1a1a2e] mb-1">Delete Lead?</h2>
        <p className="text-sm font-medium text-[#4b5563] mb-4">{lead.business_name}</p>

        {wasConverted && (
          <div className="bg-[#fef3c7] border border-[#fde68a] rounded-lg px-3 py-2.5 mb-3">
            <p className="text-xs font-semibold text-[#d97706] mb-0.5">This lead was converted to a client.</p>
            <p className="text-xs text-[#d97706]">Deleting this lead will NOT delete the client record, production record, or revenue. Those remain untouched.</p>
          </div>
        )}

        <div className="bg-[#fff5f5] rounded-lg border border-[#fecaca] px-3 py-2.5 mb-5 space-y-0.5">
          <p className="text-xs font-medium text-[#ef4444]">This will permanently remove:</p>
          {['Lead Record', 'Lead Notes', 'Follow-Up History', 'Lead Timeline'].map((item) => (
            <p key={item} className="text-xs text-[#ef4444]">— {item}</p>
          ))}
          <p className="text-xs font-semibold text-[#ef4444] mt-1">This cannot be undone.</p>
        </div>

        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 h-9 text-sm text-[#6b7280] border border-[#f0e8ee] rounded-lg hover:bg-[#f9f0f5] transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 h-9 text-sm font-semibold text-white bg-[#ef4444] rounded-lg hover:bg-[#dc2626] transition-colors">
            Delete Lead
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
        <h2 className="text-base font-semibold text-[#1a1a2e] mb-1">Create Client?</h2>
        <p className="text-sm font-medium text-[#4b5563] mb-0.5">{lead.business_name}</p>
        {lead.segment && <p className="text-xs text-[#9ca3af] mb-4">{lead.segment}</p>}

        <p className="text-sm text-[#6b7280] mb-4">
          Lead moved to Closed. Create a client record to start production tracking?
        </p>

        <div className="space-y-2 mb-5">
          <button
            onClick={() => onConvert('Paid Client')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] hover:bg-[#dcfce7] transition-colors text-left"
          >
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-[#16a34a]" />
            <div>
              <p className="text-sm font-semibold text-[#16a34a]">Paid Client</p>
              <p className="text-xs text-[#9ca3af]">Actual revenue tracked · Payment status: Unpaid</p>
            </div>
          </button>

          <button
            onClick={() => onConvert('Free Sample')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[#fde68a] bg-[#fefce8] hover:bg-[#fef3c7] transition-colors text-left"
          >
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-[#d97706]" />
            <div>
              <p className="text-sm font-semibold text-[#d97706]">Free Sample</p>
              <p className="text-xs text-[#9ca3af]">Actual revenue = ₱0 · Payment status: Free</p>
            </div>
          </button>
        </div>

        <button
          onClick={onCancel}
          className="w-full text-sm text-[#9ca3af] hover:text-[#6b7280] transition-colors py-1"
        >
          Cancel — skip client creation
        </button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PipelinePage() {
  const [leads,    setLeads]    = useState([])
  const [clients,  setClients]  = useState([])
  const [settings, setSettings] = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState('pipeline')

  const [leadModal,     setLeadModal]     = useState({ open: false, mode: 'add', lead: null })
  const [clientModal,   setClientModal]   = useState({ open: false, mode: 'add', client: null })
  const [convertModal,  setConvertModal]  = useState({ open: false, lead: null })
  const [deleteModal,   setDeleteModal]   = useState({ open: false, lead: null })
  const [drawerLead,    setDrawerLead]    = useState(null)
  const [drawerOpen,    setDrawerOpen]    = useState(false)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [l, c, s] = await Promise.all([
        getLeads().catch(() => []),
        getClients().catch(() => []),
        getSettings().catch(() => null),
      ])
      setLeads(l ?? [])
      setClients(c ?? [])
      setSettings(s)
    } finally {
      setLoading(false)
    }
  }

  // ── Lead handlers ─────────────────────────────────────────────────────────

  async function handleLeadSave(values) {
    if (leadModal.mode === 'add') {
      const created = await createLead(values)
      await createLeadActivity(created.id, 'stage_change', `Lead created in ${values.stage || 'Prospect'}`)
    } else {
      await updateLead(leadModal.lead.id, values)
    }
    setLeadModal({ open: false, mode: 'add', lead: null })
    await loadAll()
  }

  async function handleStageChange(leadId, newStage, oldStage) {
    await updateLead(leadId, { stage: newStage })
    await createLeadActivity(leadId, 'stage_change', `Stage changed: ${oldStage} → ${newStage}`)
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, stage: newStage } : l))
    if (drawerLead?.id === leadId) setDrawerLead((prev) => ({ ...prev, stage: newStage }))

    if (newStage === 'Closed') {
      const lead = leads.find((l) => l.id === leadId)
      if (lead) setConvertModal({ open: true, lead })
    }
  }

  async function handleConvert(clientType) {
    const lead = convertModal.lead
    setConvertModal({ open: false, lead: null })

    const created = await createClientRecord({
      business_name:  lead.business_name,
      segment:        lead.segment || '',
      client_type:    clientType,
      client_status:  'Active',
      payment_status: clientType === 'Free Sample' ? 'Free' : 'Unpaid',
      actual_revenue: 0,
      notes:          lead.notes || '',
    })

    await createProductionItem({ client_id: created.id, stage: 'Waiting Assets' })
    await createClientActivity(
      created.id, 'stage_change',
      `Client created from pipeline — lead closed on ${new Date().toLocaleDateString('en-PH')}`,
    )

    await loadAll()
  }

  async function handleFollowUpSet(leadId, date) {
    await updateLead(leadId, { next_followup_date: date || null })
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, next_followup_date: date } : l))
    if (drawerLead?.id === leadId) setDrawerLead((prev) => ({ ...prev, next_followup_date: date }))
  }

  function openDeleteModal(lead) {
    setDrawerOpen(false)
    setDeleteModal({ open: true, lead })
  }

  async function confirmLeadDelete() {
    const id = deleteModal.lead?.id
    setDeleteModal({ open: false, lead: null })
    if (!id) return
    await deleteLead(id)
    await loadAll()
  }

  function openLeadDrawer(lead) {
    setDrawerLead(lead)
    setDrawerOpen(true)
  }

  function openAddNote(lead) {
    setDrawerLead(lead)
    setDrawerOpen(true)
  }

  function openScheduleFollowUp(lead) {
    setDrawerLead(lead)
    setDrawerOpen(true)
  }

  function openEditLead(lead) {
    setDrawerOpen(false)
    setLeadModal({ open: true, mode: 'edit', lead })
  }

  // ── Client handlers ───────────────────────────────────────────────────────

  async function handleClientSave(values) {
    if (clientModal.mode === 'add') {
      await createClientRecord(values)
    } else {
      await updateClientRecord(clientModal.client.id, values)
    }
    setClientModal({ open: false, mode: 'add', client: null })
    await loadAll()
  }

  async function handleClientDelete(id) {
    if (!confirm('Delete this client record? This cannot be undone.')) return
    await deleteClientRecord(id)
    await loadAll()
  }

  // ── Overdue count for tab badge ───────────────────────────────────────────
  const overdueCt = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    return leads.filter((l) => {
      if (!l.next_followup_date || l.stage === 'Closed' || l.stage === 'Lost') return false
      const d = new Date(l.next_followup_date); d.setHours(0, 0, 0, 0)
      return d < today
    }).length
  }, [leads])

  if (loading) return <LoadingState message="Loading pipeline..." />

  return (
    <>
      <PageContainer className="max-w-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-[#1a1a2e] tracking-tight">Pipeline</h1>
            <p className="text-sm text-[#9ca3af] mt-0.5">
              {leads.length} lead{leads.length !== 1 ? 's' : ''} · {clients.length} client{clients.length !== 1 ? 's' : ''}
              {overdueCt > 0 && <span className="text-[#ef4444] font-medium ml-2">· {overdueCt} overdue follow-up{overdueCt !== 1 ? 's' : ''}</span>}
            </p>
          </div>
          <Button onClick={() => setLeadModal({ open: true, mode: 'add', lead: null })} className="bg-[#e879a0] hover:bg-[#d4648a] text-white gap-1.5">
            <PlusIcon size={14} /> Add Lead
          </Button>
        </div>

        {/* Pipeline stats (always visible) */}
        <PipelineStats leads={leads} />

        {/* Tab bar */}
        <TabBar active={tab} onChange={setTab} overdueCt={overdueCt} />

        {/* Tab content */}
        {tab === 'pipeline' && (
          <PipelineBoard
            leads={leads}
            onView={openLeadDrawer}
            onStageChange={handleStageChange}
            onAddNote={openAddNote}
            onScheduleFollowUp={openScheduleFollowUp}
            onEdit={openEditLead}
            onDelete={openDeleteModal}
          />
        )}

        {tab === 'followup' && (
          <FollowUpCenter leads={leads} onView={openLeadDrawer} />
        )}

        {tab === 'revenue' && (
          <RevenueTab
            clients={clients}
            settings={settings}
            onAddClient={() => setClientModal({ open: true, mode: 'add', client: null })}
            onEditClient={(c) => setClientModal({ open: true, mode: 'edit', client: c })}
            onDeleteClient={handleClientDelete}
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

      {/* Client form modal */}
      <ClientForm
        open={clientModal.open}
        mode={clientModal.mode}
        client={clientModal.client}
        onSave={handleClientSave}
        onClose={() => setClientModal({ ...clientModal, open: false })}
      />

      {/* Lead detail drawer */}
      <LeadDrawer
        open={drawerOpen}
        lead={drawerLead}
        onClose={() => setDrawerOpen(false)}
        onEdit={openEditLead}
        onDelete={openDeleteModal}
        onStageChange={handleStageChange}
        onFollowUpSet={handleFollowUpSet}
      />

      {/* Convert to client modal */}
      {convertModal.open && (
        <ConvertToClientModal
          lead={convertModal.lead}
          onConvert={handleConvert}
          onCancel={() => setConvertModal({ open: false, lead: null })}
        />
      )}

      {/* Delete lead modal */}
      {deleteModal.open && (
        <DeleteLeadModal
          lead={deleteModal.lead}
          onConfirm={confirmLeadDelete}
          onCancel={() => setDeleteModal({ open: false, lead: null })}
        />
      )}
    </>
  )
}
