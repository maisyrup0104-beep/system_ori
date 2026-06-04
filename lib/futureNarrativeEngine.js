// Adaptive Future Narrative Engine — deterministic, rule-based. No AI/LLM.

import { NARRATIVE_STACKS, STORY_TEMPLATES } from './opportunityEngine'

// ── Personal + Ori metric definitions ─────────────────────────────────────────

const PERSONAL_KEYS = ['authority', 'trust', 'momentum', 'authenticity']
const ORI_KEYS      = ['capability', 'credibility', 'proof', 'relevance']

const METRIC_LABELS = {
  authority:    'Authority',
  trust:        'Trust',
  momentum:     'Momentum',
  authenticity: 'Authenticity',
  capability:   'Capability',
  credibility:  'Credibility',
  proof:        'Proof',
  relevance:    'Relevance',
}

// ── Adaptive rules per weak metric ────────────────────────────────────────────

export const WEAK_SIGNAL_RULES = {
  authority: {
    pillars:    ['Real Validation', 'Industry Observation', 'Authority'],
    narratives: ['Documentary', 'Field Notes', 'Authority Builder', 'Validation'],
    reason:     'Authority is weak. Authority requires external proof and visible expertise.',
  },
  trust: {
    pillars:    ['Real Validation', 'Market Evidence', 'Trust'],
    narratives: ['Validation', 'Documentary', 'Evidence Review'],
    reason:     'Trust is weak. Trust requires reality-based, honest content.',
  },
  momentum: {
    pillars:    ['Building Journey', 'PMF Discovery'],
    narratives: ['Builder', 'Progress Arc', 'Experiment'],
    reason:     'Momentum is weak. Momentum requires visible, consistent action.',
  },
  authenticity: {
    pillars:    ['Founder Insight', 'PMF Discovery'],
    narratives: ['Realization', 'Mental Model', 'Observation'],
    reason:     'Authenticity is weak. Authenticity requires transparency and real reflection.',
  },
  capability: {
    pillars:    ['Concept Building', 'Building Journey'],
    narratives: ['Experiment', 'Testing', 'Behind The Scenes'],
    reason:     'Capability is weak. Capability requires demonstration through real work.',
  },
  credibility: {
    pillars:    ['Market Evidence', 'Trust', 'Authority'],
    narratives: ['Validation', 'Evidence Review', 'Signal Collection'],
    reason:     'Credibility is weak. Credibility requires market evidence and proof assets.',
  },
  proof: {
    pillars:    ['Concept Building', 'Market Evidence', 'Real Validation'],
    narratives: ['Hypothesis', 'Experiment', 'Evidence Review'],
    reason:     'Proof is weak. Proof requires visible work output and evidence.',
  },
  relevance: {
    pillars:    ['Industry Observation', 'PMF Discovery'],
    narratives: ['Field Notes', 'Observation', 'Problem Discovery'],
    reason:     'Relevance is weak. Relevance requires direct market understanding.',
  },
}

// ── Narrative arc rules ───────────────────────────────────────────────────────

