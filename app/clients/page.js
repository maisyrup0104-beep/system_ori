'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import PageContainer from '@/components/shared/PageContainer'
import LoadingState from '@/components/shared/LoadingState'
import ClientCard from '@/components/clients/ClientCard'
import ClientForm from '@/components/clients/ClientForm'
import ClientProfile from '@/components/clients/ClientProfile'
import { Button } from '@/components/ui/button'
import { getClients, createClientRecord, updateClientRecord, deleteClientRecord } from '@/services/clients'
import { createProductionItem } from '@/services/production'
import { createClientActivity } from '@/services/clientActivities'
import { formatPHP } from '@/lib/currency'
import { PlusIcon } from 'lucide-react'

function isPaid(c) { return c.client_type === 'Paid Client' || c.client_type === 'Paid' }

// ── Metrics row ───────────────────────────────────────────────────────────────
function ClientMetrics({ clients }) {
  const active     = clients.filter((c) => !['Completed'].includes(c.client_status) && isPaid(c)).length
  const inProd     = clients.filter((c) => c.client_status === 'In Production').length
  const waiting    = clients.filter((c) => c.client_status === 'Waiting Assets').length
  const delivered  = clients.filter((c) => ['Delivered', 'Completed'].includes(c.client_status)).length
  const testimonials = clients.filter((c) => c.client_status === 'Delivered' && c.testimonial_status === 'Not Requested').length
  const freeCount  = clients.filter((c) => !isPaid(c)).length

  const stats = [
    { label: 'Active Clients',     value: active,      accent: false },
    { label: 'In Production',      value: inProd,      accent: false },
    { label: 'Waiting Assets',     value: waiting,     accent: waiting > 0 },
    { label: 'Delivered',          value: delivered,   accent: false },
    { label: 'Testimonials Needed',value: testimonials, accent: testimonials > 0 },
    { label: 'Free / Demo',        value: freeCount,   accent: false },
  ]

  return (
    <div className="grid grid-cols-6 gap-3 mb-6">
      {stats.map((s) => (
        <div key={s.label} className="bg-white rounded-xl border border-[#f0e8ee] p-4">
          <p className="text-xs text-[#9ca3af] mb-1 leading-tight">{s.label}</p>
          <p className={`text-2xl font-bold ${s.accent ? 'text-[#e879a0]' : 'text-[#1a1a2e]'}`}>{s.value}</p>
        </div>
      ))}
    </div>
  )
}

