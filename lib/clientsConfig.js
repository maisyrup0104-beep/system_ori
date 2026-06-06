export const CLIENT_TYPES    = ['Paid Client', 'Free Sample', 'Demo Project']
export const CLIENT_STATUSES = ['Active', 'Waiting Assets', 'In Production', 'Review', 'Delivered', 'Completed']
export const PRODUCTION_STAGES  = ['Waiting Assets', 'Script', 'Production', 'Review', 'Delivered', 'Testimonial']
export const DELIVERY_STATUSES  = ['On Track', 'At Risk', 'Late', 'Delivered']
export const TESTIMONIAL_STATUSES = ['Not Requested', 'Requested', 'Received', 'Published']
export const PAYMENT_STATUSES   = ['Unpaid', 'Partial', 'Paid', 'Free', 'Demo']
export const SEGMENTS           = ['Medical Spa', 'Skincare Clinic', 'Aesthetic Derma', 'General']

export const INTAKE_ITEMS = [
  { key: 'photos',        label: 'Photos' },
  { key: 'videos',        label: 'Videos' },
  { key: 'logo',          label: 'Logo' },
  { key: 'brand_colors',  label: 'Brand Colors' },
  { key: 'business_info', label: 'Business Information' },
  { key: 'social_links',  label: 'Social Links' },
]

export const CLIENT_TYPE_COLORS = {
  'Paid Client':  { bg: '#dcfce7', text: '#16a34a' },
  'Free Sample':  { bg: '#fce4ed', text: '#e879a0' },
  'Demo Project': { bg: '#f1f5f9', text: '#64748b' },
}

export const CLIENT_STATUS_COLORS = {
  'Active':         { bg: '#dbeafe', text: '#3b82f6' },
  'Waiting Assets': { bg: '#fef3c7', text: '#d97706' },
  'In Production':  { bg: '#ede9fe', text: '#8b5cf6' },
  'Review':         { bg: '#fce4ed', text: '#e879a0' },
  'Delivered':      { bg: '#dcfce7', text: '#16a34a' },
  'Completed':      { bg: '#f1f5f9', text: '#64748b' },
}

export const PRODUCTION_STAGE_COLORS = {
  'Waiting Assets': { bg: '#fef3c7', border: '#fde68a', text: '#d97706' },
  'Script':         { bg: '#e0e7ff', border: '#c7d2fe', text: '#6366f1' },
  'Production':     { bg: '#ede9fe', border: '#ddd6fe', text: '#8b5cf6' },
  'Review':         { bg: '#fce4ed', border: '#fbc8db', text: '#e879a0' },
  'Delivered':      { bg: '#dcfce7', border: '#bbf7d0', text: '#16a34a' },
  'Testimonial':    { bg: '#ccfbf1', border: '#99f6e4', text: '#0d9488' },
}

export const TESTIMONIAL_COLORS = {
  'Not Requested': { bg: '#f1f5f9', text: '#64748b' },
  'Requested':     { bg: '#fef3c7', text: '#d97706' },
  'Received':      { bg: '#dbeafe', text: '#3b82f6' },
  'Published':     { bg: '#dcfce7', text: '#16a34a' },
}

export const DELIVERY_STATUS_COLORS = {
  'On Track':  { bg: '#dcfce7', text: '#16a34a' },
  'At Risk':   { bg: '#fef3c7', text: '#d97706' },
  'Late':      { bg: '#fee2e2', text: '#ef4444' },
  'Delivered': { bg: '#ccfbf1', text: '#0d9488' },
}

export const PAYMENT_COLORS = {
  'Paid':    { bg: '#dcfce7', text: '#16a34a' },
  'Partial': { bg: '#fef3c7', text: '#d97706' },
  'Unpaid':  { bg: '#fee2e2', text: '#ef4444' },
  'Free':    { bg: '#f1f5f9', text: '#64748b' },
  'Demo':    { bg: '#f1f5f9', text: '#64748b' },
}

// ── Automation rules ──────────────────────────────────────────────────────────

export function isWaitingTooLong(item) {
  if (item.stage !== 'Waiting Assets') return false
  const days = (Date.now() - new Date(item.created_at)) / (1000 * 60 * 60 * 24)
  return days > 7
}

export function isDeliveryAtRisk(item) {
  if (!item.delivery_date) return false
  if (['Delivered', 'Testimonial'].includes(item.stage)) return false
  return new Date(item.delivery_date) < new Date()
}

export function getAutoDeliveryStatus(item) {
  if (['Delivered', 'Testimonial'].includes(item.stage)) return 'Delivered'
  if (!item.delivery_date) return 'On Track'
  const now = new Date()
  const due = new Date(item.delivery_date)
  if (due < now) return 'Late'
  const daysLeft = (due - now) / (1000 * 60 * 60 * 24)
  if (daysLeft <= 2) return 'At Risk'
  return 'On Track'
}
