'use client'

import { QUICK_ADD_PRESETS, TYPE_COLORS } from '@/lib/eventConfig'

export default function QuickAddButtons({ onQuickAdd }) {
  return (
    <div className="mb-5">
      <p className="text-xs text-[#9ca3af] mb-2 font-medium uppercase tracking-wide">Quick Add</p>
      <div className="flex flex-wrap gap-2">
        {QUICK_ADD_PRESETS.map((preset) => {
          const colors = TYPE_COLORS[preset.type] || { bg: '#f1f5f9', text: '#64748b' }
          return (
            <button
              key={preset.label}
              onClick={() => onQuickAdd({ event_type: preset.type, event_subtype: preset.subtype })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80 hover:shadow-sm active:scale-95"
              style={{ backgroundColor: colors.bg, color: colors.text }}
            >
              <span className="text-[10px] font-bold">+</span>
              {preset.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
