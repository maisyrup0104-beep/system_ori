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
import { getAllBlueprints } from '@/services/narrativeBlueprints'
import {
  PERSONAL_METRICS, ORI_METRICS,
  findCriticalSignal, generateActionRecommendations,
  scoreColor, scoreLabel,
} from '@/lib/stateEngine'
import { generateOpportunities, analyzeEvents } from '@/lib/opportunityEngine'
import { RefreshCwIcon, BookmarkPlusIcon, XIcon, ChevronRightIcon, MapPinIcon } from 'lucide-react'

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
function OpportunityCard({ opp, onSave, onDismiss, saved, saving, firstBlueprint, onViewBlueprint }) {
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
        {firstBlueprint && (
          <p className="text-[11px] text-[#9ca3af] mt-1">
            Blueprint: <span className="text-[#6b7280] font-medium">{firstBlueprint.blueprint_name}</span>
          </p>
        )}
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
      <div className="flex items-center gap-2 pt-1 border-t border-[#f0e8ee] flex-wrap">
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
        {firstBlueprint && (
          <button
            onClick={() => onViewBlueprint(opp)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#f0e8ee] text-[#6b7280] hover:border-[#fce4ed] hover:text-[#e879a0] hover:bg-[#fdf2f6] transition-colors ml-auto"
          >
            <MapPinIcon size={12} />
            View Blueprint
          </button>
        )}
      </div>
    </div>
  )
}

// ── Blueprint Panel ───────────────────────────────────────────────────────────

