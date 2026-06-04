'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import PageContainer from '@/components/shared/PageContainer'
import LoadingState from '@/components/shared/LoadingState'
import ActionRecommendationCard from '@/components/content/ActionRecommendationCard'
import EvidencePanel from '@/components/content/EvidencePanel'
import { getPersonalStates } from '@/services/personalStates'
import { getOriStates } from '@/services/oriStates'
import { getEvents } from '@/services/events'
import {
  getSegments, getRootProblems, getConceptFeatures,
  getUnderservedNeeds, getValueProposition,
} from '@/services/pmf'
import { saveToQueue } from '@/services/contentOpportunities'
import {
  PERSONAL_METRICS, ORI_METRICS,
  findCriticalSignal, generateActionRecommendations,
  scoreColor, scoreLabel,
} from '@/lib/stateEngine'
import { generateOpportunities, analyzeEvents } from '@/lib/opportunityEngine'
import { RefreshCwIcon, BookmarkPlusIcon, XIcon, ChevronRightIcon } from 'lucide-react'

// ── State Summary ─────────────────────────────────────────────────────────────
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
      {render(ORI_METRICS,      oriSnap,      '/ori-state',      'Ori State')}
    </div>
  )
}

// ── Critical Banner ───────────────────────────────────────────────────────────
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

// ── Priority + Platform badges ─────────────────────────────────────────────────
const PRIORITY_STYLES = {
  High:   { bg: '#dcfce7', text: '#16a34a' },
  Medium: { bg: '#fce4ed', text: '#e879a0' },
  Low:    { bg: '#f3f4f6', text: '#6b7280' },
}
const PLATFORM_STYLES = {
  Personal: { bg: '#fdf2f6', text: '#e879a0' },
  Ori:      { bg: '#dbeafe', text: '#1d4ed8' },
  Both:     { bg: '#f3f4f6', text: '#374151' },
}

function PriorityBadge({ value }) {
  const s = PRIORITY_STYLES[value] || PRIORITY_STYLES.Low
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ backgroundColor: s.bg, color: s.text }}>
      {value}
    </span>
  )
}

function PlatformBadge({ value }) {
  const s = PLATFORM_STYLES[value] || PLATFORM_STYLES.Both
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ backgroundColor: s.bg, color: s.text }}>
      {value}
    </span>
  )
}

function SourceTypeBadge({ value }) {
  const colors = {
    'State':          { bg: '#f3f4f6', text: '#374151' },
    'Event':          { bg: '#fef9c3', text: '#ca8a04' },
    'PMF':            { bg: '#dcfce7', text: '#16a34a' },
    'Concept Feature':{ bg: '#fce4ed', text: '#e879a0' },
    'Hybrid':         { bg: '#ede9fe', text: '#7c3aed' },
  }
  const s = colors[value] || colors.Event
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ backgroundColor: s.bg, color: s.text }}>
      {value}
    </span>
  )
}

