export const EVENT_TYPE_LIST = [
  'Conversation', 'Visit', 'Demo', 'Reply', 'Learning',
  'Outreach', 'Lead', 'Client', 'Revenue',
  'Observation', 'Discovery', 'Validation', 'Journey',
]

export const OPERATIONAL_TYPES = [
  'Conversation', 'Visit', 'Demo', 'Reply', 'Learning',
  'Outreach', 'Lead', 'Client', 'Revenue',
]

export const CONTENT_EVIDENCE_TYPES = [
  'Observation', 'Discovery', 'Validation', 'Journey',
]

export const EVENT_SUBTYPES = {
  Conversation: ['Decision Maker', 'Staff', 'Online Inquiry'],
  Visit: ['Business Visit', 'Event Visit'],
  Demo: ['Started', 'In Progress', 'Completed'],
  Reply: ['Positive', 'Neutral', 'Negative', 'Interested'],
  Learning: ['Pain Point', 'Objection', 'Insight', 'Idea'],
  Outreach: ['Messages Sent', 'Follow-Up Sent', 'Call Scheduled'],
  Lead: ['Added', 'Qualified'],
  Client: ['Closed', 'Delivered', 'Testimonial'],
  Revenue: ['Payment Received'],
  Observation: ['Industry Observation', 'Competitor Observation', 'Pattern Noticed'],
  Discovery: ['PMF Discovery', 'Market Discovery', 'Customer Insight'],
  Validation: ['Positive Feedback', 'Business Mention', 'Interested Response', 'Proof Collected'],
  Journey: ['Current Focus', 'Current Challenge', 'Current Win', 'Current Experiment'],
}

export const SEGMENTS = ['Med Spa', 'Beauty', 'Dental', 'General']

export const VISIBILITY_TARGETS = ['Personal', 'Ori', 'Both', 'Internal']

export function computeStrength(type, subtype) {
  switch (type) {
    case 'Conversation': return 20
    case 'Visit': return 30
    case 'Demo':
      if (subtype === 'Started') return 20
      if (subtype === 'In Progress') return 30
      if (subtype === 'Completed') return 40
      return 20
    case 'Reply':
      if (subtype === 'Positive') return 50
      if (subtype === 'Interested') return 60
      return 10
    case 'Learning': return 10
    case 'Outreach': return 10
    case 'Lead':
      if (subtype === 'Qualified') return 70
      return 20
    case 'Client':
      if (subtype === 'Closed') return 100
      return 30
    case 'Revenue': return 120
    case 'Observation': return 15
    case 'Discovery': return 25
    case 'Validation':
      if (subtype === 'Interested Response') return 60
      return 40
    case 'Journey': return 10
    default: return 10
  }
}

// Per-type badge colors (bg, text)
export const TYPE_COLORS = {
  Conversation: { bg: '#fce4ed', text: '#e879a0' },
  Visit:        { bg: '#dbeafe', text: '#3b82f6' },
  Demo:         { bg: '#ede9fe', text: '#8b5cf6' },
  Reply:        { bg: '#fef3c7', text: '#d97706' },
  Learning:     { bg: '#fef9c3', text: '#ca8a04' },
  Outreach:     { bg: '#fee2e2', text: '#ef4444' },
  Lead:         { bg: '#e0e7ff', text: '#6366f1' },
  Client:       { bg: '#d1fae5', text: '#10b981' },
  Revenue:      { bg: '#bbf7d0', text: '#16a34a' },
  Observation:  { bg: '#f1f5f9', text: '#64748b' },
  Discovery:    { bg: '#ccfbf1', text: '#14b8a6' },
  Validation:   { bg: '#dcfce7', text: '#22c55e' },
  Journey:      { bg: '#f3e8ff', text: '#a855f7' },
}

// Auto-visibility rules — computed from type + subtype, never shown in the form
export function computeVisibility(type, subtype) {
  switch (type) {
    case 'Conversation': return 'Both'
    case 'Visit':        return 'Both'
    case 'Observation':  return 'Both'
    case 'Discovery':    return 'Both'
    case 'Validation':   return 'Both'
    case 'Learning':     return 'Both'
    case 'Demo':         return 'Ori'
    case 'Journey':      return 'Personal'
    case 'Outreach':     return 'Internal'
    case 'Lead':         return 'Internal'
    case 'Client':       return 'Internal'
    case 'Revenue':      return 'Internal'
    case 'Reply':
      return (subtype === 'Positive' || subtype === 'Interested') ? 'Both' : 'Internal'
    default: return 'Both'
  }
}

export const VISIBILITY_COLORS = {
  Personal: { bg: '#fce4ed', text: '#e879a0' },
  Ori:      { bg: '#dbeafe', text: '#3b82f6' },
  Both:     { bg: '#dcfce7', text: '#16a34a' },
  Internal: { bg: '#f1f5f9', text: '#64748b' },
}

export const QUICK_ADD_PRESETS = [
  { label: 'Talked to Decision Maker', type: 'Conversation', subtype: 'Decision Maker' },
  { label: 'Talked to Staff',           type: 'Conversation', subtype: 'Staff' },
  { label: 'Online Inquiry',            type: 'Conversation', subtype: 'Online Inquiry' },
  { label: 'Visited Business',          type: 'Visit',        subtype: 'Business Visit' },
  { label: 'Finished Demo',             type: 'Demo',         subtype: 'Completed' },
  { label: 'Positive Reply',            type: 'Reply',        subtype: 'Positive' },
  { label: 'Sent Outreach',             type: 'Outreach',     subtype: 'Messages Sent' },
  { label: 'Learned Insight',           type: 'Learning',     subtype: 'Insight' },
  { label: 'Current Challenge',         type: 'Journey',      subtype: 'Current Challenge' },
  { label: 'Current Win',               type: 'Journey',      subtype: 'Current Win' },
]