const ARC_RULES = [
  { keys: ['authority', 'momentum'],    arc: { name: 'Authority & Momentum Arc',     phases: ['Building Journey', 'Real Validation', 'PMF Discovery'],           reason: 'Build visible progress first, then validate with real proof.' } },
  { keys: ['proof', 'capability'],      arc: { name: 'Proof & Capability Arc',        phases: ['Concept Building', 'Market Evidence', 'Real Validation'],          reason: 'Demonstrate work, collect evidence, then validate in market.' } },
  { keys: ['trust', 'credibility'],     arc: { name: 'Trust & Credibility Arc',       phases: ['Real Validation', 'Market Evidence', 'Industry Observation'],      reason: 'Lead with validation, layer in evidence, then show market understanding.' } },
  { keys: ['authenticity', 'momentum'],arc: { name: 'Authenticity & Journey Arc',    phases: ['Founder Insight', 'Building Journey', 'Real Validation'],          reason: 'Start with real insight, show the journey, then validate externally.' } },
  { keys: ['relevance', 'proof'],       arc: { name: 'Relevance & Evidence Arc',      phases: ['Industry Observation', 'PMF Discovery', 'Market Evidence'],        reason: 'Observe the market deeply, then build and show evidence.' } },
  { keys: ['authority', 'credibility'], arc: { name: 'Authority & Credibility Arc',   phases: ['Real Validation', 'Authority', 'Market Evidence'],                 reason: 'External proof and market evidence are the fastest credibility builders.' } },
  { keys: ['momentum', 'proof'],        arc: { name: 'Momentum & Proof Arc',          phases: ['Building Journey', 'Concept Building', 'Real Validation'],         reason: 'Show progress in motion, then document the evidence of work.' } },
  // Single-metric fallbacks
  { keys: ['authority'],    arc: { name: 'Authority Building Arc',    phases: ['Real Validation', 'Founder Insight', 'Industry Observation'], reason: 'Authority: validate, share insight, observe the market.' } },
  { keys: ['trust'],        arc: { name: 'Trust Building Arc',        phases: ['Real Validation', 'Market Evidence', 'PMF Discovery'],        reason: 'Trust: validate reality, build evidence, uncover PMF discoveries.' } },
  { keys: ['momentum'],     arc: { name: 'Momentum Building Arc',     phases: ['Building Journey', 'PMF Discovery', 'Real Validation'],       reason: 'Momentum: document the build, find discoveries, then validate.' } },
  { keys: ['proof'],        arc: { name: 'Proof Building Arc',        phases: ['Concept Building', 'Market Evidence', 'Real Validation'],     reason: 'Proof: build the concept, gather evidence, then validate.' } },
  { keys: ['relevance'],    arc: { name: 'Relevance Building Arc',    phases: ['Industry Observation', 'PMF Discovery', 'Founder Insight'],   reason: 'Relevance: observe deeply, discover patterns, share the insight.' } },
  { keys: ['credibility'],  arc: { name: 'Credibility Building Arc',  phases: ['Market Evidence', 'Real Validation', 'Authority'],           reason: 'Credibility: lead with evidence and validated authority.' } },
  { keys: ['capability'],   arc: { name: 'Capability Building Arc',   phases: ['Concept Building', 'Building Journey', 'Market Evidence'],   reason: 'Capability: demonstrate the work, show the journey, validate.' } },
  { keys: ['authenticity'], arc: { name: 'Authenticity Building Arc', phases: ['Founder Insight', 'PMF Discovery', 'Building Journey'],      reason: 'Authenticity: share real insight, discover, then show the build.' } },
  // Universal fallback
  { keys: [],               arc: { name: 'Balanced Content Arc',      phases: ['Real Validation', 'Building Journey', 'Industry Observation'], reason: 'All metrics are healthy — maintain balanced content production.' } },
]

// ── Utilities ─────────────────────────────────────────────────────────────────

function startOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function fmtShort(date) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtMonthYear(date) {
  return new Date(date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function sameWeek(d1, d2) {
  const a = startOfWeek(d1)
  const b = startOfWeek(d2)
  return a.getTime() === b.getTime()
}

// ── Core engine functions ─────────────────────────────────────────────────────

export function computeMetrics(personalSnap, oriSnap) {
  const all = []
  if (personalSnap) {
    for (const key of PERSONAL_KEYS) {
      if (personalSnap[key] != null) {
        all.push({ key, label: METRIC_LABELS[key], value: personalSnap[key], kind: 'personal' })
      }
    }
  }
  if (oriSnap) {
    for (const key of ORI_KEYS) {
      if (oriSnap[key] != null) {
        all.push({ key, label: METRIC_LABELS[key], value: oriSnap[key], kind: 'ori' })
      }
    }
  }
  return all.sort((a, b) => a.value - b.value)
}

export function computeAllocation(metrics) {
  const weak = metrics.filter(m => m.value < 9).slice(0, 5)
  if (!weak.length) {
    return [{ pillar: 'Building Journey', pct: 100, reason: 'All metrics are healthy — focus on journey content.', sourceMetric: null }]
  }

  // Squared inverse weights amplify weak signals
  const weights = weak.map(m => ({ metric: m, weight: Math.pow(Math.max(10 - m.value, 1), 2) }))
  const total   = weights.reduce((s, w) => s + w.weight, 0)

  const seen   = new Set()
  const result = []

  for (const { metric, weight } of weights) {
    const rule  = WEAK_SIGNAL_RULES[metric.key]
    const pillar = rule?.pillars[0] || 'Building Journey'
    if (seen.has(pillar)) continue
    seen.add(pillar)

    result.push({
      pillar,
      pct:          Math.round((weight / total) * 100),
      reason:       rule?.reason || `${metric.label} needs attention.`,
      sourceMetric: metric,
    })
  }

  // Normalize to exactly 100%
  const sum = result.reduce((s, r) => s + r.pct, 0)
  if (result.length > 0) result[0].pct += 100 - sum

  return result.sort((a, b) => b.pct - a.pct)
}

export function selectNarrativeArc(metrics) {
  const weakKeys = metrics.slice(0, 3).map(m => m.key)

  // Find best matching rule (most overlapping keys)
  let bestRule = null
  let bestScore = -1

  for (const rule of ARC_RULES) {
    if (rule.keys.length === 0) continue
    const score = rule.keys.filter(k => weakKeys.includes(k)).length
    if (score > bestScore) {
      bestScore = score
      bestRule  = rule
    }
  }

  return bestRule?.arc || ARC_RULES[ARC_RULES.length - 1].arc
}

export function generatePriorityRecs(metrics, events) {
  const weakest = metrics.slice(0, 3)
  const recent  = events.filter(e => (Date.now() - new Date(e.created_at)) < 7 * 24 * 3600 * 1000)
  const recs    = []

  for (const metric of weakest) {
    const rule = WEAK_SIGNAL_RULES[metric.key]
    if (!rule) continue

    const pillar   = rule.pillars[0]
    const narrative = rule.narratives[0]
    const related   = recent.filter(e => ['Conversation', 'Validation', 'Discovery', 'Observation'].includes(e.event_type)).slice(0, 2)

    recs.push({
      pillar,
      narrative_stack:  narrative,
      reason:           `${metric.label} is ${metric.value}/10. ${rule.reason}`,
      source_metric:    metric,
      source_events:    related.map(e => e.title || e.event_type),
      allocation_pct:   null,
      is_priority:      true,
    })
  }

  return recs
}

export function generateFutureForecasts(metrics, allocation, events, pmfData) {
  const forecasts = []
  const seen      = new Set()

  // State-driven future forecasts
  for (const alloc of allocation) {
    const rule      = Object.values(WEAK_SIGNAL_RULES).find(r => r.pillars[0] === alloc.pillar)
    const narratives = NARRATIVE_STACKS[alloc.pillar] || ['Field Notes']

    for (let i = 0; i < Math.min(2, narratives.length); i++) {
      const key = `${alloc.pillar}::${narratives[i]}`
      if (seen.has(key)) continue
      seen.add(key)

      forecasts.push({
        pillar:          alloc.pillar,
        narrative_stack: narratives[i],
        allocation_pct:  i === 0 ? alloc.pct : Math.round(alloc.pct * 0.4),
        reason:          alloc.reason,
        source_state:    alloc.sourceMetric
          ? { metric: alloc.sourceMetric.label, value: alloc.sourceMetric.value }
          : null,
        source_pmf_asset: null,
        is_priority:     false,
      })
    }
  }

  // PMF concept feature forecasts
  const activeFeatures = (pmfData?.features || []).filter(f => ['Idea', 'Testing'].includes(f.status)).slice(0, 3)
  const needsConceptBoost = metrics.slice(0, 3).some(m => ['proof', 'credibility', 'authority'].includes(m.key))

  if (needsConceptBoost || activeFeatures.length > 0) {
    for (const feature of activeFeatures) {
      const key = `Concept Building::Hypothesis::${feature.id}`
      if (!seen.has(key)) {
        seen.add(key)
        forecasts.push({
          pillar:          'Concept Building',
          narrative_stack: feature.status === 'Testing' ? 'Testing' : 'Hypothesis',
          allocation_pct:  Math.round(10 + (feature.status === 'Testing' ? 5 : 0)),
          reason:          `Concept Feature "${feature.title}" needs visibility to build proof.`,
          source_state:    null,
          source_pmf_asset: `Concept Feature: ${feature.title}`,
          is_priority:     false,
        })
      }
    }
  }

  // Root problem-driven forecasts
  const topProblems = (pmfData?.problems || []).filter(p => p.importance >= 8).slice(0, 2)
  for (const problem of topProblems) {
    const key = `PMF Discovery::${problem.problem}`
    if (!seen.has(key)) {
      seen.add(key)
      forecasts.push({
        pillar:          'PMF Discovery',
        narrative_stack: 'Problem Discovery',
        allocation_pct:  15,
        reason:          `Root problem "${problem.problem}" is high importance (${problem.importance}/10). Documenting it builds authority.`,
        source_state:    null,
        source_pmf_asset: `Root Problem: ${problem.problem}`,
        is_priority:     false,
      })
    }
  }

  return forecasts.slice(0, 12)
}

export function generateCalendarSchedule(arc, allocation) {
  const now    = new Date()
  const endDate = new Date('2026-12-31')
  const weeks  = []

  let cursor   = startOfWeek(now)
  let arcIdx   = 0

  while (cursor <= endDate) {
    const weekEnd = addDays(cursor, 6)
    const phase   = arc.phases[arcIdx % arc.phases.length]
    const stacks  = NARRATIVE_STACKS[phase] || ['Field Notes']
    const narrative = stacks[arcIdx % stacks.length]
    const alloc   = allocation[arcIdx % allocation.length]

    weeks.push({
      weekStart:     new Date(cursor),
      weekEnd,
      weekLabel:     `${fmtShort(cursor)} – ${fmtShort(weekEnd)}`,
      monthYear:     fmtMonthYear(cursor),
      pillar:        phase,
      narrative_stack: narrative,
      allocation_pct: alloc?.pct || 0,
      arcPhaseIndex: arcIdx % arc.phases.length,
      isCurrentWeek: sameWeek(cursor, now),
      month:         cursor.getMonth(),
      year:          cursor.getFullYear(),
    })

    cursor = addDays(cursor, 7)
    arcIdx++
  }

  return weeks
}

// ── Main export ───────────────────────────────────────────────────────────────

export function generateFutureNarrative({ personalSnap, oriSnap, events = [], pmfData = null }) {
  const metrics         = computeMetrics(personalSnap, oriSnap)
  const allocation      = computeAllocation(metrics)
  const arc             = selectNarrativeArc(metrics)
  const priorityRecs    = generatePriorityRecs(metrics, events)
  const futureForecasts = generateFutureForecasts(metrics, allocation, events, pmfData)
  const calendarSchedule = generateCalendarSchedule(arc, allocation)

  const weakestSignal  = metrics[0] ?? null
  const strongestSignal = metrics[metrics.length - 1] ?? null
  const topPillar      = allocation[0]?.pillar ?? null
  const topNarrative   = futureForecasts[0]?.narrative_stack ?? null

  return {
    metrics,
    weakestSignal,
    strongestSignal,
    allocation,
    arc,
    priorityRecs,
    futureForecasts,
    calendarSchedule,
    topPillar,
    topNarrative,
    generatedAt: new Date().toISOString(),
  }
}
