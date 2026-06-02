'use client'

function getWeekStart() {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const start = new Date(now)
  start.setDate(now.getDate() + diff)
  start.setHours(0, 0, 0, 0)
  return start
}

export default function EventStats({ events }) {
  const weekStart = getWeekStart()

  const thisWeek     = events.filter(e => new Date(e.created_at) >= weekStart).length
  const conversations = events.filter(e => e.event_type === 'Conversation').length
  const demos        = events.filter(e => e.event_type === 'Demo' && e.event_subtype === 'Completed').length
  const positive     = events.filter(e => e.event_type === 'Reply' && e.event_subtype === 'Positive').length
  const discoveries  = events.filter(e => e.event_type === 'Discovery').length
  const validations  = events.filter(e => e.event_type === 'Validation').length

  const stats = [
    { label: 'Events This Week', value: thisWeek,     accent: true },
    { label: 'Conversations',    value: conversations, accent: false },
    { label: 'Demos Completed',  value: demos,         accent: false },
    { label: 'Positive Replies', value: positive,      accent: false },
    { label: 'Discoveries',      value: discoveries,   accent: false },
    { label: 'Validations',      value: validations,   accent: false },
  ]

  return (
    <div className="grid grid-cols-6 gap-3 mb-6">
      {stats.map((s) => (
        <div key={s.label} className="bg-white rounded-xl border border-[#f0e8ee] p-4">
          <p className="text-xs text-[#9ca3af] mb-1 leading-tight">{s.label}</p>
          <p className={`text-2xl font-semibold tracking-tight ${s.accent ? 'text-[#e879a0]' : 'text-[#1a1a2e]'}`}>
            {s.value}
          </p>
        </div>
      ))}
    </div>
  )
}
