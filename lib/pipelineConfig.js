export const STAGES = [
  'Prospect', 'Contacted', 'Replied', 'Interested',
  'Qualified', 'Proposal', 'Closed', 'Lost',
]

export const ACTIVE_STAGES = STAGES.filter((s) => s !== 'Lost' && s !== 'Closed')

export const STAGE_COLORS = {
  Prospect:  { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0' },
  Contacted: { bg: '#dbeafe', text: '#3b82f6', border: '#bfdbfe' },
  Replied:   { bg: '#fef3c7', text: '#d97706', border: '#fde68a' },
  Interested:{ bg: '#fce4ed', text: '#e879a0', border: '#fbc8db' },
  Qualified: { bg: '#ede9fe', text: '#8b5cf6', border: '#ddd6fe' },
  Proposal:  { bg: '#e0e7ff', text: '#6366f1', border: '#c7d2fe' },
  Closed:    { bg: '#dcfce7', text: '#16a34a', border: '#bbf7d0' },
  Lost:      { bg: '#f3f4f6', text: '#9ca3af', border: '#e5e7eb' },
}

export const SEGMENTS = ['Med Spa', 'Beauty', 'Dental', 'General']

export const PAYMENT_STATUSES = ['Unpaid', 'Partial', 'Paid', 'Free']

export function computePriority(stage) {
  switch (stage) {
    case 'Interested':
    case 'Proposal': return 'High'
    case 'Qualified':
    case 'Replied': return 'Medium'
    case 'Contacted':
    case 'Prospect': return 'Low'
    default: return null
  }
}

export const PRIORITY_COLORS = {
  High:   { bg: '#fce4ed', text: '#e879a0' },
  Medium: { bg: '#fef3c7', text: '#d97706' },
  Low:    { bg: '#f1f5f9', text: '#64748b' },
}
