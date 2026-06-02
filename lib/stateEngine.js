// Deterministic state engine — no AI, no LLM. Pure rule-based logic.

// ── Metric definitions ────────────────────────────────────────────────────────

export const PERSONAL_METRICS = [
  { key: 'authority',    label: 'Authority',    question: 'Do I look competent?' },
  { key: 'trust',        label: 'Trust',        question: 'Do people trust me?' },
  { key: 'momentum',     label: 'Momentum',     question: 'Am I visibly progressing?' },
  { key: 'authenticity', label: 'Authenticity', question: 'Do I feel real?' },
]

export const ORI_METRICS = [
  { key: 'capability',  label: 'Capability',  question: 'Can we do the work?' },
  { key: 'credibility', label: 'Credibility', question: 'Would businesses trust Ori?' },
  { key: 'proof',       label: 'Proof',       question: 'Do we have evidence?' },
  { key: 'relevance',   label: 'Relevance',   question: 'Do we understand the market?' },
]

// ── Content mapping ───────────────────────────────────────────────────────────

export const CONTENT_CATEGORIES = {
  // Personal
  'Real Validation':      { target: 'Personal', eventTypes: ['Conversation', 'Reply', 'Validation'] },
  'Building Journey':     { target: 'Personal', eventTypes: ['Journey', 'Demo', 'Outreach'] },
  'PMF Discoveries':      { target: 'Personal', eventTypes: ['Discovery', 'Observation', 'Learning'] },
  'Industry Observations':{ target: 'Personal', eventTypes: ['Observation'] },
  // Ori
  'Concept Features':     { target: 'Ori', eventTypes: ['Demo'] },
  'Trust':                { target: 'Ori', eventTypes: ['Discovery', 'Learning', 'Validation'] },
  'Market Evidence':      { target: 'Ori', eventTypes: ['Conversation', 'Observation', 'Discovery'] },
  'Differentiation':      { target: 'Ori', eventTypes: ['Observation', 'Discovery'] },
  'Premium Perception':   { target: 'Ori', eventTypes: ['Discovery', 'Learning'] },
}

// Metric → primary content category
const PERSONAL_CONTENT_MAP = {
  authority:    'Real Validation',
  trust:        'Real Validation',
  momentum:     'Building Journey',
  authenticity: 'PMF Discoveries',
}

const ORI_CONTENT_MAP = {
  capability:  'Concept Features',
  credibility: 'Trust',
  proof:       'Concept Features',
  relevance:   'Market Evidence',
}

// ── Action rules ──────────────────────────────────────────────────────────────

const ACTION_MAP = {
  trust:        { action: 'Talk to 5 businesses',           detail: 'Build trust through direct conversations with decision makers.' },
  proof:        { action: 'Finish one demo',                detail: 'Complete a demo session to collect concrete proof.' },
  relevance:    { action: 'Visit a clinic or spa',          detail: 'Observe the target market directly to strengthen relevance.' },
  momentum:     { action: 'Send 20 outreach messages',      detail: 'Increase activity volume to build visible progress.' },
  authority:    { action: 'Share an industry observation',  detail: 'Post a real field insight to establish competence.' },
  authenticity: { action: 'Document a current challenge',   detail: 'Be honest about a real struggle to feel more genuine.' },
  capability:   { action: 'Build or improve a demo feature',detail: 'Strengthen the product to prove Ori can deliver.' },
  credibility:  { action: 'Collect a validation or testimonial', detail: 'Gather real proof that businesses believe in Ori.' },
}

// ── Utilities ─────────────────────────────────────────────────────────────────

export function scoreLabel(v) {
  if (!v)    return 'Not rated'
  if (v <= 3) return 'Critical'
  if (v <= 5) return 'Low'
  if (v <= 7) return 'Moderate'
  return 'Strong'
}

export function scoreColor(v) {
  if (!v)     return { text: '#9ca3af', bg: '#f1f5f9' }
  if (v <= 3) return { text: '#ef4444', bg: '#fee2e2' }
  if (v <= 5) return { text: '#d97706', bg: '#fef3c7' }
  if (v <= 7) return { text: '#16a34a', bg: '#dcfce7' }
  return { text: '#0d9488', bg: '#ccfbf1' }
}

export function trendArrow(current, previous) {
  if (previous == null) return { symbol: '—', color: '#9ca3af' }
  const diff = current - previous
  if (diff > 0) return { symbol: `↑ +${diff}`, color: '#16a34a' }
  if (diff < 0) return { symbol: `↓ ${diff}`, color: '#ef4444' }
  return { symbol: '→ 0', color: '#9ca3af' }
}

export function daysSinceLastReview(snapshots) {
  if (!snapshots || snapshots.length === 0) return null
  const last = new Date(snapshots[0].created_at)
  const now  = new Date()
  return Math.floor((now - last) / (1000 * 60 * 60 * 24))
}

// ── Core engine ───────────────────────────────────────────────────────────────

function flatMetrics(personalState, oriState) {
  const all = []
  if (personalState) {
    for (const m of PERSONAL_METRICS) {
      if (personalState[m.key] != null)
        all.push({ ...m, value: personalState[m.key], kind: 'personal' })
    }
  }
  if (oriState) {
    for (const m of ORI_METRICS) {
      if (oriState[m.key] != null)
        all.push({ ...m, value: oriState[m.key], kind: 'ori' })
    }
  }
  return all.sort((a, b) => a.value - b.value)
}

// Returns the single weakest metric across all personal + ori states
export function findCriticalSignal(personalState, oriState) {
  const sorted = flatMetrics(personalState, oriState)
  return sorted[0] ?? null
}

// Returns top N weakest metrics
export function findWeakestMetrics(personalState, oriState, n = 3) {
  return flatMetrics(personalState, oriState).slice(0, n)
}

// Evidence: count events per content category
export function getEvidenceCounts(events) {
  const counts = {}
  for (const [cat, cfg] of Object.entries(CONTENT_CATEGORIES)) {
    counts[cat] = events.filter(e => cfg.eventTypes.includes(e.event_type)).length
  }
  return counts
}

// Generate action recommendations (top 3 weakest metrics → actions)
export function generateActionRecommendations(personalState, oriState) {
  return flatMetrics(personalState, oriState)
    .slice(0, 3)
    .map((m) => {
      const rule = ACTION_MAP[m.key]
      if (!rule) return null
      return {
        metric:  m.label,
        value:   m.value,
        kind:    m.kind,
        action:  rule.action,
        detail:  rule.detail,
      }
    })
    .filter(Boolean)
}

// Generate content recommendations (top 2 weakest → content category + supporting events)
export function generateContentRecommendations(personalState, oriState, events) {
  const weakest = flatMetrics(personalState, oriState).slice(0, 3)
  const seen    = new Set()
  const recs    = []

  for (const m of weakest) {
    const catKey = m.kind === 'personal' ? PERSONAL_CONTENT_MAP[m.key] : ORI_CONTENT_MAP[m.key]
    if (!catKey || seen.has(catKey)) continue
    seen.add(catKey)

    const cfg  = CONTENT_CATEGORIES[catKey]
    const supporting = events
      .filter(e => cfg.eventTypes.includes(e.event_type))
      .slice(0, 3)

    recs.push({
      platform:        cfg.target,
      category:        catKey,
      reason:          `${m.label} is ${scoreLabel(m.value).toLowerCase()} (${m.value}/10).`,
      metric:          m.label,
      metricValue:     m.value,
      eventTypes:      cfg.eventTypes,
      supportingEvents: supporting,
    })

    if (recs.length >= 3) break
  }

  return recs
}