// ── Opportunity Card ──────────────────────────────────────────────────────────
function OpportunityCard({ opp, onSave, onDismiss, saved, saving }) {
  const template = opp.story_template

  return (
    <div className="bg-white rounded-xl border border-[#f0e8ee] p-5 flex flex-col gap-4 hover:border-[#fce4ed] transition-colors">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <PlatformBadge value={opp.platform} />
          <PriorityBadge value={opp.priority} />
          <SourceTypeBadge value={opp.source_type} />
        </div>
        <button
          onClick={() => onDismiss(opp.id)}
          className="shrink-0 p-1 rounded-lg text-[#c4b5c0] hover:text-[#6b7280] hover:bg-[#fdf2f6] transition-colors"
          title="Dismiss"
        >
          <XIcon size={14} />
        </button>
      </div>

      {/* Primary Pillar + Narrative */}
      <div>
        <p className="text-base font-semibold text-[#1a1a2e] leading-tight">{opp.primary_pillar}</p>
        <p className="text-sm text-[#e879a0] font-medium mt-0.5">{opp.narrative_stack}</p>
      </div>

      {/* Supporting Moments */}
      {opp.supporting_moments?.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide mb-1.5">Supporting Moments</p>
          <div className="flex flex-wrap gap-1">
            {opp.supporting_moments.map((m) => (
              <span key={m} className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-[#fdf2f6] text-[#6b5b6e] border border-[#f0e8ee]">
                {m}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Whole-Day Story Template */}
      {template && (
        <div>
          <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide mb-1.5">
            Whole-Day Story · <span className="normal-case font-normal text-[#9ca3af]">{template.name}</span>
          </p>
          <div className="flex items-center gap-1 flex-wrap">
            {template.steps.map((step, i) => (
              <span key={step} className="flex items-center gap-1">
                <span className="text-xs font-medium text-[#1a1a2e] bg-[#f9f5fb] border border-[#f0e8ee] px-2 py-0.5 rounded-md">
                  {step}
                </span>
                {i < template.steps.length - 1 && (
                  <ChevronRightIcon size={12} className="text-[#d1c4cb] shrink-0" />
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Source Events */}
      {opp.source_events?.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide mb-1.5">Source Events</p>
          <div className="flex flex-wrap gap-1">
            {opp.source_events.map((ev, i) => (
              <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-[#fef9c3] text-[#ca8a04]">
                {ev}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Source PMF Assets */}
      {opp.source_pmf_assets?.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide mb-1.5">Source PMF Assets</p>
          <div className="flex flex-wrap gap-1">
            {opp.source_pmf_assets.map((asset, i) => (
              <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-[#dcfce7] text-[#16a34a]">
                {asset}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Reason */}
      {opp.reason && (
        <p className="text-xs text-[#6b7280] italic leading-relaxed border-l-2 border-[#f9a8c3] pl-3">
          {opp.reason}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-[#f0e8ee]">
        {saved ? (
          <span className="flex items-center gap-1.5 text-xs font-medium text-[#16a34a]">
            <span className="w-4 h-4 rounded-full bg-[#dcfce7] flex items-center justify-center text-[10px]">✓</span>
            Saved to Queue
          </span>
        ) : (
          <button
            onClick={() => onSave(opp)}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#e879a0] text-white hover:bg-[#d4659a] transition-colors disabled:opacity-50"
          >
            <BookmarkPlusIcon size={12} />
            {saving ? 'Saving…' : 'Save To Queue'}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Event Analysis Summary ────────────────────────────────────────────────────
function EventAnalysisBanner({ analysis }) {
  if (!analysis || !analysis.last7d?.length) return null
  const { mostActive, mostRepeated, validationStrength, discoveryStrength, last24h, last3d, last7d } = analysis
  return (
    <div className="bg-white rounded-xl border border-[#f0e8ee] p-4 mb-6">
      <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide mb-3">Event Analysis</p>
      <div className="grid grid-cols-3 gap-4 mb-3">
        {[
          { label: 'Last 24h', value: last24h.length },
          { label: 'Last 3 Days', value: last3d.length },
          { label: 'Last 7 Days', value: last7d.length },
        ].map(({ label, value }) => (
          <div key={label} className="text-center">
            <p className="text-xl font-semibold text-[#1a1a2e]">{value}</p>
            <p className="text-[11px] text-[#9ca3af]">{label}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-[#6b7280]">
        {mostActive    && <span className="bg-[#fdf2f6] border border-[#f0e8ee] px-2 py-0.5 rounded-full">Most Active: <b className="text-[#1a1a2e]">{mostActive}</b></span>}
        {mostRepeated  && <span className="bg-[#fdf2f6] border border-[#f0e8ee] px-2 py-0.5 rounded-full">Most Repeated: <b className="text-[#1a1a2e]">{mostRepeated}</b></span>}
        {validationStrength > 0 && <span className="bg-[#dcfce7] border border-[#bbf7d0] px-2 py-0.5 rounded-full text-[#16a34a]">Validation Signal: <b>{validationStrength}</b></span>}
        {discoveryStrength  > 0 && <span className="bg-[#fef9c3] border border-[#fde68a] px-2 py-0.5 rounded-full text-[#ca8a04]">Discovery Signal: <b>{discoveryStrength}</b></span>}
      </div>
    </div>
  )
}

// ── Content Opportunities Section ─────────────────────────────────────────────
function ContentOpportunitiesSection({ opportunities, dismissed, saved, savingId, onSave, onDismiss, onRegenerate }) {
  const visible = opportunities.filter(o => !dismissed.has(o.id))

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-[#1a1a2e]">Content Opportunities</h2>
          {visible.length > 0 && (
            <span className="text-xs text-[#9ca3af] bg-[#fdf2f6] border border-[#f0e8ee] px-2 py-0.5 rounded-full">{visible.length} discovered</span>
          )}
        </div>
        <button
          onClick={onRegenerate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#6b7280] border border-[#f0e8ee] hover:bg-[#fdf2f6] hover:text-[#e879a0] hover:border-[#fce4ed] transition-colors"
        >
          <RefreshCwIcon size={12} />
          Regenerate
        </button>
      </div>

      {visible.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#f0e8ee] py-12 text-center">
          <p className="text-sm text-[#9ca3af]">No opportunities visible.</p>
          <p className="text-xs text-[#c4b5c0] mt-1">All opportunities have been saved or dismissed.</p>
          <button onClick={onRegenerate} className="mt-4 text-xs text-[#e879a0] hover:underline">
            Regenerate opportunities →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {visible.map((opp) => (
            <OpportunityCard
              key={opp.id}
              opp={opp}
              onSave={onSave}
              onDismiss={onDismiss}
              saved={saved.has(opp.id)}
              saving={savingId === opp.id}
            />
          ))}
        </div>
      )}
    </section>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ContentOSPage() {
  const [personalSnaps, setPersonalSnaps] = useState([])
  const [oriSnaps,      setOriSnaps]      = useState([])
  const [events,        setEvents]        = useState([])
  const [pmfData,       setPmfData]       = useState(null)
  const [loading,       setLoading]       = useState(true)

  // Opportunity state
  const [opportunities, setOpportunities] = useState([])
  const [dismissed,     setDismissed]     = useState(new Set())
  const [saved,         setSaved]         = useState(new Set())
  const [savingId,      setSavingId]      = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const [ps, os, ev] = await Promise.all([
        getPersonalStates().catch(() => []),
        getOriStates().catch(() => []),
        getEvents().catch(() => []),
      ])

      setPersonalSnaps(ps ?? [])
      setOriSnaps(os ?? [])
      setEvents(ev ?? [])

      // Load PMF data
      let pmf = null
      try {
        const segs = await getSegments()
        const seg  = segs?.[0]
        if (seg) {
          const [problems, features, needs, valueProp] = await Promise.all([
            getRootProblems(seg.id).catch(() => []),
            getConceptFeatures(seg.id).catch(() => []),
            getUnderservedNeeds(seg.id).catch(() => []),
            getValueProposition(seg.id).catch(() => null),
          ])
          pmf = { segment: seg, problems, features, needs, valueProp }
        }
      } catch {
        // PMF tables may not exist yet — opportunities still generate from state/events
      }
      setPmfData(pmf)

      // Generate opportunities
      const personalSnap = ps?.[0] ?? null
      const oriSnap      = os?.[0] ?? null
      const opps = generateOpportunities({ personalSnap, oriSnap, events: ev ?? [], pmfData: pmf })
      setOpportunities(opps)
      setDismissed(new Set())
      setSaved(new Set())
    } finally {
      setLoading(false)
    }
  }

  function handleRegenerate() {
    const personalSnap = personalSnaps[0] ?? null
    const oriSnap      = oriSnaps[0] ?? null
    const opps = generateOpportunities({ personalSnap, oriSnap, events, pmfData })
    setOpportunities(opps)
    setDismissed(new Set())
    setSaved(new Set())
  }

  async function handleSave(opp) {
    setSavingId(opp.id)
    try {
      await saveToQueue(opp)
      setSaved(prev => new Set([...prev, opp.id]))
    } catch (err) {
      console.error('Failed to save to queue:', err)
    } finally {
      setSavingId(null)
    }
  }

  function handleDismiss(id) {
    setDismissed(prev => new Set([...prev, id]))
  }

  const personalSnap   = personalSnaps[0] ?? null
  const oriSnap        = oriSnaps[0]      ?? null
  const criticalSignal = useMemo(() => findCriticalSignal(personalSnap, oriSnap), [personalSnap, oriSnap])
  const actionRecs     = useMemo(() => generateActionRecommendations(personalSnap, oriSnap), [personalSnap, oriSnap])
  const eventAnalysis  = useMemo(() => analyzeEvents(events), [events])
  const noState        = !personalSnap && !oriSnap

  if (loading) return <LoadingState message="Loading Content OS…" />

  return (
    <PageContainer className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#1a1a2e] tracking-tight">Content OS</h1>
        <p className="text-sm text-[#9ca3af] mt-0.5">
          Discovery engine — surface content opportunities from state, events, and PMF intelligence.
        </p>
      </div>

      {/* State summary */}
      <StateSummaryRow personalSnap={personalSnap} oriSnap={oriSnap} />

      {noState ? (
        <div className="bg-white rounded-xl border border-[#f0e8ee] py-16 text-center mb-8">
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
        </>
      )}

      {/* Event Analysis */}
      <EventAnalysisBanner analysis={eventAnalysis} />

      {/* Content Opportunities */}
      <ContentOpportunitiesSection
        opportunities={opportunities}
        dismissed={dismissed}
        saved={saved}
        savingId={savingId}
        onSave={handleSave}
        onDismiss={handleDismiss}
        onRegenerate={handleRegenerate}
      />

      {/* Evidence Analysis */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[#1a1a2e]">Evidence Analysis</h2>
          <Link href="/event-log" className="text-xs text-[#e879a0] hover:underline">
            View Event Log →
          </Link>
        </div>
        <EvidencePanel events={events} />
      </section>
    </PageContainer>
  )
}
