// Content Opportunities Engine — deterministic, rule-based. No AI/LLM.

// ── Reference data ────────────────────────────────────────────────────────────

export const PILLARS = [
  'Real Validation',
  'Building Journey',
  'PMF Discovery',
  'Founder Insight',
  'Market Evidence',
  'Industry Observation',
  'Concept Building',
  'Authority',
  'Trust',
]

export const NARRATIVE_STACKS = {
  'Real Validation':      ['Documentary', 'Validation', 'Field Notes', 'Authority Builder'],
  'Building Journey':     ['Builder', 'Progress Arc', 'Experiment', 'Behind The Scenes'],
  'PMF Discovery':        ['Problem Discovery', 'Need Discovery', 'Market Gap', 'Validation Trail', 'Pattern Recognition'],
  'Founder Insight':      ['Realization', 'Framework', 'Mental Model', 'Contrarian View', 'Observation'],
  'Market Evidence':      ['Evidence Review', 'Validation', 'Signal Collection', 'Pattern Analysis', 'Interpretation'],
  'Industry Observation': ['Field Notes', 'Observation', 'Pattern Analysis', 'Trend Watch'],
  'Concept Building':     ['Hypothesis', 'Experiment', 'Testing', 'Iteration'],
  'Authority':            ['Field Notes', 'Observation', 'Authority Builder', 'Framework'],
  'Trust':                ['Documentary', 'Validation', 'Field Notes', 'Evidence Review'],
}

export const STORY_TEMPLATES = {
  A: { name: 'Template A', steps: ['Preparation', 'Conversation', 'Insight', 'Reflection'] },
  B: { name: 'Template B', steps: ['Question', 'Research', 'Discovery', 'Implication'] },
  C: { name: 'Template C', steps: ['Visit', 'Observation', 'Pattern', 'Question'] },
  D: { name: 'Template D', steps: ['Goal', 'Work', 'Obstacle', 'Progress'] },
  E: { name: 'Template E', steps: ['Assumption', 'Conversation', 'Validation', 'Conclusion'] },
  F: { name: 'Template F', steps: ['Problem', 'Discovery', 'Insight', 'Next Step'] },
  G: { name: 'Template G', steps: ['Observation', 'Evidence', 'Interpretation', 'Question'] },
}

const PILLAR_TEMPLATE = {
  'Real Validation':      'E',
  'Building Journey':     'D',
  'PMF Discovery':        'F',
  'Founder Insight':      'B',
  'Market Evidence':      'G',
  'Industry Observation': 'C',
  'Concept Building':     'B',
  'Authority':            'A',
  'Trust':                'E',
}

const PILLAR_PLATFORM = {
  'Real Validation':      'Personal',
  'Building Journey':     'Personal',
  'PMF Discovery':        'Personal',
  'Founder Insight':      'Personal',
  'Market Evidence':      'Ori',
  'Industry Observation': 'Both',
  'Concept Building':     'Ori',
  'Authority':            'Ori',
  'Trust':                'Ori',
}

// Moments associated with each event type
const EVENT_MOMENTS = {
  'Conversation':  ['Conversation', 'Insight', 'Reflection'],
  'Visit':         ['Visit', 'Observation', 'First Impression'],
  'Discovery':     ['Discovery', 'Insight', 'Pattern'],
  'Observation':   ['Observation', 'Evidence', 'Pattern'],
  'Validation':    ['Validation', 'Evidence', 'Conclusion'],
  'Learning':      ['Learning', 'Insight', 'Reflection'],
  'Journey':       ['Progress', 'Challenge', 'Next Step'],
  'Outreach':      ['Conversation', 'Challenge', 'Next Step'],
  'Demo':          ['Experiment', 'Observation', 'Insight'],
  'Reply':         ['Conversation', 'Validation', 'Next Step'],
  'Lead':          ['Conversation', 'Discovery', 'Next Step'],
  'Client':        ['Progress', 'Validation', 'Evidence'],
  'Revenue':       ['Evidence', 'Validation', 'Conclusion'],
}

