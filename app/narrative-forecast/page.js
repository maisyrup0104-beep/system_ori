'use client'

import { useEffect, useState } from 'react'
import PageContainer from '@/components/shared/PageContainer'
import LoadingState from '@/components/shared/LoadingState'
import { getPersonalStates } from '@/services/personalStates'
import { getOriStates } from '@/services/oriStates'
import { getEvents } from '@/services/events'
import { getSegments, getRootProblems, getConceptFeatures, getValueProposition } from '@/services/pmf'
import { saveToQueue } from '@/services/contentOpportunities'
import { saveForecastBatch } from '@/services/futureNarrative'
import { getAllBlueprints } from '@/services/narrativeBlueprints'
import { generateFutureNarrative } from '@/lib/futureNarrativeEngine'
import { scoreColor } from '@/lib/stateEngine'
import { RefreshCwIcon, BookmarkPlusIcon, ChevronRightIcon } from 'lucide-react'

// ── Color helpers ──────────────────────────────────────────────────────────────

const PILLAR_COLORS = {
  'Real Validation':      { bg: '#fce4ed', text: '#e879a0' },
  'Building Journey':     { bg: '#dcfce7', text: '#16a34a' },
  'PMF Discovery':        { bg: '#fef9c3', text: '#ca8a04' },
  'Founder Insight':      { bg: '#ede9fe', text: '#7c3aed' },
  'Market Evidence':      { bg: '#dbeafe', text: '#1d4ed8' },
  'Industry Observation': { bg: '#f3f4f6', text: '#374151' },
  'Concept Building':     { bg: '#fef3c7', text: '#b45309' },
  'Authority':            { bg: '#fce4ed', text: '#be185d' },
  'Trust':                { bg: '#dcfce7', text: '#065f46' },
}

function getPillarStyle(pillar) {
  return PILLAR_COLORS[pillar] || { bg: '#f3f4f6', text: '#6b7280' }
}

function PillarChip({ pillar }) {
  const s = getPillarStyle(pillar)
  return (
    <span className="inline-flex items-center rounded-full font-medium px-2.5 py-1 text-xs"
      style={{ backgroundColor: s.bg, color: s.text }}>
      {pillar}
    </span>
  )
}

// ── Analytics Banner ──────────────────────────────────────────────────────────

function AnalyticsBanner({ result }) {
  const { weakestSignal, strongestSignal, allocation, arc, topPillar, topNarrative } = result
  const wc = weakestSignal   ? scoreColor(weakestSignal.value)   : null
  const sc = strongestSignal ? scoreColor(strongestSignal.value) : null

  const cards = [
    { label: 'Weakest Signal',       value: weakestSignal   ? `${weakestSignal.label} ${weakestSignal.value}/10`   : '—', sub: weakestSignal   ? 'Needs most content attention' : null, style: wc ? { color: wc.text } : {} },
    { label: 'Strongest Signal',     value: strongestSignal ? `${strongestSignal.label} ${strongestSignal.value}/10` : '—', sub: strongestSignal ? 'Can be maintained'           : null, style: sc ? { color: sc.text } : {} },
    { label: 'Top Allocation',       value: allocation[0]   ? `${allocation[0].pillar} ${allocation[0].pct}%`       : '—', sub: 'Highest content weight',                             style: { color: '#e879a0' } },
    { label: 'Narrative Arc',        value: arc.name,                                                                       sub: arc.phases.join(' → '),                               style: { color: '#1a1a2e' } },
    { label: 'Top Forecasted Pillar',value: topPillar   || '—',                                                             sub: 'Most forecasted content',                            style: { color: '#7c3aed' } },
    { label: 'Top Narrative Stack',  value: topNarrative || '—',                                                            sub: 'Most forecasted narrative',                          style: { color: '#1d4ed8' } },
  ]

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {cards.map(c => (
        <div key={c.label} className="bg-white rounded-xl border border-[#f0e8ee] p-4">
          <p className="text-[11px] text-[#9ca3af] mb-1">{c.label}</p>
          <p className="text-sm font-semibold truncate" style={c.style}>{c.value}</p>
          {c.sub && <p className="text-[11px] text-[#c4b5c0] mt-0.5 truncate">{c.sub}</p>}
        </div>
      ))}
    </div>
  )
}

// ── Allocation ─────────────────────────────────────────────────────────────────