// ── Tab bar ───────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'all',        label: 'All' },
  { id: 'active',     label: 'Active' },
  { id: 'free',       label: 'Free / Demo' },
  { id: 'completed',  label: 'Completed' },
]

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ClientsPage() {
  const [clients,  setClients]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState('all')

  const [modal,   setModal]   = useState({ open: false, mode: 'add', client: null })
  const [profile, setProfile] = useState({ open: false, client: null })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try { setClients((await getClients()) || []) }
    catch { /* silent */ }
    finally { setLoading(false) }
  }

  const visible = useMemo(() => {
    switch (tab) {
      case 'active':    return clients.filter((c) => !['Completed'].includes(c.client_status) && isPaid(c))
      case 'free':      return clients.filter((c) => !isPaid(c))
      case 'completed': return clients.filter((c) => c.client_status === 'Completed')
      default:          return clients
    }
  }, [clients, tab])

  // ── Handlers ─────────────────────────────────────────────────────────────

  async function handleSave(values) {
    if (modal.mode === 'add') {
      const created = await createClientRecord(values)
      // Auto-create production item in "Waiting Assets"
      await createProductionItem({ client_id: created.id, stage: 'Waiting Assets' })
      await createClientActivity(created.id, 'stage_change', 'Client added — production started in Waiting Assets')
    } else {
      const prev = modal.client
      await updateClientRecord(modal.client.id, values)
      if (prev.client_status !== values.client_status) {
        await createClientActivity(modal.client.id, 'stage_change', `Status: ${prev.client_status} → ${values.client_status}`)
      }
    }
    setModal({ open: false, mode: 'add', client: null })
    await load()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this client? This cannot be undone.')) return
    await deleteClientRecord(id)
    setProfile({ open: false, client: null })
    await load()
  }

  function openProfile(client) {
    setProfile({ open: true, client })
  }

  function openEdit(client) {
    setProfile({ open: false, client: null })
    setModal({ open: true, mode: 'edit', client })
  }

  async function handleChecklistChange(clientId, key, checked) {
    const client = clients.find((c) => c.id === clientId)
    const current = client?.asset_checklist || {}
    const updated = { ...current, [key]: checked }
    await updateClientRecord(clientId, { asset_checklist: updated })
    setClients((prev) => prev.map((c) => c.id === clientId ? { ...c, asset_checklist: updated } : c))
    setProfile((prev) => prev.client?.id === clientId
      ? { ...prev, client: { ...prev.client, asset_checklist: updated } }
      : prev)
  }

  async function handleTestimonialChange(clientId, value) {
    await updateClientRecord(clientId, { testimonial_status: value })
    setClients((prev) => prev.map((c) => c.id === clientId ? { ...c, testimonial_status: value } : c))
    setProfile((prev) => prev.client?.id === clientId
      ? { ...prev, client: { ...prev.client, testimonial_status: value } }
      : prev)
  }

  if (loading) return <LoadingState message="Loading clients..." />

  return (
    <>
      <PageContainer>
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-[#1a1a2e] tracking-tight">Clients</h1>
            <p className="text-sm text-[#9ca3af] mt-0.5">
              {clients.length} client{clients.length !== 1 ? 's' : ''} · {formatPHP(clients.filter(isPaid).reduce((s, c) => s + (Number(c.actual_revenue) || 0), 0))} actual revenue
            </p>
          </div>
          <Button onClick={() => setModal({ open: true, mode: 'add', client: null })} className="bg-[#e879a0] hover:bg-[#d4648a] text-white gap-1.5">
            <PlusIcon size={14} /> Add Client
          </Button>
        </div>

        {/* Metrics */}
        <ClientMetrics clients={clients} />

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-[#f9f0f5] rounded-lg p-1 w-fit mb-5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === t.id ? 'bg-white text-[#e879a0] shadow-sm' : 'text-[#9ca3af] hover:text-[#6b7280]'}`}
            >
              {t.label}
              {t.id !== 'all' && (
                <span className="ml-1.5 text-[10px]">
                  ({tab === t.id ? visible.length : (
                    t.id === 'active'    ? clients.filter((c) => !['Completed'].includes(c.client_status) && isPaid(c)).length :
                    t.id === 'free'      ? clients.filter((c) => !isPaid(c)).length :
                    t.id === 'completed' ? clients.filter((c) => c.client_status === 'Completed').length : 0
                  )})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Grid */}
        {visible.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#f0e8ee] py-16 text-center">
            <p className="text-sm text-[#9ca3af]">No clients in this view.</p>
            <p className="text-xs text-[#c4b5c0] mt-1">Add your first client to start tracking production.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {visible.map((client) => (
              <div key={client.id} className="flex flex-col gap-1.5">
                <ClientCard client={client} onClick={() => openProfile(client)} />
                <Link
                  href={`/clients/${client.id}`}
                  className="text-center text-xs text-[#e879a0] hover:text-[#d4648a] font-medium py-1 transition-colors"
                >
                  Open Workspace →
                </Link>
              </div>
            ))}
          </div>
        )}
      </PageContainer>

      {/* Modals */}
      <ClientForm
        open={modal.open}
        mode={modal.mode}
        client={modal.client}
        onSave={handleSave}
        onClose={() => setModal({ ...modal, open: false })}
      />
      <ClientProfile
        open={profile.open}
        client={profile.client}
        onClose={() => setProfile({ open: false, client: null })}
        onEdit={openEdit}
        onDelete={handleDelete}
        onChecklistChange={handleChecklistChange}
        onTestimonialChange={handleTestimonialChange}
      />
    </>
  )
}
