'use client'

import { useEffect, useMemo, useState } from 'react'
import PageContainer from '@/components/shared/PageContainer'
import LoadingState from '@/components/shared/LoadingState'
import { getPersonalStates } from '@/services/personalStates'
import { getOriStates } from '@/services/oriStates'
import { getEvents } from '@/services/events'
import {
  getSegments, getRootProblems, getConceptFeatures, getValueProposition,
} from '@/services/pmf'
import { saveToQueue } from '@/services/contentOpportunities'
import { saveForecastBatch } from '@/services/futureNarrative'
import { getAllBlueprints } from '@/services/narrativeBlueprints'
import {
  generateFutureNarrative,
  computeMetrics, computeAllocation, selectNarrativeArc,
} from '@/lib/futureNarrativeEngine'
import { scoreColor } from '@/lib/stateEngine'
import { RefreshCwIcon, BookmarkPlusIcon, ChevronRightIcon } from 'lucide-react'

// ── Color maps ─────────────────────────────────────────────────────────────────

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

function PillarChip({ pillar, small }) {
  const s = getPillarStyle(pillar)
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${small ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'}`}
      style={{ backgroundColor: s.bg, color: s.text }}>
      {pillar}
    </span>
  )
}

// ── Analytics banner ──────────────────────────────────────────────────────────

