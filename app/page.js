'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import PageContainer from '@/components/shared/PageContainer'
import MetricCard from '@/components/shared/MetricCard'
import SectionHeader from '@/components/shared/SectionHeader'
import LoadingState from '@/components/shared/LoadingState'
import { getSettings } from '@/services/settings'
import { getLeads } from '@/services/leads'
import { getClients } from '@/services/clients'
import { getProductionItems } from '@/services/production'
import { getPersonalStates } from '@/services/personalStates'
import { getOriStates } from '@/services/oriStates'
import { getEvents } from '@/services/events'
import { formatPHP } from '@/lib/currency'
import {
  findCriticalSignal,
  generateActionRecommendations,
  generateContentRecommendations,
  scoreColor, scoreLabel,
} from '@/lib/stateEngine'

export default function DashboardPage() {
  const [settings,      setSettings]      = useState(null)
  const [leads,         setLeads]         = useState([])
  const [clients,       setClients]       = useState([])
  const [production,    setProduction]    = useState([])
  const [personalSnaps, setPersonalSnaps] = useState([])
  const [oriSnaps,      setOriSnaps]      = useState([])
  const [events,        setEvents]        = useState([])
  const [loading,       setLoading]       = useState(true)

  useEffect(() => {
    Promise.all([
      getSettings().catch(() => null),
      getLeads().catch(() => []),
      getClients().catch(() => []),
      getProductionItems().catch(() => []),
      getPersonalStates().catch(() => []),
      getOriStates().catch(() => []),
      getEvents().catch(() => []),
    ]).then(([s, l, c, p, ps, os, ev]) => {
      setSettings(s)
      setLeads(l ?? [])
      setClients(c ?? [])
      setProduction(p ?? [])
      setPersonalSnaps(ps ?? [])
      setOriSnaps(os ?? [])
      setEvents(ev ?? [])
      setLoading(false)
    })
  }, [])

  if (loading) return <LoadingState message="Loading dashboard..." />

  const goal           = settings?.revenue_goal    ?? 0
  const daysLeft       = settings?.days_remaining  ?? 0
  const currentFocus   = settings?.current_focus   ?? 'Not set'

  // Revenue computed from actual client payments only
  const currentRevenue = clients.filter(c => c.client_type === 'Paid Client').reduce((s, c) => s + (Number(c.actual_revenue) || 0), 0)
  const remaining      = Math.max(0, goal - currentRevenue)
  const perDay         = daysLeft > 0 ? Math.ceil(remaining / daysLeft) : 0
  const pct            = goal > 0 ? Math.min(100, Math.round((currentRevenue / goal) * 100)) : 0

  // State engine
  const personalSnap   = personalSnaps[0] ?? null
  const oriSnap        = oriSnaps[0]      ?? null
  const criticalSignal = findCriticalSignal(personalSnap, oriSnap)
  const topAction      = generateActionRecommendations(personalSnap, oriSnap)[0] ?? null
  const topContent     = generateContentRecommendations(personalSnap, oriSnap, events)[0] ?? null

  // Pipeline stage counts
  const stageCounts = leads.reduce((acc, l) => {
    const s = l.stage || 'Prospect'
    acc[s] = (acc[s] || 0) + 1
    return acc
  }, {})

  const overdueCt = leads.filter((l) => {
    if (!l.next_followup_date || l.stage === 'Closed' || l.stage === 'Lost') return false
    const d = new Date(l.next_followup_date); d.setHours(0, 0, 0, 0)
    const today = new Date(); today.setHours(0, 0, 0, 0)
    return d < today
  }).length

  return (
    <PageContainer>
      <SectionHeader
        title="Dashboard"
        description="Your 18-day revenue sprint at a glance."
      />

      {/* Revenue metrics */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        <MetricCard label="Revenue Goal"     value={formatPHP(goal)} />
        <MetricCard label="Current Revenue"  value={formatPHP(currentRevenue)} sub="actual payments received" />
        <MetricCard label="Remaining"        value={formatPHP(remaining)} accent />
        <MetricCard label="Days Left"        value={daysLeft} sub={daysLeft > 0 ? `${formatPHP(perDay)}/day needed` : 'sprint complete'} />
      </div>

      {/* Revenue progress bar */}
      <div className="rounded-xl border border-[#f0e8ee] bg-[#fdf2f6]/50 px-6 py-5 mb-5">
        <div className="flex items-end justify-between mb-2">
          <div>
            <p className="text-xs text-[#9ca3af] mb-0.5">Sprint Progress</p>
            <p className="text-base font-semibold text-[#1a1a2e]">
              {formatPHP(currentRevenue)}
              <span className="text-sm font-normal text-[#9ca3af] ml-1">/ {formatPHP(goal)}</span>
            </p>
          </div>
          <p className="text-2xl font-bold text-[#e879a0]">{pct}%</p>
        </div>
        <div className="h-3 rounded-full bg-[#fce4ed] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#86efac] transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Pipeline + follow-up snapshot */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        <MetricCard label="Total Leads"   value={leads.length}                    sub="in pipeline" />
        <MetricCard label="Interested"    value={stageCounts.Interested  || 0}   sub="high priority" />
        <MetricCard label="Qualified"     value={stageCounts.Qualified   || 0}   sub="ready to close" />
        <MetricCard
          label="Follow-Ups Due"
          value={overdueCt}
          sub="overdue"
          accent={overdueCt > 0}
        />
      </div>

      {/* Stage breakdown row */}
      <div className="rounded-xl border border-[#f0e8ee] bg-white px-6 py-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Pipeline Stages</p>
          <Link href="/pipeline" className="text-xs text-[#e879a0] hover:underline">View Pipeline →</Link>
        </div>
        <div className="grid grid-cols-8 gap-2">
          {['Prospect','Contacted','Replied','Interested','Qualified','Proposal','Closed','Lost'].map((stage) => (
            <div key={stage} className="text-center">
              <p className="text-lg font-bold text-[#1a1a2e]">{stageCounts[stage] || 0}</p>
              <p className="text-[10px] text-[#9ca3af]">{stage}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Production widgets */}
      {(() => {
        const inProd      = production.filter((i) => ['Script','Production'].includes(i.stage)).length
        const waiting     = production.filter((i) => i.stage === 'Waiting Assets').length
        const reviews     = production.filter((i) => i.stage === 'Review').length
        const testimNeeded = production.filter((i) => i.stage === 'Delivered' && i.clients?.testimonial_status === 'Not Requested').length
        const activeClients = clients.filter((c) => !['Completed'].includes(c.client_status) && c.client_type === 'Paid Client').length
        return (
          <div className="rounded-xl border border-[#f0e8ee] bg-white px-6 py-4 mb-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Fulfillment</p>
              <div className="flex gap-3">
                <Link href="/clients" className="text-xs text-[#e879a0] hover:underline">Clients →</Link>
                <Link href="/production" className="text-xs text-[#e879a0] hover:underline">Production →</Link>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {[
                { label: 'Active Clients',    value: activeClients },
                { label: 'In Production',     value: inProd },
                { label: 'Waiting Assets',    value: waiting,  accent: waiting > 0 },
                { label: 'In Review',         value: reviews },
                { label: 'Testimonials Needed', value: testimNeeded, accent: testimNeeded > 0 },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className={`text-2xl font-bold ${s.accent ? 'text-[#e879a0]' : 'text-[#1a1a2e]'}`}>{s.value}</p>
                  <p className="text-[10px] text-[#9ca3af]">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* Current focus */}
      <div className="rounded-xl border border-[#f0e8ee] bg-[#fdf2f6]/50 px-6 py-4 mb-5">
        <p className="text-xs text-[#9ca3af] mb-1">Current Focus</p>
        <p className="text-sm font-medium text-[#1a1a2e]">{currentFocus}</p>
      </div>

      {/* State Engine signals */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">State Engine</p>
        <Link href="/content-os" className="text-xs text-[#e879a0] hover:underline">Full Analysis →</Link>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {/* Weakest signal */}
        <div className="bg-white rounded-xl border border-[#f0e8ee] p-4">
          <p className="text-[11px] text-[#9ca3af] uppercase tracking-wide mb-2">Weakest Signal</p>
          {criticalSignal ? (() => {
            const c = scoreColor(criticalSignal.value)
            return (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl font-bold" style={{ color: c.text }}>{criticalSignal.value}</span>
                  <span className="text-sm font-semibold text-[#1a1a2e]">{criticalSignal.label}</span>
                </div>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: c.bg, color: c.text }}>
                  {scoreLabel(criticalSignal.value)} · {criticalSignal.kind === 'personal' ? 'Personal' : 'Ori'}
                </span>
              </>
            )
          })() : (
            <Link href="/personal-state" className="text-xs text-[#e879a0] hover:underline">Submit first review →</Link>
          )}
        </div>

        {/* Top action */}
        <div className="bg-white rounded-xl border border-[#f0e8ee] p-4">
          <p className="text-[11px] text-[#9ca3af] uppercase tracking-wide mb-2">Recommended Action</p>
          {topAction ? (
            <>
              <p className="text-sm font-semibold text-[#1a1a2e] leading-snug mb-1">{topAction.action}</p>
              <p className="text-xs text-[#9ca3af]">{topAction.metric} is low ({topAction.value}/10)</p>
            </>
          ) : (
            <p className="text-xs text-[#c4b5c0]">No weak signals detected.</p>
          )}
        </div>

        {/* Top content */}
        <div className="bg-white rounded-xl border border-[#f0e8ee] p-4">
          <p className="text-[11px] text-[#9ca3af] uppercase tracking-wide mb-2">Recommended Content</p>
          {topContent ? (
            <>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={
                  topContent.platform === 'Personal'
                    ? { backgroundColor: '#fce4ed', color: '#e879a0' }
                    : { backgroundColor: '#dbeafe', color: '#3b82f6' }
                }>
                  {topContent.platform}
                </span>
              </div>
              <p className="text-sm font-semibold text-[#1a1a2e]">{topContent.category}</p>
              <p className="text-xs text-[#9ca3af] mt-0.5">{topContent.reason}</p>
            </>
          ) : (
            <p className="text-xs text-[#c4b5c0]">No content gaps detected.</p>
          )}
        </div>
      </div>
    </PageContainer>
  )
}