function BlueprintPanel({ blueprints, idx, onIdxChange, onClose, opportunity, onSaveToQueue, saved, saving }) {
  const bp = blueprints[idx]
  if (!bp) return null

  const pillSection = (label, items, bg, color) => (
    items?.length > 0 && (
      <div>
        <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide mb-1.5">{label}</p>
        <div className="flex flex-wrap gap-1">
          {items.map((m, i) => (
            <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px]"
              style={{ backgroundColor: bg, color }}>
              {m}
            </span>
          ))}
        </div>
      </div>
    )
  )

  return (
    <>
      <div className="fixed inset-0 bg-black/10 z-30" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-[400px] bg-white border-l border-[#f0e8ee] z-40 flex flex-col shadow-xl overflow-hidden">
        <div className="flex items-start justify-between px-5 py-4 border-b border-[#f0e8ee] shrink-0">
          <div className="flex-1 min-w-0 pr-3">
            <p className="text-[11px] text-[#9ca3af] mb-0.5">
              {opportunity?.primary_pillar} · {opportunity?.narrative_stack}
            </p>
            <p className="text-base font-semibold text-[#1a1a2e] leading-tight">{bp.blueprint_name}</p>
            <p className="text-xs text-[#e879a0] mt-0.5">Narrative Day Blueprint</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#9ca3af] hover:text-[#1a1a2e] hover:bg-[#fdf2f6] transition-colors shrink-0">
            <XIcon size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* 30/40/30 layout */}
          <div className="grid grid-cols-3 gap-3 text-center text-[11px] text-[#9ca3af] mb-1">
            {[['30%', 'Life'], ['40%', 'Main Event'], ['30%', 'Reflection']].map(([pct, label]) => (
              <div key={label} className="bg-[#fdf9fb] border border-[#f0e8ee] rounded-lg py-2">
                <p className="font-semibold text-[#1a1a2e]">{pct}</p>
                <p>{label}</p>
              </div>
            ))}
          </div>

          {pillSection('Life Moments', bp.life_moments, '#fdf2f6', '#6b5b6e')}
          {pillSection('Work Moments', bp.work_moments, '#dcfce7', '#16a34a')}
          {pillSection('Reflection Moments', bp.reflection_moments, '#ede9fe', '#7c3aed')}

          {bp.recommended_wardrobe?.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide mb-1.5">Wardrobe</p>
              <div className="flex flex-wrap gap-1">
                {bp.recommended_wardrobe.map((w, i) => (
                  <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-[#fce4ed] text-[#e879a0]">{w}</span>
                ))}
              </div>
            </div>
          )}
          {bp.recommended_locations?.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide mb-1.5">Locations</p>
              <div className="flex flex-wrap gap-1">
                {bp.recommended_locations.map((l, i) => (
                  <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-[#dbeafe] text-[#1d4ed8]">{l}</span>
                ))}
              </div>
            </div>
          )}
          {bp.recommended_props?.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide mb-1.5">Props</p>
              <div className="flex flex-wrap gap-1">
                {bp.recommended_props.map((p, i) => (
                  <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-[#fef9c3] text-[#ca8a04]">{p}</span>
                ))}
              </div>
            </div>
          )}

          {/* Cycle blueprints */}
          {blueprints.length > 1 && (
            <div className="flex items-center gap-2">
              <p className="text-[11px] text-[#9ca3af]">Blueprint {idx + 1} of {blueprints.length}</p>
              <button
                onClick={() => onIdxChange((idx - 1 + blueprints.length) % blueprints.length)}
                className="px-2 py-1 text-xs border border-[#f0e8ee] rounded-lg hover:bg-[#fdf2f6] text-[#6b7280] transition-colors"
              >← Prev</button>
              <button
                onClick={() => onIdxChange((idx + 1) % blueprints.length)}
                className="px-2 py-1 text-xs border border-[#f0e8ee] rounded-lg hover:bg-[#fdf2f6] text-[#6b7280] transition-colors"
              >Next →</button>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-[#f0e8ee] shrink-0">
          {saved ? (
            <span className="flex items-center gap-1.5 text-xs font-medium text-[#16a34a]">
              <span className="w-4 h-4 rounded-full bg-[#dcfce7] flex items-center justify-center text-[10px]">✓</span>
              Saved to Queue
            </span>
          ) : (
            <button
              onClick={() => onSaveToQueue(opportunity, bp)}
              disabled={saving}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-[#e879a0] text-white hover:bg-[#d4659a] transition-colors disabled:opacity-50"
            >
              <BookmarkPlusIcon size={14} />
              {saving ? 'Saving…' : 'Save To Queue with Blueprint'}
            </button>
          )}
        </div>
      </div>
    </>
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
function ContentOpportunitiesSection({ opportunities, dismissed, saved, savingId, onSave, onDismiss, onRegenerate, blueprints, onViewBlueprint }) {
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
          {visible.map((opp) => {
            const pillarBps = (blueprints || []).filter(b => b.primary_pillar === opp.primary_pillar)
            const firstBp   = pillarBps.find(b => b.narrative_stack === opp.narrative_stack) || pillarBps[0] || null
            return (
            <OpportunityCard
              key={opp.id}
              opp={opp}
              onSave={onSave}
              onDismiss={onDismiss}
              saved={saved.has(opp.id)}
              saving={savingId === opp.id}
              firstBlueprint={firstBp}
              onViewBlueprint={onViewBlueprint}
            />
            )
          })}
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

  // Blueprint state
  const [blueprints,    setBlueprints]    = useState([])
  const [bpPanel,       setBpPanel]       = useState({ open: false, blueprints: [], idx: 0, opp: null })

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

      // Load blueprints
      getAllBlueprints().then(bps => setBlueprints(bps || [])).catch(() => {})

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

  async function handleSave(opp, blueprint) {
    setSavingId(opp.id)
    try {
      const pillarBps = blueprints.filter(b => b.primary_pillar === opp.primary_pillar)
      const bp = blueprint
        || pillarBps.find(b => b.narrative_stack === opp.narrative_stack)
        || pillarBps[0]
        || null
      await saveToQueue({ ...opp, blueprint: bp })
      setSaved(prev => new Set([...prev, opp.id]))
      if (bpPanel.open && bpPanel.opp?.id === opp.id) {
        setBpPanel(prev => ({ ...prev, open: false }))
      }
    } catch (err) {
      console.error('Failed to save to queue:', err)
    } finally {
      setSavingId(null)
    }
  }

  function handleViewBlueprint(opp) {
    const pillarBps = blueprints.filter(b => b.primary_pillar === opp.primary_pillar)
    if (!pillarBps.length) return
    setBpPanel({ open: true, blueprints: pillarBps, idx: 0, opp })
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
    <>
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
        blueprints={blueprints}
        onViewBlueprint={handleViewBlueprint}
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

    {/* Blueprint Panel */}
    {bpPanel.open && bpPanel.blueprints.length > 0 && (
      <BlueprintPanel
        blueprints={bpPanel.blueprints}
        idx={bpPanel.idx}
        onIdxChange={(i) => setBpPanel(prev => ({ ...prev, idx: i }))}
        onClose={() => setBpPanel({ open: false, blueprints: [], idx: 0, opp: null })}
        opportunity={bpPanel.opp}
        onSaveToQueue={handleSave}
        saved={saved.has(bpPanel.opp?.id)}
        saving={savingId === bpPanel.opp?.id}
      />
    )}
  </>
  )
}