function AllocationSection({ allocation }) {
  return (
    <div className="bg-white rounded-xl border border-[#f0e8ee] p-5">
      <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide mb-4">Content Allocation</p>
      <div className="space-y-3">
        {allocation.map(a => {
          const s = getPillarStyle(a.pillar)
          return (
            <div key={a.pillar}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-[#1a1a2e]">{a.pillar}</span>
                <span className="text-sm font-semibold" style={{ color: s.text }}>{a.pct}%</span>
              </div>
              <div className="h-2 bg-[#f3f4f6] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${a.pct}%`, backgroundColor: s.text + 'aa' }} />
              </div>
              <p className="text-[11px] text-[#9ca3af] mt-0.5">{a.reason}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Narrative Arc ──────────────────────────────────────────────────────────────

function NarrativeArcDisplay({ arc }) {
  return (
    <div className="bg-white rounded-xl border border-[#f0e8ee] p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide">Narrative Arc</p>
        <span className="text-[11px] text-[#e879a0] font-medium">{arc.name}</span>
      </div>
      <div className="flex items-center gap-2 flex-wrap mb-3">
        {arc.phases.map((phase, i) => (
          <span key={phase} className="flex items-center gap-2">
            <PillarChip pillar={phase} />
            {i < arc.phases.length - 1 && <ChevronRightIcon size={14} className="text-[#d1c4cb] shrink-0" />}
          </span>
        ))}
      </div>
      <p className="text-xs text-[#6b7280] italic leading-relaxed">{arc.reason}</p>
    </div>
  )
}

// ── Forecast Card ─────────────────────────────────────────────────────────────

function ForecastCard({ forecast, isPriority, onSaveToQueue, saved, saving, blueprint }) {
  const s       = getPillarStyle(forecast.pillar)
  const cardCls = isPriority
    ? 'bg-[#1a1a2e] border-2 border-[#86efac] rounded-xl p-4 flex flex-col gap-3'
    : 'bg-white border border-[#fce4ed] rounded-xl p-4 flex flex-col gap-3 opacity-90 hover:opacity-100 transition-opacity'
  const labelCls  = isPriority ? 'text-[#86efac]' : 'text-[#9ca3af]'
  const textCls   = isPriority ? 'text-white'      : 'text-[#1a1a2e]'
  const subCls    = isPriority ? 'text-[#9ca3af]'  : 'text-[#6b7280]'
  const reasonCls = isPriority ? 'text-[#c4b5c0]'  : 'text-[#6b7280]'

  return (
    <div className={cardCls}>
      <div className="flex items-center gap-2 flex-wrap">
        {isPriority && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#86efac]/20 text-[#86efac]">Priority</span>}
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
          style={{ backgroundColor: isPriority ? 'rgba(134,239,172,0.15)' : s.bg, color: isPriority ? '#86efac' : s.text }}>
          {forecast.pillar}
        </span>
        {forecast.allocation_pct != null && <span className={`text-[11px] font-medium ml-auto ${labelCls}`}>{forecast.allocation_pct}%</span>}
      </div>

      <div>
        <p className={`text-sm font-semibold ${textCls}`}>{forecast.pillar}</p>
        <p className="text-xs mt-0.5" style={{ color: isPriority ? '#f9a8c3' : '#e879a0' }}>{forecast.narrative_stack}</p>
        {blueprint && <p className={`text-[11px] mt-1 ${subCls}`}>Blueprint: <span className="font-medium">{blueprint.blueprint_name}</span></p>}
      </div>

      {blueprint && (
        <div className="space-y-1">
          {[
            { label: 'Life',       items: blueprint.life_moments?.slice(0, 2),       bg: isPriority ? '#86efac44' : '#fdf2f6', color: isPriority ? '#86efac' : '#6b5b6e' },
            { label: 'Work',       items: blueprint.work_moments?.slice(0, 2),        bg: isPriority ? '#86efac22' : '#dcfce7', color: isPriority ? '#a7f3d0' : '#16a34a' },
            { label: 'Reflection', items: blueprint.reflection_moments?.slice(0, 2), bg: isPriority ? '#ede9fe22' : '#ede9fe', color: isPriority ? '#c4b5fd' : '#7c3aed' },
          ].map(({ label, items, bg, color }) => items?.length > 0 && (
            <div key={label} className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: isPriority ? '#9ca3af' : '#c4b5c0' }}>{label}</span>
              {items.map((m, i) => <span key={i} className="inline-flex items-center px-1.5 py-0 rounded text-[10px]" style={{ backgroundColor: bg, color }}>{m}</span>)}
            </div>
          ))}
        </div>
      )}

      {forecast.source_state && (
        <div>
          <p className={`text-[11px] font-semibold uppercase tracking-wide mb-0.5 ${labelCls}`}>Source State</p>
          <p className={`text-xs ${subCls}`}>{forecast.source_state.metric} — {forecast.source_state.value}/10</p>
        </div>
      )}
      {forecast.source_pmf_asset && (
        <div>
          <p className={`text-[11px] font-semibold uppercase tracking-wide mb-0.5 ${labelCls}`}>Source PMF</p>
          <p className={`text-xs ${subCls}`}>{forecast.source_pmf_asset}</p>
        </div>
      )}
      {forecast.source_events?.length > 0 && (
        <div>
          <p className={`text-[11px] font-semibold uppercase tracking-wide mb-1 ${labelCls}`}>Source Events</p>
          <div className="flex flex-wrap gap-1">
            {forecast.source_events.map((ev, i) => (
              <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px]"
                style={{ backgroundColor: isPriority ? 'rgba(254,249,195,0.1)' : '#fef9c3', color: isPriority ? '#fde68a' : '#ca8a04' }}>
                {ev}
              </span>
            ))}
          </div>
        </div>
      )}
      {forecast.reason && <p className={`text-[11px] italic leading-relaxed ${reasonCls}`}>{forecast.reason}</p>}

      <div className="pt-1 border-t" style={{ borderColor: isPriority ? 'rgba(255,255,255,0.1)' : '#f0e8ee' }}>
        {saved ? (
          <span className="text-[11px] font-medium text-[#16a34a]">✓ Saved to Queue</span>
        ) : (
          <button onClick={() => onSaveToQueue(forecast)} disabled={saving}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${isPriority ? 'bg-[#86efac]/20 text-[#86efac] hover:bg-[#86efac]/30' : 'bg-[#fce4ed] text-[#e879a0] hover:bg-[#f9a8c3]/30'}`}>
            <BookmarkPlusIcon size={12} />
            {saving ? 'Saving…' : 'Save To Queue'}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function NarrativeForecastPage() {
  const [loading,       setLoading]       = useState(true)
  const [generating,    setGenerating]    = useState(false)
  const [result,        setResult]        = useState(null)
  const [savedIds,      setSavedIds]      = useState(new Set())
  const [savingKey,     setSavingKey]     = useState(null)
  const [personalSnaps, setPersonalSnaps] = useState([])
  const [oriSnaps,      setOriSnaps]      = useState([])
  const [events,        setEvents]        = useState([])
  const [pmfData,       setPmfData]       = useState(null)
  const [blueprints,    setBlueprints]    = useState([])

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
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

      let pmf = null
      try {
        const segs = await getSegments()
        const seg  = segs?.[0]
        if (seg) {
          const [problems, features, vp] = await Promise.all([
            getRootProblems(seg.id).catch(() => []),
            getConceptFeatures(seg.id).catch(() => []),
            getValueProposition(seg.id).catch(() => null),
          ])
          pmf = { segment: seg, problems, features, valueProp: vp }
        }
      } catch { /* PMF tables may not exist yet */ }
      setPmfData(pmf)

      getAllBlueprints().then(bps => setBlueprints(bps || [])).catch(() => {})

      const personalSnap = ps?.[0] ?? null
      const oriSnap      = os?.[0] ?? null
      const r = generateFutureNarrative({ personalSnap, oriSnap, events: ev ?? [], pmfData: pmf })
      setResult(r)
    } finally {
      setLoading(false)
    }
  }

  async function handleRegenerate() {
    setGenerating(true)
    try {
      const personalSnap = personalSnaps[0] ?? null
      const oriSnap      = oriSnaps[0] ?? null
      const r = generateFutureNarrative({ personalSnap, oriSnap, events, pmfData })
      setResult(r)
      setSavedIds(new Set())
      saveForecastBatch([...(r.priorityRecs || []), ...(r.futureForecasts || [])]).catch(() => {})
    } finally {
      setGenerating(false)
    }
  }

  async function handleSaveToQueue(forecast) {
    const key = `${forecast.pillar}::${forecast.narrative_stack}`
    setSavingKey(key)
    try {
      const kind = forecast.source_state?.metric?.toLowerCase()
      const isPersonal = ['authority', 'trust', 'momentum', 'authenticity'].includes(kind)
      const pillarBps = blueprints.filter(b => b.primary_pillar === forecast.pillar)
      const bp = pillarBps.find(b => b.narrative_stack === forecast.narrative_stack) || pillarBps[0] || null
      await saveToQueue({
        platform:         forecast.is_priority ? (isPersonal ? 'Personal' : 'Ori') : 'Both',
        visibility:       'Both',
        priority:         forecast.is_priority ? 'High' : 'Medium',
        primary_pillar:   forecast.pillar,
        narrative_stack:  forecast.narrative_stack,
        supporting_moments: [],
        story_template:   null,
        source_type:      'State',
        source_events:    forecast.source_events || [],
        source_pmf_assets: forecast.source_pmf_asset ? [forecast.source_pmf_asset] : [],
        reason:           forecast.reason,
        blueprint:        bp,
      })
      setSavedIds(prev => new Set([...prev, key]))
    } finally {
      setSavingKey(null)
    }
  }

  if (loading) return <LoadingState message="Loading Narrative Forecast…" />
  if (!result)  return null

  const { priorityRecs, futureForecasts, allocation, arc, generatedAt } = result
  const lastGen = generatedAt ? new Date(generatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null

  return (
    <PageContainer className="max-w-5xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#1a1a2e] tracking-tight">Narrative Forecast</h1>
          <p className="text-sm text-[#9ca3af] mt-0.5">Planning engine — what content will likely be needed next.</p>
          {lastGen && <p className="text-[11px] text-[#c4b5c0] mt-1">Last generated {lastGen}</p>}
        </div>
        <button onClick={handleRegenerate} disabled={generating}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-[#f0e8ee] text-[#6b7280] hover:bg-[#fdf2f6] hover:text-[#e879a0] hover:border-[#fce4ed] transition-colors disabled:opacity-50">
          <RefreshCwIcon size={14} className={generating ? 'animate-spin' : ''} />
          {generating ? 'Regenerating…' : 'Regenerate'}
        </button>
      </div>

      {/* Analytics */}
      <AnalyticsBanner result={result} />

      {/* Allocation + Arc */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <AllocationSection allocation={allocation} />
        <NarrativeArcDisplay arc={arc} />
      </div>

      {/* Priority Recommendations */}
      {priorityRecs.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-base font-semibold text-[#1a1a2e]">Priority Recommendations</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#dcfce7] text-[#16a34a] font-medium">Override future narrative</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {priorityRecs.map((rec, i) => {
              const key = `${rec.pillar}::${rec.narrative_stack}`
              const pillarBps = blueprints.filter(b => b.primary_pillar === rec.pillar)
              const bp = pillarBps.find(b => b.narrative_stack === rec.narrative_stack) || pillarBps[0] || null
              return (
                <ForecastCard key={i} forecast={rec} isPriority={true} onSaveToQueue={handleSaveToQueue}
                  saved={savedIds.has(key)} saving={savingKey === key} blueprint={bp} />
              )
            })}
          </div>
        </section>
      )}

      {/* Future Narrative */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-base font-semibold text-[#1a1a2e]">Future Narrative</h2>
          <span className="text-xs px-2 py-0.5 rounded-full border border-[#fce4ed] text-[#e879a0]">Forecasted content</span>
        </div>
        {futureForecasts.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#f0e8ee] py-10 text-center">
            <p className="text-sm text-[#c4b5c0]">No forecasts available. Add state reviews to generate a narrative.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {futureForecasts.map((fc, i) => {
              const key = `${fc.pillar}::${fc.narrative_stack}`
              const pillarBps = blueprints.filter(b => b.primary_pillar === fc.pillar)
              const bp = pillarBps.find(b => b.narrative_stack === fc.narrative_stack) || pillarBps[0] || null
              return (
                <ForecastCard key={i} forecast={fc} isPriority={false} onSaveToQueue={handleSaveToQueue}
                  saved={savedIds.has(key)} saving={savingKey === key} blueprint={bp} />
              )
            })}
          </div>
        )}
      </section>
    </PageContainer>
  )
}