function AnalyticsBanner({ result }) {
  const { weakestSignal, strongestSignal, allocation, arc, topPillar, topNarrative } = result
  const wc = weakestSignal  ? scoreColor(weakestSignal.value)  : null
  const sc = strongestSignal ? scoreColor(strongestSignal.value) : null

  const cards = [
    {
      label: 'Weakest Signal',
      value: weakestSignal ? `${weakestSignal.label} ${weakestSignal.value}/10` : '—',
      sub:   weakestSignal ? 'Needs most content attention' : null,
      style: wc ? { color: wc.text } : {},
    },
    {
      label: 'Strongest Signal',
      value: strongestSignal ? `${strongestSignal.label} ${strongestSignal.value}/10` : '—',
      sub:   strongestSignal ? 'Can be maintained' : null,
      style: sc ? { color: sc.text } : {},
    },
    {
      label: 'Top Allocation',
      value: allocation[0] ? `${allocation[0].pillar} ${allocation[0].pct}%` : '—',
      sub:   'Highest content weight',
      style: { color: '#e879a0' },
    },
    {
      label: 'Narrative Arc',
      value: arc.name,
      sub:   arc.phases.join(' → '),
      style: { color: '#1a1a2e' },
    },
    {
      label: 'Top Forecasted Pillar',
      value: topPillar || '—',
      sub:   'Most forecasted content',
      style: { color: '#7c3aed' },
    },
    {
      label: 'Top Narrative Stack',
      value: topNarrative || '—',
      sub:   'Most forecasted narrative',
      style: { color: '#1d4ed8' },
    },
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

// ── Content Allocation bars ───────────────────────────────────────────────────

function AllocationSection({ allocation }) {
  return (
    <div className="bg-white rounded-xl border border-[#f0e8ee] p-5 mb-6">
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

// ── Narrative Arc ─────────────────────────────────────────────────────────────

function NarrativeArcDisplay({ arc }) {
  return (
    <div className="bg-white rounded-xl border border-[#f0e8ee] p-5 mb-6">
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

// ── Forecast card ─────────────────────────────────────────────────────────────

function ForecastCard({ forecast, isPriority, onSaveToQueue, saved, saving, blueprint }) {
  const s = getPillarStyle(forecast.pillar)

  const cardCls = isPriority
    ? 'bg-[#1a1a2e] text-white border-2 border-[#86efac] rounded-xl p-4 flex flex-col gap-3'
    : 'bg-white border border-[#fce4ed] rounded-xl p-4 flex flex-col gap-3 opacity-90 hover:opacity-100 transition-opacity'

  const labelCls   = isPriority ? 'text-[#86efac]' : 'text-[#9ca3af]'
  const textCls    = isPriority ? 'text-white'      : 'text-[#1a1a2e]'
  const subCls     = isPriority ? 'text-[#9ca3af]'  : 'text-[#6b7280]'
  const reasonCls  = isPriority ? 'text-[#c4b5c0]'  : 'text-[#6b7280]'
  const pillBg     = isPriority ? 'rgba(134,239,172,0.15)' : s.bg
  const pillText   = isPriority ? '#86efac'          : s.text

  return (
    <div className={cardCls}>
      {/* Badge row */}
      <div className="flex items-center gap-2 flex-wrap">
        {isPriority && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#86efac]/20 text-[#86efac]">
            Priority
          </span>
        )}
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
          style={{ backgroundColor: pillBg, color: pillText }}>
          {forecast.pillar}
        </span>
        {forecast.allocation_pct != null && (
          <span className={`text-[11px] font-medium ml-auto ${labelCls}`}>
            {forecast.allocation_pct}%
          </span>
        )}
      </div>

      {/* Pillar + Narrative */}
      <div>
        <p className={`text-sm font-semibold ${textCls}`}>{forecast.pillar}</p>
        <p className="text-xs mt-0.5" style={{ color: isPriority ? '#f9a8c3' : '#e879a0' }}>
          {forecast.narrative_stack}
        </p>
        {blueprint && (
          <p className={`text-[11px] mt-1 ${subCls}`}>
            Blueprint: <span className="font-medium">{blueprint.blueprint_name}</span>
          </p>
        )}
      </div>

      {/* Blueprint moments preview */}
      {blueprint && (
        <div className="space-y-1">
          {[
            { label: 'Life',       items: blueprint.life_moments?.slice(0, 2),       color: isPriority ? '#86efac44' : '#fdf2f6', text: isPriority ? '#86efac' : '#6b5b6e' },
            { label: 'Work',       items: blueprint.work_moments?.slice(0, 2),        color: isPriority ? '#86efac22' : '#dcfce7', text: isPriority ? '#a7f3d0' : '#16a34a' },
            { label: 'Reflection', items: blueprint.reflection_moments?.slice(0, 2), color: isPriority ? '#ede9fe22' : '#ede9fe', text: isPriority ? '#c4b5fd' : '#7c3aed' },
          ].map(({ label, items, color, text }) => items?.length > 0 && (
            <div key={label} className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: isPriority ? '#9ca3af' : '#c4b5c0' }}>{label}</span>
              {items.map((m, i) => (
                <span key={i} className="inline-flex items-center px-1.5 py-0 rounded text-[10px]"
                  style={{ backgroundColor: color, color: text }}>
                  {m}
                </span>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Source state */}
      {forecast.source_state && (
        <div>
          <p className={`text-[11px] font-semibold uppercase tracking-wide mb-0.5 ${labelCls}`}>Source State</p>
          <p className={`text-xs ${subCls}`}>
            {forecast.source_state.metric} — {forecast.source_state.value}/10
          </p>
        </div>
      )}

      {/* Source PMF */}
      {forecast.source_pmf_asset && (
        <div>
          <p className={`text-[11px] font-semibold uppercase tracking-wide mb-0.5 ${labelCls}`}>Source PMF</p>
          <p className={`text-xs ${subCls}`}>{forecast.source_pmf_asset}</p>
        </div>
      )}

      {/* Source Events */}
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

      {/* Reason */}
      {forecast.reason && (
        <p className={`text-[11px] italic leading-relaxed ${reasonCls}`}>{forecast.reason}</p>
      )}

      {/* Save to Queue */}
      <div className="pt-1 border-t" style={{ borderColor: isPriority ? 'rgba(255,255,255,0.1)' : '#f0e8ee' }}>
        {saved ? (
          <span className="text-[11px] font-medium text-[#16a34a]">✓ Saved to Queue</span>
        ) : (
          <button
            onClick={() => onSaveToQueue(forecast)}
            disabled={saving}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
              isPriority
                ? 'bg-[#86efac]/20 text-[#86efac] hover:bg-[#86efac]/30'
                : 'bg-[#fce4ed] text-[#e879a0] hover:bg-[#f9a8c3]/30'
            }`}
          >
            <BookmarkPlusIcon size={12} />
            {saving ? 'Saving…' : 'Save To Queue'}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Calendar ──────────────────────────────────────────────────────────────────

function CalendarView({ schedule, view }) {
  const today = new Date()

  if (view === 'month') {
    // Current month only — group by week
    const currentMonth = today.getMonth()
    const currentYear  = today.getFullYear()
    const monthWeeks   = schedule.filter(w => w.month === currentMonth && w.year === currentYear)
    // Also include next 2 months
    const next1Month   = (currentMonth + 1) % 12
    const next1Year    = currentMonth === 11 ? currentYear + 1 : currentYear
    const next2Month   = (currentMonth + 2) % 12
    const next2Year    = currentMonth >= 10 ? currentYear + 1 : currentYear

    const months = [
      { label: schedule.find(w => w.month === currentMonth && w.year === currentYear)?.monthYear || '', weeks: monthWeeks },
      { label: schedule.find(w => w.month === next1Month && w.year === next1Year)?.monthYear || '', weeks: schedule.filter(w => w.month === next1Month && w.year === next1Year) },
      { label: schedule.find(w => w.month === next2Month && w.year === next2Year)?.monthYear || '', weeks: schedule.filter(w => w.month === next2Month && w.year === next2Year) },
    ].filter(m => m.weeks.length > 0)

    return (
      <div className="space-y-6">
        {months.map(({ label, weeks }) => (
          <div key={label}>
            <p className="text-sm font-semibold text-[#1a1a2e] mb-3">{label}</p>
            <div className="space-y-2">
              {weeks.map(week => <CalendarWeekRow key={week.weekLabel} week={week} />)}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (view === 'quarter') {
    // Q2, Q3, Q4 of 2026
    const quarters = [
      { label: 'Q2 2026', months: [3, 4, 5] },
      { label: 'Q3 2026', months: [6, 7, 8] },
      { label: 'Q4 2026', months: [9, 10, 11] },
    ]

    return (
      <div className="space-y-8">
        {quarters.map(({ label, months }) => {
          const qWeeks = schedule.filter(w => months.includes(w.month) && w.year === 2026)
          if (!qWeeks.length) return null

          const byMonth = {}
          for (const w of qWeeks) {
            if (!byMonth[w.monthYear]) byMonth[w.monthYear] = []
            byMonth[w.monthYear].push(w)
          }

          return (
            <div key={label}>
              <p className="text-sm font-semibold text-[#1a1a2e] mb-3">{label}</p>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(byMonth).map(([month, mWeeks]) => (
                  <div key={month} className="bg-white rounded-xl border border-[#f0e8ee] p-3">
                    <p className="text-xs font-semibold text-[#9ca3af] mb-2">{month}</p>
                    <div className="space-y-1.5">
                      {mWeeks.map(week => <CalendarMiniRow key={week.weekLabel} week={week} />)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Year view — show months as columns
  const byMonth = {}
  for (const w of schedule.filter(w => w.year === 2026)) {
    if (!byMonth[w.monthYear]) byMonth[w.monthYear] = []
    byMonth[w.monthYear].push(w)
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {Object.entries(byMonth).map(([month, mWeeks]) => {
        const pillarCounts = {}
        for (const w of mWeeks) {
          pillarCounts[w.pillar] = (pillarCounts[w.pillar] || 0) + 1
        }
        const topPillar = Object.entries(pillarCounts).sort((a, b) => b[1] - a[1])[0]
        const s = getPillarStyle(topPillar?.[0] || '')

        return (
          <div key={month} className="bg-white rounded-xl border border-[#f0e8ee] p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-[#1a1a2e]">{month}</p>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                style={{ backgroundColor: s.bg, color: s.text }}>
                {topPillar?.[0]}
              </span>
            </div>
            <div className="space-y-1">
              {mWeeks.slice(0, 4).map(w => <CalendarMiniRow key={w.weekLabel} week={w} />)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function CalendarWeekRow({ week }) {
  const s = getPillarStyle(week.pillar)
  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${week.isCurrentWeek ? 'border-[#e879a0] bg-[#fdf2f6]' : 'border-[#f0e8ee] bg-white'}`}>
      <div className="w-28 shrink-0">
        <p className="text-[11px] text-[#9ca3af]">{week.weekLabel}</p>
        {week.isCurrentWeek && <p className="text-[10px] text-[#e879a0] font-semibold">This week</p>}
      </div>
      <div className="flex items-center gap-2 flex-1">
        <PillarChip pillar={week.pillar} small />
        <span className="text-xs text-[#9ca3af]">·</span>
        <span className="text-xs text-[#6b7280]">{week.narrative_stack}</span>
      </div>
      <span className="text-[11px] text-[#9ca3af]">{week.allocation_pct}%</span>
    </div>
  )
}

function CalendarMiniRow({ week }) {
  const s = getPillarStyle(week.pillar)
  return (
    <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${week.isCurrentWeek ? 'bg-[#fdf2f6]' : ''}`}>
      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.text }} />
      <p className="text-[11px] text-[#1a1a2e] truncate">{week.pillar}</p>
      <p className="text-[11px] text-[#9ca3af] shrink-0 ml-auto">{week.weekLabel.split(' – ')[0]}</p>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ContentCalendarPage() {
  const [loading,      setLoading]      = useState(true)
  const [generating,   setGenerating]   = useState(false)
  const [result,       setResult]       = useState(null)
  const [calView,      setCalView]      = useState('month')
  const [savedIds,     setSavedIds]     = useState(new Set())
  const [savingKey,    setSavingKey]    = useState(null)

  // Raw data for engine
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
      } catch { /* PMF tables not yet migrated */ }
      setPmfData(pmf)

      // Load blueprints (non-blocking)
      getAllBlueprints().then(bps => setBlueprints(bps || [])).catch(() => {})

      // Generate immediately
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

      // Save to DB (non-blocking)
      const allForecasts = [
        ...(r.priorityRecs || []),
        ...(r.futureForecasts || []),
      ]
      saveForecastBatch(allForecasts).catch(() => {})
    } finally {
      setGenerating(false)
    }
  }

  async function handleSaveToQueue(forecast) {
    const key = `${forecast.pillar}::${forecast.narrative_stack}`
    setSavingKey(key)
    try {
      await saveToQueue({
        platform:         forecast.source_state
          ? (forecast.source_state.metric && ['authority', 'trust', 'momentum', 'authenticity'].includes(forecast.source_state.metric?.toLowerCase()) ? 'Personal' : 'Ori')
          : 'Both',
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
      })
      setSavedIds(prev => new Set([...prev, key]))
    } finally {
      setSavingKey(null)
    }
  }

  if (loading) return <LoadingState message="Loading Content Calendar…" />
  if (!result)  return null

  const { priorityRecs, futureForecasts, calendarSchedule, arc, allocation, generatedAt } = result
  const lastGen = generatedAt ? new Date(generatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null

  return (
    <PageContainer className="max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#1a1a2e] tracking-tight">Content Calendar</h1>
          <p className="text-sm text-[#9ca3af] mt-0.5">
            Adaptive Future Narrative Engine — forecasts based on state, events, and PMF intelligence.
          </p>
          {lastGen && <p className="text-[11px] text-[#c4b5c0] mt-1">Last generated {lastGen}</p>}
        </div>
        <button
          onClick={handleRegenerate}
          disabled={generating}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-[#f0e8ee] text-[#6b7280] hover:bg-[#fdf2f6] hover:text-[#e879a0] hover:border-[#fce4ed] transition-colors disabled:opacity-50"
        >
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
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#dcfce7] text-[#16a34a] font-medium">
              Override future narrative
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {priorityRecs.map((rec, i) => {
              const key = `${rec.pillar}::${rec.narrative_stack}`
              const pillarBps = blueprints.filter(b => b.primary_pillar === rec.pillar)
              const bp = pillarBps.find(b => b.narrative_stack === rec.narrative_stack) || pillarBps[0] || null
              return (
                <ForecastCard
                  key={i}
                  forecast={rec}
                  isPriority={true}
                  onSaveToQueue={handleSaveToQueue}
                  saved={savedIds.has(key)}
                  saving={savingKey === key}
                  blueprint={bp}
                />
              )
            })}
          </div>
        </section>
      )}

      {/* Future Narrative Forecasts */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-base font-semibold text-[#1a1a2e]">Future Narrative</h2>
          <span className="text-xs px-2 py-0.5 rounded-full border border-[#fce4ed] text-[#e879a0]">
            Forecasted content
          </span>
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
                <ForecastCard
                  key={i}
                  forecast={fc}
                  isPriority={false}
                  onSaveToQueue={handleSaveToQueue}
                  saved={savedIds.has(key)}
                  saving={savingKey === key}
                  blueprint={bp}
                />
              )
            })}
          </div>
        )}
      </section>

      {/* Calendar */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[#1a1a2e]">Content Calendar</h2>
          <div className="flex items-center gap-1">
            {['month', 'quarter', 'year'].map(v => (
              <button
                key={v}
                onClick={() => setCalView(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                  calView === v
                    ? 'bg-[#fce4ed] text-[#e879a0]'
                    : 'text-[#6b7280] hover:bg-[#fdf2f6] hover:text-[#e879a0]'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <CalendarView schedule={calendarSchedule} view={calView} />
      </section>
    </PageContainer>
  )
}
