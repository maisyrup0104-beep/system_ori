'use client'

import { PRODUCTION_STAGES, PRODUCTION_STAGE_COLORS, CLIENT_TYPE_COLORS, isWaitingTooLong, isDeliveryAtRisk, getAutoDeliveryStatus, DELIVERY_STATUS_COLORS } from '@/lib/clientsConfig'
import { CalendarIcon, AlertTriangleIcon } from 'lucide-react'

function formatDate(str) {
  if (!str) return null
  return new Date(str).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
}

export default function ProductionCard({ item, onView, onStageChange }) {
  const client        = item.clients || {}
  const delivStatus   = getAutoDeliveryStatus({ ...item, delivery_date: client.delivery_date ?? item.delivery_date })
  const dsColors      = DELIVERY_STATUS_COLORS[delivStatus] || DELIVERY_STATUS_COLORS['On Track']
  const waitFlag      = isWaitingTooLong(item)
  const riskFlag      = isDeliveryAtRisk({ ...item, delivery_date: client.delivery_date ?? item.delivery_date })
  const typeColors    = CLIENT_TYPE_COLORS[client.client_type] || CLIENT_TYPE_COLORS['Paid Client']
  const dueDate       = client.delivery_date ?? item.delivery_date

  const suggestTestimonial = item.stage === 'Delivered' && client.testimonial_status === 'Not Requested'

  function handleStageChange(e) {
    e.stopPropagation()
    onStageChange(item.id, e.target.value, item.stage, client.id)
  }

  return (
    <div
      className="bg-white rounded-xl border border-[#f0e8ee] p-3.5 cursor-pointer hover:border-[#fce4ed] hover:shadow-sm transition-all"
      onClick={() => onView(item)}
    >
      {/* Flags */}
      {(waitFlag || riskFlag || suggestTestimonial) && (
        <div className="flex flex-wrap gap-1 mb-2">
          {waitFlag && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-[#ef4444] bg-[#fee2e2] px-1.5 py-0.5 rounded">
              <AlertTriangleIcon size={9} /> Waiting &gt;7d
            </span>
          )}
          {riskFlag && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-[#d97706] bg-[#fef3c7] px-1.5 py-0.5 rounded">
              <AlertTriangleIcon size={9} /> Overdue
            </span>
          )}
          {suggestTestimonial && (
            <span className="text-[10px] font-semibold text-[#0d9488] bg-[#ccfbf1] px-1.5 py-0.5 rounded">
              ★ Request Testimonial
            </span>
          )}
        </div>
      )}

      {/* Client type + name */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-sm font-semibold text-[#1a1a2e] leading-snug">{client.business_name || 'Unknown'}</p>
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0" style={{ backgroundColor: typeColors.bg, color: typeColors.text }}>
          {client.client_type || 'Paid'}
        </span>
      </div>
      {client.segment && <p className="text-xs text-[#9ca3af] mb-2">{client.segment}</p>}

      {/* Delivery info */}
      <div className="flex items-center justify-between mb-3">
        {dueDate && (
          <div className="flex items-center gap-1 text-[11px] text-[#9ca3af]">
            <CalendarIcon size={10} />
            {formatDate(dueDate)}
          </div>
        )}
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: dsColors.bg, color: dsColors.text }}>
          {delivStatus}
        </span>
      </div>

      {/* Stage selector */}
      <div className="pt-2.5 border-t border-[#f0e8ee]" onClick={(e) => e.stopPropagation()}>
        <select
          value={item.stage || 'Waiting Assets'}
          onChange={handleStageChange}
          className="w-full h-7 px-2 text-xs border border-[#f0e8ee] rounded-lg bg-white text-[#4b5563] focus:outline-none focus:ring-1 focus:ring-[#f9a8c3] cursor-pointer"
        >
          {PRODUCTION_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
    </div>
  )
}
