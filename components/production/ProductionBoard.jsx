'use client'

import { PRODUCTION_STAGES, PRODUCTION_STAGE_COLORS } from '@/lib/clientsConfig'
import ProductionCard from './ProductionCard'

export default function ProductionBoard({ items, onView, onStageChange }) {
  const grouped = PRODUCTION_STAGES.reduce((acc, stage) => {
    acc[stage] = items.filter((i) => (i.stage || 'Waiting Assets') === stage)
    return acc
  }, {})

  return (
    <div className="overflow-x-auto pb-4 -mx-6 px-6">
      <div className="flex gap-3 min-w-max">
        {PRODUCTION_STAGES.map((stage) => {
          const cols  = PRODUCTION_STAGE_COLORS[stage]
          const cards = grouped[stage]

          return (
            <div key={stage} className="w-60 flex-shrink-0 flex flex-col">
              {/* Column header */}
              <div
                className="flex items-center justify-between px-3 py-2 rounded-t-xl border border-b-0"
                style={{ backgroundColor: cols.bg, borderColor: cols.border }}
              >
                <span className="text-xs font-semibold" style={{ color: cols.text }}>{stage}</span>
                <span className="text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: cols.border, color: cols.text }}>
                  {cards.length}
                </span>
              </div>

              {/* Cards */}
              <div
                className="flex-1 min-h-[160px] max-h-[calc(100vh-300px)] overflow-y-auto rounded-b-xl border p-2 space-y-2"
                style={{ borderColor: cols.border, backgroundColor: `${cols.bg}40` }}
              >
                {cards.length === 0 ? (
                  <div className="flex items-center justify-center h-12">
                    <p className="text-[11px] text-[#c4b5c0]">Empty</p>
                  </div>
                ) : (
                  cards.map((item) => (
                    <ProductionCard
                      key={item.id}
                      item={item}
                      onView={onView}
                      onStageChange={onStageChange}
                    />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
