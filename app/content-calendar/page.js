'use client'

import { useEffect, useMemo, useState } from 'react'
import LoadingState from '@/components/shared/LoadingState'
import { getQueue, updateQueueItem, updateQueueStatus } from '@/services/contentOpportunities'
import { ChevronLeftIcon, ChevronRightIcon, XIcon, CalendarIcon } from 'lucide-react'

// ── Constants ─────────────────────────────────────────────────────────────────

const DAYS_SHORT  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June',
                     'July', 'August', 'September', 'October', 'November', 'December']

const PILLAR_ABBREV = {
  'Real Validation':      { abbrev: 'RV',  bg: '#fce4ed', text: '#e879a0' },
  'Building Journey':     { abbrev: 'BJ',  bg: '#dcfce7', text: '#16a34a' },
  'PMF Discovery':        { abbrev: 'PMF', bg: '#fef9c3', text: '#ca8a04' },
  'Founder Insight':      { abbrev: 'FI',  bg: '#ede9fe', text: '#7c3aed' },
  'Market Evidence':      { abbrev: 'ME',  bg: '#dbeafe', text: '#1d4ed8' },
  'Industry Observation': { abbrev: 'IO',  bg: '#f3f4f6', text: '#374151' },
  'Concept Building':     { abbrev: 'CB',  bg: '#fef3c7', text: '#b45309' },
}

const STATUS_COLORS = {
  'Queued':          { bg: '#f3f4f6', text: '#6b7280',  dot: '#9ca3af' },
  'Drafting':        { bg: '#fce4ed', text: '#e879a0',  dot: '#e879a0' },
  'Ready To Record': { bg: '#ede9fe', text: '#7c3aed',  dot: '#7c3aed' },
  'Recorded':        { bg: '#dbeafe', text: '#1d4ed8',  dot: '#1d4ed8' },
  'Ready To Post':   { bg: '#dcfce7', text: '#16a34a',  dot: '#22c55e' },
  'Posted':          { bg: '#bbf7d0', text: '#15803d',  dot: '#16a34a' },
  'Archived':        { bg: '#e5e7eb', text: '#9ca3af',  dot: '#9ca3af' },
}

const STATUSES_ALL = ['Queued', 'Drafting', 'Ready To Record', 'Recorded', 'Ready To Post', 'Posted', 'Archived']

// ── Helpers ───────────────────────────────────────────────────────────────────

function toDateStr(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function fmtDateLong(str) {
  if (!str) return ''
  const d = new Date(str + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function isToday(dateStr) {
  return dateStr === toDateStr(new Date())
}

function getMonthGrid(year, month) {
  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevDays    = new Date(year, month, 0).getDate()
  const cells       = []

  for (let i = firstDay - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevDays - i)
    cells.push({ date: d, dateStr: toDateStr(d), isCurrentMonth: false })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    cells.push({ date, dateStr: toDateStr(date), isCurrentMonth: true })
  }
  const remaining = 42 - cells.length
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i)
    cells.push({ date: d, dateStr: toDateStr(d), isCurrentMonth: false })
  }
  return cells
}

function getWeekDates(anchorDate) {
  const d = new Date(anchorDate)
  d.setDate(d.getDate() - d.getDay())
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(d)
    day.setDate(d.getDate() + i)
    return { date: day, dateStr: toDateStr(day) }
  })
}

// ── Pillar badge abbreviation ─────────────────────────────────────────────────

function PillarBadge({ pillar, small }) {
  const s = PILLAR_ABBREV[pillar] || { abbrev: '?', bg: '#f3f4f6', text: '#6b7280' }
  return (
    <span className={`inline-flex items-center font-semibold rounded ${small ? 'px-1 py-0 text-[9px]' : 'px-1.5 py-0.5 text-[10px]'}`}
      style={{ backgroundColor: s.bg, color: s.text }}>
      {s.abbrev}
    </span>
  )
}

// ── Calendar Cell ─────────────────────────────────────────────────────────────

