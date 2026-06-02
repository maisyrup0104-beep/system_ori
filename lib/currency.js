export function formatPHP(value) {
  if (value === null || value === undefined) return '₱0'
  return `₱${Number(value).toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}
