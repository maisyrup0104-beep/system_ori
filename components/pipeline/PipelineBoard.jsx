'use client'

import { STAGES, STAGE_COLORS } from '@/lib/pipelineConfig'
import LeadCard from './LeadCard'

export default function PipelineBoard({ leads, onView, onStageChange, onAddNote, onScheduleFollowUp, onEdit, onDelete }) {
  const grouped = STAGES.reduce((acc, stage) => {
    acc[stage] = leads.filter((l) => (l.stage || 'Prospect') === stage)
    return acc
  }, {})

  return (
    <div className="overflow-x-auto pb-4 -mx-6 px-6">
      <div className="flex gap-3 min-w-max">
        {STAGES.map((stage) => {
          const cols = STAGE_COLORS[stage]
          const cards = grouped[stage]

          return (
            <div key={stage} className="w-64 flex-shrink-0 flex flex-col">
              {/* Column header */}
              <div
                className="flex items-center justify-between px-3 py-2 rounded-t-xl border border-b-0 mb-0"
                style={{ backgroundColor: cols.bg, borderColor: cols.border }}
              >
                <span className="text-xs font-semibold" style={{ color: cols.text }}>{stage}</span>
                <span
                  className="text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: cols.border, color: cols.text }}
                >
                  {cards.length}
                </span>
              </div>

              {/* Cards container */}
              <div
                className="flex-1 min-h-[200px] max-h-[calc(100vh-280px)] overflow-y-auto rounded-b-xl border p-2 space-y-2"
                style={{ borderColor: cols.border, backgroundColor: `${cols.bg}40` }}
              >
                {cards.length === 0 ? (
                  <div className="flex items-center justify-center h-16">
                    <p className="text-[11px] text-[#c4b5c0]">Empty</p>
                  </div>
                ) : (
                  cards.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      onView={onView}
                      onStageChange={onStageChange}
                      onAddNote={onAddNote}
                      onScheduleFollowUp={onScheduleFollowUp}
                      onEdit={onEdit}
                      onDelete={onDelete}
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
