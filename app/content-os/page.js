'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import PageContainer from '@/components/shared/PageContainer'
import LoadingState from '@/components/shared/LoadingState'
import ContentRecommendationCard from '@/components/content/ContentRecommendationCard'
import ActionRecommendationCard from '@/components/content/ActionRecommendationCard'
import EvidencePanel from '@/components/content/EvidencePanel'
import { getPersonalStates } from '@/services/personalStates'
import { getOriStates } from '@/services/oriStates'
import { getEvents } from '@/services/events'
import {
  PERSONAL_METRICS, ORI_METRICS,
  findCriticalSignal, findWeakestMetrics,
  generateContentRecommendations, generateActionRecommendations,
  scoreColor, scoreLabel,
} from '@/lib/stateEngine'

// ── Current State Summary ─────────────────────────────────────────────────────
function StateSummaryRow({ personalSnap, oriSnap }) {
  const render = (metrics, snap, href, title) => (
    <Link href={href} className="flex-1 bg-white rounded-xl border border-[#f0e8ee] p-4 hover:border-[#fce4ed] transition-colors">
      <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide mb-3">{title}</p>
      {snap ? (
        <div className="grid grid-cols-4 gap-2">
          {metrics.map((m) => {
            const val = snap[m.key]
            const c   = scoreColor(val)
            return (
              <div key={m.key} className="text-center">
                <p className="text-xl font-bold" style={{ color: c.text }}>{val ?? '—'}</p>
                <p className="text-[10px] text-[#9ca3af]">{m.label}</p>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-xs text-[#c4b5c0]">No review yet → Submit one</p>
      )}
    </Link>
  )

  return (
    <div className="flex gap-3 mb-6">
      {render(PERSONAL_METRICS, personalSnap, '/personal-state', 'Personal State')}
      {render(ORI_METRICS,      oriSnap,      '/ori-state',     'Ori State')}
    </div>
  )
}

// ── Weakest signal banner ─────────────────────────────────────────────────────
function CriticalBanner({ signal }) {
  if (!signal) return null
  const c = scoreColor(signal.value)
  return (
    <div className="flex items-center gap-3 rounded-xl border px-4 py-3 mb-6" style={{ backgroundColor: c.bg, borderColor: c.text + '33' }}>
      <div className="flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: c.text }}>Critical Signal</p>
        <p className="text-sm font-semibold text-[#1a1a2e]">
          {signal.label} is {scoreLabel(signal.value).toLowerCase()} at {signal.value}/10
          <span className="text-[#9ca3af] font-normal ml-2">— {signal.kind === 'personal' ? 'Personal State' : 'Ori State'}</span>
        </p>
      </div>
      <span className="text-3xl font-bold" style={{ color: c.text }}>{signal.value}</span>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ContentOSPage() {
  const [personalSnaps, setPersonalSnaps] = useState([])
  const [oriSnaps,      setOriSnaps]      = useState([])
  const [events,        setEvents]        = useState([])
  const [loading,       setLoading]       = useState(true)

  useEffect(() => {
    Promise.all([
      getPersonalStates().catch(() => []),
      getOriStates().catch(() => []),
      getEvents().catch(() => []),
    ]).then(([ps, os, ev]) => {
      setPersonalSnaps(ps ?? [])
      setOriSnaps(os ?? [])
      setEvents(ev ?? [])
      setLoading(false)
    })
  }, [])

  const personalSnap = personalSnaps[0] ?? null
  const oriSnap      = oriSnaps[0]      ?? null

  const criticalSignal   = useMemo(() => findCriticalSignal(personalSnap, oriSnap), [personalSnap, oriSnap])
  const actionRecs       = useMemo(() => generateActionRecommendations(personalSnap, oriSnap), [personalSnap, oriSnap])
  const contentRecs      = useMemo(() => generateContentRecommendations(personalSnap, oriSnap, events), [personalSnap, oriSnap, events])

  const noState = !personalSnap && !oriSnap

  if (loading) return <LoadingState message="Loading Content OS..." />

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#1a1a2e] tracking-tight">Content OS</h1>
        <p className="text-sm text-[#9ca3af] mt-0.5">
          Recommendations driven by your state reviews and event log.
        </p>
      </div>

      {/* State summary */}
      <StateSummaryRow personalSnap={personalSnap} oriSnap={oriSnap} />

      {noState ? (
        <div className="bg-white rounded-xl border border-[#f0e8ee] py-16 text-center">
          <p className="text-sm text-[#9ca3af]">No state reviews yet.</p>
          <p className="text-xs text-[#c4b5c0] mt-1 mb-4">Submit a Personal State and Ori State review to unlock recommendations.</p>
          <div className="flex justify-center gap-3">
            <Link href="/personal-state" className="text-sm text-[#e879a0] border border-[#fce4ed] rounded-lg px-4 py-2 hover:bg-[#fce4ed]/40 transition-colors">
              Personal State →
            </Link>
            <Link href="/ori-state" className="text-sm text-[#3b82f6] border border-[#dbeafe] rounded-lg px-4 py-2 hover:bg-[#dbeafe]/40 transition-colors">
              Ori State →
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Critical signal banner */}
          <CriticalBanner signal={criticalSignal} />

          {/* Action Recommendations */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-base font-semibold text-[#1a1a2e]">Action Recommendations</h2>
              <span className="text-xs text-[#9ca3af] bg-[#f1f5f9] px-2 py-0.5 rounded-full">Most important</span>
            </div>
            {actionRecs.length === 0 ? (
              <p className="text-sm text-[#9ca3af]">No weak signals detected.</p>
            ) : (
              <div className="space-y-2">
                {actionRecs.map((rec, i) => (
                  <ActionRecommendationCard key={`${rec.metric}-${i}`} rec={rec} rank={i + 1} />
                ))}
              </div>
            )}
          </section>

          {/* Content Recommendations */}
          <section className="mb-8">
            <h2 className="text-base font-semibold text-[#1a1a2e] mb-4">Content Recommendations</h2>
            {contentRecs.length === 0 ? (
              <p className="text-sm text-[#9ca3af]">No content gaps detected.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {contentRecs.map((rec, i) => (
                  <ContentRecommendationCard key={`${rec.category}-${i}`} rec={rec} />
                ))}
              </div>
            )}
          </section>

          {/* Evidence Panel */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[#1a1a2e]">Evidence Analysis</h2>
              <Link href="/event-log" className="text-xs text-[#e879a0] hover:underline">
                View Event Log →
              </Link>
            </div>
            <EvidencePanel events={events} />
          </section>
        </>
      )}
    </PageContainer>
  )
}
