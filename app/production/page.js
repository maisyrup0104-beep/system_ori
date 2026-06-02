'use client'

import { useEffect, useMemo, useState } from 'react'
import PageContainer from '@/components/shared/PageContainer'
import LoadingState from '@/components/shared/LoadingState'
import ProductionBoard from '@/components/production/ProductionBoard'
import ClientProfile from '@/components/clients/ClientProfile'
import { getProductionItems, updateProductionItem } from '@/services/production'
import { getClients, updateClientRecord } from '@/services/clients'
import { createClientActivity } from '@/services/clientActivities'
import { PRODUCTION_STAGES, isWaitingTooLong, isDeliveryAtRisk } from '@/lib/clientsConfig'

// ── Production metrics ────────────────────────────────────────────────────────
function ProductionMetrics({ items }) {
  const counts = PRODUCTION_STAGES.reduce((acc, s) => {
    acc[s] = items.filter((i) => (i.stage || 'Waiting Assets') === s).length
    return acc
  }, {})

  const warnings = items.filter((i) => isWaitingTooLong(i) || isDeliveryAtRisk({ ...i, delivery_date: i.clients?.delivery_date ?? i.delivery_date })).length
  const testimNeeded = items.filter((i) => i.stage === 'Delivered' && i.clients?.testimonial_status === 'Not Requested').length

  const stats = [
    { label: 'Waiting Assets',  value: counts['Waiting Assets'] },
    { label: 'In Production',   value: (counts['Script'] || 0) + (counts['Production'] || 0) },
    { label: 'In Review',       value: counts['Review'] },
    { label: 'Delivered',       value: counts['Delivered'] },
    { label: 'Testimonial',     value: counts['Testimonial'] },
    { label: 'Needs Attention', value: warnings + testimNeeded, accent: (warnings + testimNeeded) > 0 },
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

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ProductionPage() {
  const [items,    setItems]    = useState([])
  const [clients,  setClients]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [profile,  setProfile]  = useState({ open: false, client: null })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const [items, cls] = await Promise.all([
        getProductionItems().catch(() => []),
        getClients().catch(() => []),
      ])
      setItems(items ?? [])
      setClients(cls ?? [])
    } finally {
      setLoading(false)
    }
  }

  async function handleStageChange(itemId, newStage, oldStage, clientId) {
    await updateProductionItem(itemId, { stage: newStage })
    await createClientActivity(clientId, 'stage_change', `Production: ${oldStage} → ${newStage}`)
    setItems((prev) => prev.map((i) => i.id === itemId ? { ...i, stage: newStage } : i))

    // Update client status to match production stage
    const statusMap = {
      'Waiting Assets': 'Waiting Assets',
      'Script':         'In Production',
      'Production':     'In Production',
      'Review':         'Review',
      'Delivered':      'Delivered',
      'Testimonial':    'Delivered',
    }
    const newClientStatus = statusMap[newStage]
    if (newClientStatus) {
      await updateClientRecord(clientId, { client_status: newClientStatus })
      setClients((prev) => prev.map((c) => c.id === clientId ? { ...c, client_status: newClientStatus } : c))
    }
  }

  function openClientProfile(item) {
    const client = clients.find((c) => c.id === item.clients?.id) || null
    if (client) setProfile({ open: true, client })
  }

  async function handleChecklistChange(clientId, key, checked) {
    const client = clients.find((c) => c.id === clientId)
    const updated = { ...(client?.asset_checklist || {}), [key]: checked }
    await updateClientRecord(clientId, { asset_checklist: updated })
    setClients((prev) => prev.map((c) => c.id === clientId ? { ...c, asset_checklist: updated } : c))
    setProfile((prev) => prev.client?.id === clientId
      ? { ...prev, client: { ...prev.client, asset_checklist: updated } }
      : prev)
  }

  async function handleTestimonialChange(clientId, value) {
    await updateClientRecord(clientId, { testimonial_status: value })
    setClients((prev) => prev.map((c) => c.id === clientId ? { ...c, testimonial_status: value } : c))
    // Update profile's live data
    setProfile((prev) => prev.client?.id === clientId
      ? { ...prev, client: { ...prev.client, testimonial_status: value } }
      : prev)
    // Also update the embedded clients on items
    setItems((prev) => prev.map((i) =>
      i.clients?.id === clientId
        ? { ...i, clients: { ...i.clients, testimonial_status: value } }
        : i
    ))
  }

  // Enrich items with full client data for profile
  const enrichedProfile = useMemo(() => {
    if (!profile.client) return profile
    const full = clients.find((c) => c.id === profile.client.id) || profile.client
    return { ...profile, client: full }
  }, [profile, clients])

  if (loading) return <LoadingState message="Loading production..." />

  return (
    <>
      <PageContainer className="max-w-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-[#1a1a2e] tracking-tight">Production</h1>
          <p className="text-sm text-[#9ca3af] mt-0.5">
            {items.length} project{items.length !== 1 ? 's' : ''} in the production pipeline.
          </p>
        </div>

        {/* Metrics */}
        <ProductionMetrics items={items} />

        {/* Board */}
        {items.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#f0e8ee] py-16 text-center">
            <p className="text-sm text-[#9ca3af]">No production projects yet.</p>
            <p className="text-xs text-[#c4b5c0] mt-1">Add a client from the Clients page to start a project.</p>
          </div>
        ) : (
          <ProductionBoard
            items={items}
            onView={openClientProfile}
            onStageChange={handleStageChange}
          />
        )}
      </PageContainer>

      {/* Client profile drawer */}
      <ClientProfile
        open={enrichedProfile.open}
        client={enrichedProfile.client}
        onClose={() => setProfile({ open: false, client: null })}
        onEdit={() => {}} // edit goes through clients page
        onChecklistChange={handleChecklistChange}
        onTestimonialChange={handleTestimonialChange}
      />
    </>
  )
}