// Default moments per pillar (used when no event moments available)
const PILLAR_MOMENTS = {
  'Real Validation':      ['Conversation', 'Validation', 'Observation', 'Reflection'],
  'Building Journey':     ['Progress', 'Challenge', 'Experiment', 'Next Step'],
  'PMF Discovery':        ['Discovery', 'Observation', 'Insight', 'Pattern'],
  'Founder Insight':      ['Reflection', 'Question', 'Insight', 'Conclusion'],
  'Market Evidence':      ['Observation', 'Evidence', 'Pattern', 'Interpretation'],
  'Industry Observation': ['Visit', 'Observation', 'Pattern', 'Question'],
  'Concept Building':     ['Hypothesis', 'Experiment', 'Insight', 'Next Step'],
  'Authority':            ['Observation', 'Evidence', 'Insight', 'Conclusion'],
  'Trust':                ['Conversation', 'Validation', 'Evidence', 'Reflection'],
}

// ── Helpers ───────────────────────────────────────────────────────────────────

let _idCounter = 0
function makeId() {
  return `opp_${Date.now()}_${++_idCounter}`
}

function pickNarrative(pillar, idx) {
  const stacks = NARRATIVE_STACKS[pillar] || ['Field Notes']
  return stacks[idx % stacks.length]
}

function pickMoments(pillar, sourceEvents) {
  const fromEvents = []
  for (const ev of sourceEvents.slice(0, 3)) {
    const m = EVENT_MOMENTS[ev.event_type] || []
    fromEvents.push(...m)
  }
  const defaults = PILLAR_MOMENTS[pillar] || []
  const combined = [...new Set([...fromEvents, ...defaults])]
  return combined.slice(0, 4)
}

function buildOpportunity({ pillar, narrativeIdx, priority, sourceType, sourceEvents, sourcePmfAssets, reason }) {
  const template = STORY_TEMPLATES[PILLAR_TEMPLATE[pillar] || 'A']
  return {
    id: makeId(),
    platform: PILLAR_PLATFORM[pillar] || 'Both',
    visibility: PILLAR_PLATFORM[pillar] || 'Both',
    priority,
    primary_pillar: pillar,
    narrative_stack: pickNarrative(pillar, narrativeIdx),
    supporting_moments: pickMoments(pillar, sourceEvents),
    story_template: template,
    source_type: sourceType,
    source_events: sourceEvents.slice(0, 3).map(e => e.title || e.event_type),
    source_pmf_assets: sourcePmfAssets,
    reason,
  }
}

// ── Event Analysis ────────────────────────────────────────────────────────────

