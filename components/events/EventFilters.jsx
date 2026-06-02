'use client'

import { EVENT_TYPE_LIST, EVENT_SUBTYPES, SEGMENTS, VISIBILITY_TARGETS } from '@/lib/eventConfig'

const sel = 'h-8 px-2 text-sm border border-[#f0e8ee] rounded-lg bg-white text-[#4b5563] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#f9a8c3]'

export default function EventFilters({ filters, onChange }) {
  function set(key, value) {
    if (key === 'type') {
      onChange({ ...filters, type: value, subtype: '' })
    } else {
      onChange({ ...filters, [key]: value })
    }
  }

  const subtypes = filters.type ? (EVENT_SUBTYPES[filters.type] || []) : []
  const hasFilters = filters.search || filters.type || filters.segment || filters.visibility || filters.dateFrom || filters.dateTo

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="text"
        placeholder="Search events..."
        value={filters.search}
        onChange={(e) => set('search', e.target.value)}
        className={`${sel} w-44 pl-2.5`}
      />

      <select value={filters.type} onChange={(e) => set('type', e.target.value)} className={`${sel} w-36`}>
        <option value="">All Types</option>
        {EVENT_TYPE_LIST.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>

      {filters.type && subtypes.length > 0 && (
        <select value={filters.subtype} onChange={(e) => set('subtype', e.target.value)} className={`${sel} w-44`}>
          <option value="">All Subtypes</option>
          {subtypes.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      )}

      <select value={filters.segment} onChange={(e) => set('segment', e.target.value)} className={`${sel} w-32`}>
        <option value="">All Segments</option>
        {SEGMENTS.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      <select value={filters.visibility} onChange={(e) => set('visibility', e.target.value)} className={`${sel} w-36`}>
        <option value="">All Visibility</option>
        {VISIBILITY_TARGETS.map((v) => (
          <option key={v} value={v}>{v}</option>
        ))}
      </select>

      <input
        type="date"
        value={filters.dateFrom}
        onChange={(e) => set('dateFrom', e.target.value)}
        className={`${sel} w-36`}
      />
      <input
        type="date"
        value={filters.dateTo}
        onChange={(e) => set('dateTo', e.target.value)}
        className={`${sel} w-36`}
      />

      {hasFilters && (
        <button
          onClick={() => onChange({ search: '', type: '', subtype: '', segment: '', visibility: '', dateFrom: '', dateTo: '' })}
          className="h-8 px-3 text-xs text-[#9ca3af] border border-[#f0e8ee] rounded-lg hover:bg-[#fce4ed]/40 transition-colors"
        >
          Clear
        </button>
      )}
    </div>
  )
}
