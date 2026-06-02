'use client'

import {
  CLIENT_TYPE_COLORS, CLIENT_STATUS_COLORS,
  PAYMENT_COLORS, TESTIMONIAL_COLORS,
} from '@/lib/clientsConfig'
import { formatPHP } from '@/lib/currency'

function Badge({ value, colors }) {
  const c = colors[value] || { bg: '#f1f5f9', text: '#64748b' }
  return (
    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: c.bg, color: c.text }}>
      {value}
    </span>
  )
}

export default function ClientCard({ client, onClick }) {
  const testimonialsNeeded =
    client.client_status === 'Delivered' && client.testimonial_status === 'Not Requested'

  return (
    <div
      className="bg-white rounded-xl border border-[#f0e8ee] p-4 cursor-pointer hover:border-[#fce4ed] hover:shadow-sm transition-all"
      onClick={onClick}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex flex-wrap gap-1">
          <Badge value={client.client_type || 'Paid Client'} colors={CLIENT_TYPE_COLORS} />
          <Badge value={client.client_status || 'Active'} colors={CLIENT_STATUS_COLORS} />
        </div>
        {testimonialsNeeded && (
          <span className="text-[10px] font-bold text-[#d97706] bg-[#fef3c7] px-1.5 py-0.5 rounded whitespace-nowrap">
            ★ Testimonial
          </span>
        )}
      </div>

      {/* Business name */}
      <p className="text-sm font-semibold text-[#1a1a2e] mb-0.5">{client.business_name}</p>
      <p className="text-xs text-[#9ca3af] mb-3">{client.segment || '—'}{client.package_name ? ` · ${client.package_name}` : ''}</p>

      {/* Revenue */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[10px] text-[#c4b5c0]">Quoted</p>
          <p className="text-xs text-[#9ca3af]">{client.price != null ? formatPHP(client.price) : '—'}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-[#c4b5c0]">Actual Revenue</p>
          <p className="text-sm font-semibold text-[#16a34a]">{formatPHP(client.actual_revenue)}</p>
        </div>
      </div>

      {/* Status row */}
      <div className="flex items-center justify-between pt-2.5 border-t border-[#f0e8ee]">
        <Badge value={client.payment_status || 'Unpaid'} colors={PAYMENT_COLORS} />
        <Badge value={client.testimonial_status || 'Not Requested'} colors={TESTIMONIAL_COLORS} />
      </div>
    </div>
  )
}