export function analyzeEvents(events) {
  const now = Date.now()
  const h24 = 24 * 60 * 60 * 1000
  const d3  = 3 * h24
  const d7  = 7 * h24

  const last24h = events.filter(e => now - new Date(e.created_at) < h24)
  const last3d  = events.filter(e => now - new Date(e.created_at) < d3)
  const last7d  = events.filter(e => now - new Date(e.created_at) < d7)

  const typeCount = {}
  for (const e of last7d) {
    typeCount[e.event_type] = (typeCount[e.event_type] || 0) + 1
  }

  const sortedTypes = Object.entries(typeCount).sort((a, b) => b[1] - a[1])
  const mostActive  = sortedTypes[0]?.[0] || null
  const mostRepeated = sortedTypes.find(([, c]) => c >= 2)?.[0] || null

  const strengthByType = {}
  for (const e of last7d) {
    if (e.strength) {
      strengthByType[e.event_type] = Math.max(strengthByType[e.event_type] || 0, e.strength)
    }
  }
  const mostValuable = Object.entries(strengthByType).sort((a, b) => b[1] - a[1])[0]?.[0] || null

  const segmentCount = {}
  for (const e of last7d) {
    if (e.segment) segmentCount[e.segment] = (segmentCount[e.segment] || 0) + 1
  }
  const mostRelevantSegment = Object.entries(segmentCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null

  const validationCount = last7d.filter(e => e.event_type === 'Validation').length
  const discoveryCount  = last7d.filter(e => ['Discovery', 'Observation'].includes(e.event_type)).length

  return {
    last24h,
    last3d,
    last7d,
    mostActive,
    mostRepeated,
    mostValuable,
    mostRelevantSegment,
    validationStrength: validationCount,
    discoveryStrength:  discoveryCount,
  }
}

// ── Opportunity Sources ───────────────────────────────────────────────────────

const METRIC_PILLARS = {
  // Personal
  authority:    [
    { pillar: 'Real Validation',  narrativeIdx: 0, reason: 'Authority is weak. Real validation builds credibility fast.' },
    { pillar: 'Founder Insight',  narrativeIdx: 1, reason: 'Authority gap needs thought leadership content.' },
    { pillar: 'Authority',        narrativeIdx: 2, reason: 'Low authority signals an authority builder opportunity.' },
  ],
  trust:        [
    { pillar: 'Real Validation',  narrativeIdx: 1, reason: 'Trust is low. Validation from real conversations builds trust.' },
    { pillar: 'Building Journey', narrativeIdx: 0, reason: 'Trust gap surfaces a building journey worth sharing.' },
  ],
  momentum:     [
    { pillar: 'Building Journey', narrativeIdx: 1, reason: 'Momentum is low. Progress arc content is the fix.' },
    { pillar: 'Founder Insight',  narrativeIdx: 2, reason: 'Momentum drop is worth a mental model post.' },
  ],
  authenticity: [
    { pillar: 'PMF Discovery',    narrativeIdx: 0, reason: 'Authenticity is low. PMF discoveries are raw and real.' },
    { pillar: 'Founder Insight',  narrativeIdx: 0, reason: 'Authenticity gap calls for a realization post.' },
  ],
  // Ori
  capability:   [
    { pillar: 'Concept Building', narrativeIdx: 0, reason: 'Capability needs proof through concept demonstration.' },
    { pillar: 'Market Evidence',  narrativeIdx: 2, reason: 'Capability gap requires market signal collection.' },
  ],
  credibility:  [
    { pillar: 'Trust',            narrativeIdx: 0, reason: 'Credibility is weak. Trust documentary fills this gap.' },
    { pillar: 'Real Validation',  narrativeIdx: 3, reason: 'Credibility needs authority builders.' },
  ],
  proof:        [
    { pillar: 'Market Evidence',  narrativeIdx: 1, reason: 'Proof is low. Market validation content closes this gap.' },
    { pillar: 'Real Validation',  narrativeIdx: 2, reason: 'Proof gap needs field validation field notes.' },
  ],
  relevance:    [
    { pillar: 'Industry Observation', narrativeIdx: 0, reason: 'Relevance is low. Field observation content builds it fast.' },
    { pillar: 'PMF Discovery',    narrativeIdx: 3, reason: 'Relevance gap reveals a validation trail opportunity.' },
  ],
}

const EVENT_TYPE_PILLARS = {
  'Conversation':  [
    { pillar: 'Real Validation',      narrativeIdx: 0 },
    { pillar: 'PMF Discovery',        narrativeIdx: 1 },
    { pillar: 'Founder Insight',      narrativeIdx: 0 },
    { pillar: 'Industry Observation', narrativeIdx: 3 },
    { pillar: 'Building Journey',     narrativeIdx: 3 },
  ],
  'Visit':         [
    { pillar: 'Industry Observation', narrativeIdx: 0 },
    { pillar: 'Founder Insight',      narrativeIdx: 4 },
    { pillar: 'Market Evidence',      narrativeIdx: 0 },
  ],
  'Validation':    [
    { pillar: 'Real Validation',      narrativeIdx: 1 },
    { pillar: 'Market Evidence',      narrativeIdx: 1 },
    { pillar: 'Trust',                narrativeIdx: 1 },
  ],
  'Discovery':     [
    { pillar: 'PMF Discovery',        narrativeIdx: 0 },
    { pillar: 'Industry Observation', narrativeIdx: 2 },
    { pillar: 'Founder Insight',      narrativeIdx: 0 },
    { pillar: 'Market Evidence',      narrativeIdx: 4 },
  ],
  'Observation':   [
    { pillar: 'Industry Observation', narrativeIdx: 1 },
    { pillar: 'Market Evidence',      narrativeIdx: 0 },
    { pillar: 'PMF Discovery',        narrativeIdx: 4 },
  ],
  'Learning':      [
    { pillar: 'Founder Insight',      narrativeIdx: 0 },
    { pillar: 'Industry Observation', narrativeIdx: 3 },
    { pillar: 'PMF Discovery',        narrativeIdx: 2 },
  ],
  'Journey':       [
    { pillar: 'Building Journey',     narrativeIdx: 1 },
    { pillar: 'Founder Insight',      narrativeIdx: 2 },
  ],
  'Demo':          [
    { pillar: 'Concept Building',     narrativeIdx: 0 },
    { pillar: 'Real Validation',      narrativeIdx: 2 },
    { pillar: 'Building Journey',     narrativeIdx: 2 },
  ],
  'Lead':          [
    { pillar: 'Real Validation',      narrativeIdx: 0 },
    { pillar: 'PMF Discovery',        narrativeIdx: 3 },
  ],
  'Client':        [
    { pillar: 'Building Journey',     narrativeIdx: 0 },
    { pillar: 'Market Evidence',      narrativeIdx: 2 },
  ],
  'Reply':         [
    { pillar: 'Real Validation',      narrativeIdx: 1 },
    { pillar: 'Founder Insight',      narrativeIdx: 0 },
  ],
  'Outreach':      [
    { pillar: 'Building Journey',     narrativeIdx: 3 },
    { pillar: 'Real Validation',      narrativeIdx: 0 },
  ],
  'Revenue':       [
    { pillar: 'Market Evidence',      narrativeIdx: 2 },
    { pillar: 'Real Validation',      narrativeIdx: 1 },
    { pillar: 'Authority',            narrativeIdx: 2 },
  ],
}

function fromState(personalSnap, oriSnap, events) {
  const results = []

  const metricValues = []
  if (personalSnap) {
    for (const key of ['authority', 'trust', 'momentum', 'authenticity']) {
      if (personalSnap[key] != null) metricValues.push({ key, value: personalSnap[key], kind: 'personal' })
    }
  }
  if (oriSnap) {
    for (const key of ['capability', 'credibility', 'proof', 'relevance']) {
      if (oriSnap[key] != null) metricValues.push({ key, value: oriSnap[key], kind: 'ori' })
    }
  }

  const weak = metricValues.filter(m => m.value <= 8).sort((a, b) => a.value - b.value).slice(0, 5)

  for (const metric of weak) {
    const templates = METRIC_PILLARS[metric.key] || []
    const priority  = metric.value <= 5 ? 'High' : 'Medium'

    for (const tmpl of templates) {
      const relevant = events.filter(e => {
        const m = EVENT_MOMENTS[e.event_type]
        return m && m.some(mo => PILLAR_MOMENTS[tmpl.pillar]?.includes(mo))
      }).slice(0, 3)

      results.push(buildOpportunity({
        ...tmpl,
        priority,
        sourceType: 'State',
        sourceEvents: relevant,
        sourcePmfAssets: [],
        reason: tmpl.reason,
      }))
    }
  }

  return results
}

function fromEvents(events, analysis) {
  const results = []
  const { last7d } = analysis

  // Group by event type
  const byType = {}
  for (const e of last7d) {
    if (!byType[e.event_type]) byType[e.event_type] = []
    byType[e.event_type].push(e)
  }

  for (const [eventType, evs] of Object.entries(byType)) {
    const mappings = EVENT_TYPE_PILLARS[eventType] || []
    const isRecent24h = evs.some(e => (Date.now() - new Date(e.created_at)) < 24 * 60 * 60 * 1000)
    const priority = isRecent24h ? 'High' : evs.length >= 2 ? 'High' : 'Medium'

    for (const mapping of mappings) {
      results.push(buildOpportunity({
        ...mapping,
        priority,
        sourceType: 'Event',
        sourceEvents: evs,
        sourcePmfAssets: [],
        reason: `Recent ${eventType} activity signals a ${mapping.pillar} opportunity.`,
      }))
    }
  }

  return results
}

function fromPMF(pmfData, events) {
  const results = []
  if (!pmfData) return results

  const { problems = [], features = [], needs = [] } = pmfData

  // From concept features
  for (const feature of features.filter(f => ['Idea', 'Testing'].includes(f.status)).slice(0, 5)) {
    const pmfAssets = [`Concept Feature: ${feature.title}`]
    if (feature.pmf_root_problems?.problem) {
      pmfAssets.push(`Root Problem: ${feature.pmf_root_problems.problem}`)
    }

    const priority = feature.status === 'Testing' ? 'High' : 'Medium'
    const relevantEvents = events.filter(e => ['Discovery', 'Observation', 'Validation', 'Conversation'].includes(e.event_type)).slice(0, 2)

    const mappings = [
      { pillar: 'PMF Discovery',    narrativeIdx: 0, reason: `"${feature.title}" hypothesis reveals a PMF discovery opportunity.` },
      { pillar: 'Real Validation',  narrativeIdx: 2, reason: `"${feature.title}" needs field validation through field notes.` },
      { pillar: 'Market Evidence',  narrativeIdx: 0, reason: `Gather market evidence to test the "${feature.title}" hypothesis.` },
      { pillar: 'Founder Insight',  narrativeIdx: 1, reason: `"${feature.title}" is worth sharing as a founder framework.` },
      { pillar: 'Industry Observation', narrativeIdx: 0, reason: `"${feature.title}" calls for direct market observation.` },
    ]

    for (const m of mappings.slice(0, 3)) {
      results.push(buildOpportunity({
        ...m,
        priority,
        sourceType: 'Concept Feature',
        sourceEvents: relevantEvents,
        sourcePmfAssets: pmfAssets,
      }))
    }
  }

  // From root problems (high importance)
  for (const problem of problems.filter(p => p.importance >= 8).slice(0, 3)) {
    const pmfAssets = [`Root Problem: ${problem.problem}`]
    const priority  = problem.importance >= 9 ? 'High' : 'Medium'
    const relevant  = events.filter(e => ['Observation', 'Discovery', 'Conversation'].includes(e.event_type)).slice(0, 2)

    const mappings = [
      { pillar: 'Market Evidence',  narrativeIdx: 3, reason: `Root problem "${problem.problem}" calls for pattern analysis content.` },
      { pillar: 'Authority',        narrativeIdx: 2, reason: `High-importance problem creates an authority builder opportunity.` },
      { pillar: 'Trust',            narrativeIdx: 0, reason: `Root problem "${problem.problem}" maps to a trust documentary.` },
      { pillar: 'PMF Discovery',    narrativeIdx: 2, reason: `Root problem surfaces a market gap to document.` },
    ]

    for (const m of mappings.slice(0, 2)) {
      results.push(buildOpportunity({
        ...m,
        priority,
        sourceType: 'PMF',
        sourceEvents: relevant,
        sourcePmfAssets: pmfAssets,
      }))
    }
  }

  // From value proposition
  if (pmfData.valueProp) {
    const relevant = events.filter(e => ['Conversation', 'Validation', 'Discovery'].includes(e.event_type)).slice(0, 2)
    results.push(buildOpportunity({
      pillar: 'Market Evidence',
      narrativeIdx: 0,
      priority: 'Medium',
      sourceType: 'PMF',
      sourceEvents: relevant,
      sourcePmfAssets: ['Value Proposition'],
      reason: 'Value proposition exists — evidence review content can validate it in market.',
    }))
  }

  return results
}

// ── Hybrid: state + recent events ─────────────────────────────────────────────

function fromHybrid(personalSnap, oriSnap, events, analysis) {
  const results = []
  const { last7d, validationStrength, discoveryStrength } = analysis

  if (validationStrength >= 2 && personalSnap && personalSnap.authority <= 6) {
    const validations = last7d.filter(e => e.event_type === 'Validation')
    results.push(buildOpportunity({
      pillar: 'Real Validation',
      narrativeIdx: 1,
      priority: 'High',
      sourceType: 'Hybrid',
      sourceEvents: validations.slice(0, 3),
      sourcePmfAssets: [],
      reason: 'Authority is weak and recent validation exists — strongest signal for Real Validation content.',
    }))
  }

  if (discoveryStrength >= 2) {
    const discoveries = last7d.filter(e => ['Discovery', 'Observation'].includes(e.event_type))
    results.push(buildOpportunity({
      pillar: 'PMF Discovery',
      narrativeIdx: 4,
      priority: 'High',
      sourceType: 'Hybrid',
      sourceEvents: discoveries.slice(0, 3),
      sourcePmfAssets: [],
      reason: 'Pattern of discovery/observation events — strong pattern recognition opportunity.',
    }))
  }

  return results
}

// ── Main export ───────────────────────────────────────────────────────────────

const PRIORITY_ORDER = { High: 0, Medium: 1, Low: 2 }

export function generateOpportunities({ personalSnap, oriSnap, events = [], pmfData = null }) {
  _idCounter = 0

  const analysis = analyzeEvents(events)

  const all = [
    ...fromHybrid(personalSnap, oriSnap, events, analysis),
    ...fromState(personalSnap, oriSnap, events),
    ...fromEvents(events, analysis),
    ...fromPMF(pmfData, events),
  ]

  // Deduplicate by pillar + narrative_stack
  const seen  = new Set()
  const deduped = []
  for (const opp of all) {
    const key = `${opp.primary_pillar}::${opp.narrative_stack}`
    if (!seen.has(key)) {
      seen.add(key)
      deduped.push(opp)
    }
  }

  // Cap at 16, sort by priority
  return deduped
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
    .slice(0, 16)
}