function CalendarCell({ cell, items, onSelect, onDrop, onDragStart }) {
  const cellItems  = items.filter(i => i.scheduled_date === cell.dateStr)
  const displayed  = cellItems.slice(0, 3)
  const extra      = cellItems.length - 3
  const today      = isToday(cell.dateStr)

  return (
    <div
      className={`min-h-[90px] p-1.5 border-b border-r border-[#f0e8ee] cursor-pointer transition-colors select-none ${
        cell.isCurrentMonth ? 'bg-white hover:bg-[#fdf9fb]' : 'bg-[#fafafa]'
      } ${today ? 'ring-inset ring-2 ring-[#e879a0]/60' : ''}`}
      onClick={() => onSelect(cell)}
      onDragOver={e => e.preventDefault()}
      onDrop={e => onDrop(e, cell.dateStr)}
    >
      <p className={`text-xs font-semibold mb-1 ${
        today ? 'w-5 h-5 rounded-full bg-[#e879a0] text-white flex items-center justify-center text-[10px]'
              : cell.isCurrentMonth ? 'text-[#1a1a2e]' : 'text-[#d1c4cb]'
      }`}>
        {cell.date.getDate()}
      </p>
      <div className="flex flex-wrap gap-0.5">
        {displayed.map(item => (
          <span
            key={item.id}
            draggable
            onDragStart={e => onDragStart(e, item.id)}
            onClick={e => e.stopPropagation()}
            title={`${item.primary_pillar} — ${item.narrative_stack || ''} (${item.status})`}
          >
            <PillarBadge pillar={item.primary_pillar} small />
          </span>
        ))}
        {extra > 0 && <span className="text-[9px] text-[#9ca3af] leading-none mt-0.5">+{extra}</span>}
      </div>
    </div>
  )
}

// ── Month View ────────────────────────────────────────────────────────────────

