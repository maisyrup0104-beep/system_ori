// Active pipeline stages (displayed in table status dropdown)
export const ACTIVE_STAGES = ['Lead', 'Contacted', 'Replied', 'Qualified', 'Proposal']

// All stages including Closed (for dropdowns that need to include it)
export const STAGES = [...ACTIVE_STAGES, 'Closed']

// Stage colors for status badges
export const STAGE_COLORS = {
  Lead:      { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0' },
  Contacted: { bg: '#dbeafe', text: '#3b82f6', border: '#bfdbfe' },
  Replied:   { bg: '#fef3c7', text: '#d97706', border: '#fde68a' },
  Qualified: { bg: '#ede9fe', text: '#8b5cf6', border: '#ddd6fe' },
  Proposal:  { bg: '#fce4ed', text: '#e879a0', border: '#fbc8db' },
  Closed:    { bg: '#dcfce7', text: '#16a34a', border: '#bbf7d0' },
  // Legacy values kept for backward-compatible display
  Prospect:  { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0' },
  Interested:{ bg: '#fce4ed', text: '#e879a0', border: '#fbc8db' },
  Lost:      { bg: '#f3f4f6', text: '#9ca3af', border: '#e5e7eb' },
}

export const SEGMENTS = ['Medical Spa', 'Skincare Clinic', 'Aesthetic Derma', 'General']

export const SOURCES = [
  'Facebook DM', 'Instagram DM', 'Referral', 'Cold Call', 'Email', 'Walk-in', 'Other',
]

export const PAYMENT_STATUSES = ['Unpaid', 'Partial', 'Paid', 'Free']

export function computePriority(stage) {
  switch (stage) {
    case 'Proposal':  return 'High'
    case 'Qualified':
    case 'Replied':   return 'Medium'
    case 'Contacted':
    case 'Lead':
    case 'Prospect':  return 'Low'
    default:          return null
  }
}

export const PRIORITY_COLORS = {
  High:   { bg: '#fce4ed', text: '#e879a0' },
  Medium: { bg: '#fef3c7', text: '#d97706' },
  Low:    { bg: '#f1f5f9', text: '#64748b' },
}