function MonthView({ year, month, items, onSelectDate, dragging, setDragging, onMoveToDate }) {
  const cells = useMemo(() => getMonthGrid(year, month), [year, month])

  function handleDragStart(e, itemId) {
    setDragging(itemId)
    e.dataTransfer.setData('text/plain', itemId)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDrop(e, dateStr) {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    if (id) onMoveToDate(id, dateStr)
    setDragging(null)
  }

  return (
    <div className="border-l border-t border-[#f0e8ee] rounded-xl overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 bg-[#fdf9fb] border-b border-[#f0e8ee]">
        {DAYS_SHORT.map(d => (
          <div key={d} className="px-2 py-2 text-center text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide">
            {d}
          </div>
        ))}
      </div>
      {/* Cells grid */}
      <div className="grid grid-cols-7">
        {cells.map((cell, i) => (
          <CalendarCell
            key={i}
            cell={cell}
            items={items}
            onSelect={() => onSelectDate(cell.dateStr)}
            onDrop={handleDrop}
            onDragStart={handleDragStart}
          />
        ))}
      </div>
    </div>
  )
}

// ── Week View ─────────────────────────────────────────────────────────────────

function WeekView({ anchorDate, items, onSelectDate, onMoveToDate, setDragging }) {
  const days = useMemo(() => getWeekDates(anchorDate), [anchorDate])

  function handleDragStart(e, itemId) {
    setDragging(itemId)
    e.dataTransfer.setData('text/plain', itemId)
  }

  function handleDrop(e, dateStr) {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    if (id) onMoveToDate(id, dateStr)
    setDragging(null)
  }

  return (
    <div className="border border-[#f0e8ee] rounded-xl overflow-hidden">
      <div className="grid grid-cols-7">
        {days.map(({ date, dateStr }) => {
          const dayItems = items.filter(i => i.scheduled_date === dateStr)
          const today    = isToday(dateStr)
          return (
            <div key={dateStr} className="border-r border-[#f0e8ee] last:border-r-0"
              onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, dateStr)}>
              <div
                className={`px-3 py-2 border-b border-[#f0e8ee] cursor-pointer hover:bg-[#fdf9fb] transition-colors ${today ? 'bg-[#fdf2f6]' : 'bg-[#fdf9fb]'}`}
                onClick={() => onSelectDate(dateStr)}
              >
                <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide">{DAYS_SHORT[date.getDay()]}</p>
                <p className={`text-lg font-semibold mt-0.5 ${today ? 'text-[#e879a0]' : 'text-[#1a1a2e]'}`}>{date.getDate()}</p>
              </div>
              <div className="p-2 min-h-[120px] space-y-1">
                {dayItems.map(item => {
                  const s = STATUS_COLORS[item.status] || STATUS_COLORS.Queued
                  return (
                    <div key={item.id} draggable onDragStart={e => handleDragStart(e, item.id)}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg cursor-grab active:cursor-grabbing"
                      style={{ backgroundColor: s.bg }}>
                      <PillarBadge pillar={item.primary_pillar} small />
                      <span className="text-[10px] font-medium truncate" style={{ color: s.text }}>
                        {item.narrative_stack || item.primary_pillar}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Year View ─────────────────────────────────────────────────────────────────

function YearView({ year, items, onNavigateToMonth }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {Array.from({ length: 12 }, (_, m) => {
        const cells = getMonthGrid(year, m)
        const monthItems = items.filter(i => {
          if (!i.scheduled_date) return false
          const d = new Date(i.scheduled_date + 'T00:00:00')
          return d.getFullYear() === year && d.getMonth() === m
        })
        return (
          <div key={m} className="bg-white rounded-xl border border-[#f0e8ee] p-3 cursor-pointer hover:border-[#fce4ed] transition-colors"
            onClick={() => onNavigateToMonth(year, m)}>
            <p className="text-xs font-semibold text-[#1a1a2e] mb-2">{MONTHS_LONG[m]}</p>
            {/* Mini grid */}
            <div className="grid grid-cols-7 gap-px mb-1">
              {['S','M','T','W','T','F','S'].map((d, i) => (
                <div key={i} className="text-center text-[9px] text-[#c4b5c0]">{d}</div>
              ))}
              {cells.map((cell, i) => {
                const hasItems = monthItems.some(item => item.scheduled_date === cell.dateStr)
                return (
                  <div key={i} className={`w-full aspect-square rounded-sm flex items-center justify-center ${
                    !cell.isCurrentMonth ? 'opacity-30' : ''
                  } ${isToday(cell.dateStr) ? 'ring-1 ring-[#e879a0]' : ''}`}>
                    {hasItems ? (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#e879a0]" />
                    ) : (
                      <span className="text-[8px] text-[#c4b5c0]">{cell.date.getDate()}</span>
                    )}
                  </div>
                )
              })}
            </div>
            {monthItems.length > 0 && (
              <p className="text-[10px] text-[#9ca3af] mt-1">{monthItems.length} item{monthItems.length !== 1 ? 's' : ''} scheduled</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Date Detail Panel ─────────────────────────────────────────────────────────

function DateDetailPanel({ dateStr, items, onClose, onStatusChange, onUnschedule, onSaveNotes, updatingId }) {
  const dayItems = items.filter(i => i.scheduled_date === dateStr)
  const [notesMap,    setNotesMap]    = useState({})
  const [changedIds,  setChangedIds]  = useState(new Set())
  const [savingNotes, setSavingNotes] = useState(null)

  function handleNoteChange(id, val) {
    setNotesMap(prev => ({ ...prev, [id]: val }))
    setChangedIds(prev => new Set([...prev, id]))
  }

  async function handleSaveNote(id) {
    setSavingNotes(id)
    try {
      await onSaveNotes(id, notesMap[id] ?? '')
      setChangedIds(prev => { const s = new Set(prev); s.delete(id); return s })
    } finally {
      setSavingNotes(null)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/10 z-30" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-[400px] bg-white border-l border-[#f0e8ee] z-40 flex flex-col shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-[#f0e8ee] shrink-0">
          <div>
            <p className="text-[11px] text-[#9ca3af] mb-0.5">Scheduled Content</p>
            <p className="text-sm font-semibold text-[#1a1a2e]">{fmtDateLong(dateStr)}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#9ca3af] hover:text-[#1a1a2e] hover:bg-[#fdf2f6] transition-colors">
            <XIcon size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {dayItems.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon size={24} className="text-[#f0e8ee] mx-auto mb-2" />
              <p className="text-sm text-[#c4b5c0]">Nothing scheduled for this day.</p>
              <p className="text-xs text-[#c4b5c0] mt-1">Drag items from other dates, or schedule from Queue.</p>
            </div>
          ) : (
            dayItems.map(item => {
              const s   = PILLAR_ABBREV[item.primary_pillar] || { abbrev: '?', bg: '#f3f4f6', text: '#6b7280' }
              const st  = STATUS_COLORS[item.status] || STATUS_COLORS.Queued
              const noteVal = notesMap[item.id] ?? item.notes ?? ''

              return (
                <div key={item.id} className="bg-[#fdf9fb] border border-[#f0e8ee] rounded-xl p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
                        style={{ backgroundColor: s.bg, color: s.text }}>{s.abbrev}</span>
                      <span className="text-sm font-semibold text-[#1a1a2e]">{item.primary_pillar}</span>
                    </div>
                    <button onClick={() => onUnschedule(item.id)}
                      className="text-[11px] text-[#9ca3af] hover:text-red-500 transition-colors whitespace-nowrap shrink-0">
                      Unschedule
                    </button>
                  </div>

                  {/* Narrative + Blueprint */}
                  {item.narrative_stack && <p className="text-xs text-[#e879a0] font-medium">{item.narrative_stack}</p>}
                  {item.blueprint_name  && <p className="text-[11px] text-[#9ca3af]">Blueprint: <span className="font-medium text-[#6b7280]">{item.blueprint_name}</span></p>}

                  {/* Blueprint moments */}
                  {(item.blueprint_life_moments?.length > 0 || item.blueprint_work_moments?.length > 0 || item.blueprint_reflection_moments?.length > 0) && (
                    <div className="space-y-1.5">
                      {[
                        { label: 'Life',       items: item.blueprint_life_moments,       bg: '#fdf2f6', color: '#6b5b6e' },
                        { label: 'Work',       items: item.blueprint_work_moments,        bg: '#dcfce7', color: '#16a34a' },
                        { label: 'Reflection', items: item.blueprint_reflection_moments, bg: '#ede9fe', color: '#7c3aed' },
                      ].map(({ label, items: mItems, bg, color }) => mItems?.length > 0 && (
                        <div key={label} className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-[#c4b5c0]">{label}</span>
                          {mItems.map((m, i) => <span key={i} className="inline-flex items-center px-1.5 py-0 rounded text-[10px]" style={{ backgroundColor: bg, color }}>{m}</span>)}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Status */}
                  <div>
                    <p className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wide mb-1">Status</p>
                    <div className="flex flex-wrap gap-1">
                      {STATUSES_ALL.map(s => (
                        <button key={s} disabled={updatingId === item.id}
                          onClick={() => onStatusChange(item.id, s)}
                          className="px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors border"
                          style={item.status === s
                            ? { backgroundColor: STATUS_COLORS[s]?.bg, color: STATUS_COLORS[s]?.text, borderColor: STATUS_COLORS[s]?.text + '55' }
                            : { backgroundColor: 'white', color: '#9ca3af', borderColor: '#f0e8ee' }
                          }>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <p className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wide mb-1">Notes</p>
                    <textarea
                      className="w-full border border-[#f0e8ee] rounded-lg px-2.5 py-1.5 text-xs text-[#1a1a2e] bg-white focus:outline-none focus:ring-2 focus:ring-[#f9a8c3] resize-none placeholder-[#c4b5c0]"
                      rows={2}
                      placeholder="Recording notes, ideas…"
                      value={noteVal}
                      onChange={e => handleNoteChange(item.id, e.target.value)}
                    />
                    {changedIds.has(item.id) && (
                      <button onClick={() => handleSaveNote(item.id)} disabled={savingNotes === item.id}
                        className="mt-1 px-2.5 py-1 text-[11px] font-medium bg-[#e879a0] text-white rounded-lg hover:bg-[#d4659a] transition-colors disabled:opacity-50">
                        {savingNotes === item.id ? 'Saving…' : 'Save'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}

// ── Legend ────────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-4 px-1">
      {Object.entries(PILLAR_ABBREV).map(([pillar, s]) => (
        <div key={pillar} className="flex items-center gap-1.5">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ backgroundColor: s.bg, color: s.text }}>{s.abbrev}</span>
          <span className="text-[11px] text-[#9ca3af]">{pillar}</span>
        </div>
      ))}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ContentCalendarPage() {
  const today = new Date()

  const [items,        setItems]        = useState([])
  const [loading,      setLoading]      = useState(true)
  const [currentDate,  setCurrentDate]  = useState(today)
  const [view,         setView]         = useState('month')
  const [selectedDate, setSelectedDate] = useState(null)
  const [dragging,     setDragging]     = useState(null)
  const [updatingId,   setUpdatingId]   = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const data = await getQueue()
      setItems(data || [])
    } finally {
      setLoading(false)
    }
  }

  const scheduledItems = useMemo(() => items.filter(i => i.scheduled_date), [items])

  // ── Navigation ──────────────────────────────────────────────────────────────

  function navigatePrev() {
    const d = new Date(currentDate)
    if (view === 'month') d.setMonth(d.getMonth() - 1)
    else if (view === 'week') d.setDate(d.getDate() - 7)
    else d.setFullYear(d.getFullYear() - 1)
    setCurrentDate(d)
  }

  function navigateNext() {
    const d = new Date(currentDate)
    if (view === 'month') d.setMonth(d.getMonth() + 1)
    else if (view === 'week') d.setDate(d.getDate() + 7)
    else d.setFullYear(d.getFullYear() + 1)
    setCurrentDate(d)
  }

  function navigateToMonth(year, month) {
    setCurrentDate(new Date(year, month, 1))
    setView('month')
  }

  // ── Actions ─────────────────────────────────────────────────────────────────

  async function handleMoveToDate(id, dateStr) {
    setUpdatingId(id)
    try {
      const updated = await updateQueueItem(id, { scheduled_date: dateStr })
      setItems(prev => prev.map(i => i.id === id ? updated : i))
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleUnschedule(id) {
    setUpdatingId(id)
    try {
      const updated = await updateQueueItem(id, { scheduled_date: null })
      setItems(prev => prev.map(i => i.id === id ? updated : i))
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleStatusChange(id, status) {
    setUpdatingId(id)
    try {
      const updated = await updateQueueStatus(id, status)
      setItems(prev => prev.map(i => i.id === id ? updated : i))
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleSaveNotes(id, notes) {
    const updated = await updateQueueItem(id, { notes })
    setItems(prev => prev.map(i => i.id === id ? updated : i))
  }

  // ── Header label ────────────────────────────────────────────────────────────

  function headerLabel() {
    if (view === 'month') return `${MONTHS_LONG[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    if (view === 'week') {
      const days = getWeekDates(currentDate)
      const first = days[0].date
      const last  = days[6].date
      if (first.getMonth() === last.getMonth()) return `${MONTHS_LONG[first.getMonth()]} ${first.getFullYear()}`
      return `${MONTHS_LONG[first.getMonth()]} – ${MONTHS_LONG[last.getMonth()]} ${last.getFullYear()}`
    }
    return String(currentDate.getFullYear())
  }

  if (loading) return <LoadingState message="Loading calendar…" />

  return (
    <div className={`min-h-full transition-all ${selectedDate ? 'mr-[400px]' : ''}`}>
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-[#1a1a2e] tracking-tight">Content Calendar</h1>
            <p className="text-sm text-[#9ca3af] mt-0.5">
              Scheduling engine — content from your Queue.
              {scheduledItems.length > 0 && ` ${scheduledItems.length} item${scheduledItems.length !== 1 ? 's' : ''} scheduled.`}
            </p>
          </div>
          {/* View + Navigation */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {['week', 'month', 'year'].map(v => (
                <button key={v} onClick={() => setView(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                    view === v ? 'bg-[#fce4ed] text-[#e879a0]' : 'text-[#6b7280] hover:bg-[#fdf2f6] hover:text-[#e879a0]'
                  }`}>
                  {v}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={navigatePrev} className="p-1.5 rounded-lg text-[#6b7280] hover:bg-[#fdf2f6] hover:text-[#e879a0] transition-colors">
                <ChevronLeftIcon size={16} />
              </button>
              <button onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#6b7280] border border-[#f0e8ee] hover:bg-[#fdf2f6] hover:text-[#e879a0] transition-colors">
                Today
              </button>
              <button onClick={navigateNext} className="p-1.5 rounded-lg text-[#6b7280] hover:bg-[#fdf2f6] hover:text-[#e879a0] transition-colors">
                <ChevronRightIcon size={16} />
              </button>
            </div>
            <p className="text-sm font-semibold text-[#1a1a2e] min-w-[180px] text-right">{headerLabel()}</p>
          </div>
        </div>

        {/* Legend */}
        <Legend />

        {/* Empty state */}
        {scheduledItems.length === 0 && (
          <div className="bg-white rounded-xl border border-[#f0e8ee] py-12 text-center mb-4">
            <CalendarIcon size={32} className="text-[#f0e8ee] mx-auto mb-3" />
            <p className="text-sm text-[#9ca3af]">No content scheduled yet.</p>
            <p className="text-xs text-[#c4b5c0] mt-1">Go to <strong>Queue</strong>, open an item, and set a schedule date.</p>
          </div>
        )}

        {/* Calendar Views */}
        {view === 'month' && (
          <MonthView
            year={currentDate.getFullYear()}
            month={currentDate.getMonth()}
            items={scheduledItems}
            onSelectDate={setSelectedDate}
            dragging={dragging}
            setDragging={setDragging}
            onMoveToDate={handleMoveToDate}
          />
        )}
        {view === 'week' && (
          <WeekView
            anchorDate={currentDate}
            items={scheduledItems}
            onSelectDate={setSelectedDate}
            onMoveToDate={handleMoveToDate}
            setDragging={setDragging}
          />
        )}
        {view === 'year' && (
          <YearView
            year={currentDate.getFullYear()}
            items={scheduledItems}
            onNavigateToMonth={navigateToMonth}
          />
        )}
      </div>

      {/* Date Detail Panel */}
      {selectedDate && (
        <DateDetailPanel
          dateStr={selectedDate}
          items={scheduledItems}
          onClose={() => setSelectedDate(null)}
          onStatusChange={handleStatusChange}
          onUnschedule={handleUnschedule}
          onSaveNotes={handleSaveNotes}
          updatingId={updatingId}
        />
      )}
    </div>
  )
}
