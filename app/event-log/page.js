'use client'

import { useEffect, useMemo, useState } from 'react'
import PageContainer from '@/components/shared/PageContainer'
import LoadingState from '@/components/shared/LoadingState'
import EventStats from '@/components/events/EventStats'
import EventFilters from '@/components/events/EventFilters'
import QuickAddButtons from '@/components/events/QuickAddButtons'
import EventTable from '@/components/events/EventTable'
import TimelineView from '@/components/events/TimelineView'
import EventForm from '@/components/events/EventForm'
import EventDrawer from '@/components/events/EventDrawer'
import { Button } from '@/components/ui/button'
import { getEvents, createEvent, updateEvent, deleteEvent } from '@/services/events'
import { computeStrength, computeVisibility } from '@/lib/eventConfig'
import { TableIcon, AlignLeftIcon, PlusIcon } from 'lucide-react'

const EMPTY_FILTERS = { search: '', type: '', subtype: '', segment: '', visibility: '', dateFrom: '', dateTo: '' }

export default function EventLogPage() {
  const [events, setEvents]   = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView]       = useState('table')
  const [filters, setFilters] = useState(EMPTY_FILTERS)

  const [modal, setModal]   = useState({ open: false, mode: 'add', event: null })
  const [drawer, setDrawer] = useState({ open: false, event: null })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const data = await getEvents()
      setEvents(data || [])
    } catch {
      // silently handled — user sees empty state
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (filters.search && !e.title.toLowerCase().includes(filters.search.toLowerCase())) return false
      if (filters.type && e.event_type !== filters.type) return false
      if (filters.subtype && e.event_subtype !== filters.subtype) return false
      if (filters.segment && e.segment !== filters.segment) return false
      if (filters.visibility && e.visibility_target !== filters.visibility) return false
      if (filters.dateFrom && new Date(e.created_at) < new Date(filters.dateFrom)) return false
      if (filters.dateTo && new Date(e.created_at) > new Date(filters.dateTo + 'T23:59:59')) return false
      return true
    })
  }, [events, filters])

  function openAdd(defaults = {}) {
    setModal({ open: true, mode: 'add', event: defaults })
  }

  function openEdit(event) {
    setDrawer({ open: false, event: null })
    setModal({ open: true, mode: 'edit', event })
  }

  function openDrawer(event) {
    setDrawer({ open: true, event })
  }

  async function handleSave(values) {
    const strength = computeStrength(values.event_type, values.event_subtype)

    let visibility_target
    if (modal.mode === 'add') {
      visibility_target = computeVisibility(values.event_type, values.event_subtype)
    } else {
      // Re-compute only if type or subtype changed; otherwise preserve existing (may be manually overridden)
      const orig = modal.event
      const typeChanged = values.event_type !== orig.event_type || values.event_subtype !== orig.event_subtype
      visibility_target = typeChanged
        ? computeVisibility(values.event_type, values.event_subtype)
        : orig.visibility_target
    }

    if (modal.mode === 'add') {
      await createEvent({ ...values, strength, visibility_target })
    } else {
      await updateEvent(modal.event.id, { ...values, strength, visibility_target })
    }
    setModal({ open: false, mode: 'add', event: null })
    await load()
  }

  async function handleVisibilityOverride(id, value) {
    await updateEvent(id, { visibility_target: value })
    // Optimistic update — no full reload needed
    setEvents((prev) => prev.map((e) => e.id === id ? { ...e, visibility_target: value } : e))
    setDrawer((prev) => prev.event?.id === id
      ? { ...prev, event: { ...prev.event, visibility_target: value } }
      : prev
    )
  }

  async function handleDelete(id) {
    if (!confirm('Delete this event? This cannot be undone.')) return
    await deleteEvent(id)
    await load()
  }

  if (loading) return <LoadingState message="Loading events..." />

  return (
    <>
      <PageContainer className="max-w-7xl">
        {/* Page header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-[#1a1a2e] tracking-tight">Event Log</h1>
            <p className="text-sm text-[#9ca3af] mt-0.5">
              {events.length} total event{events.length !== 1 ? 's' : ''} — the source of truth for the sprint.
            </p>
          </div>
          <Button
            onClick={() => openAdd()}
            className="bg-[#e879a0] hover:bg-[#d4648a] text-white gap-1.5"
          >
            <PlusIcon size={14} />
            Add Event
          </Button>
        </div>

        {/* Stats */}
        <EventStats events={events} />

        {/* Quick Add */}
        <QuickAddButtons onQuickAdd={openAdd} />

        {/* Toolbar: filters + view toggle */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <EventFilters filters={filters} onChange={setFilters} />

          <div className="flex items-center gap-1 flex-shrink-0 bg-[#f9f0f5] rounded-lg p-1">
            <button
              onClick={() => setView('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                view === 'table'
                  ? 'bg-white text-[#e879a0] shadow-sm'
                  : 'text-[#9ca3af] hover:text-[#6b7280]'
              }`}
            >
              <TableIcon size={13} />
              Table
            </button>
            <button
              onClick={() => setView('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                view === 'timeline'
                  ? 'bg-white text-[#e879a0] shadow-sm'
                  : 'text-[#9ca3af] hover:text-[#6b7280]'
              }`}
            >
              <AlignLeftIcon size={13} />
              Timeline
            </button>
          </div>
        </div>

        {/* Result count */}
        {events.length > 0 && (
          <p className="text-xs text-[#c4b5c0] mb-3">
            {filtered.length === events.length
              ? `${events.length} event${events.length !== 1 ? 's' : ''}`
              : `${filtered.length} of ${events.length} events`}
          </p>
        )}

        {/* Main view */}
        {view === 'table' ? (
          <EventTable
            events={filtered}
            onEdit={openEdit}
            onDelete={handleDelete}
            onView={openDrawer}
          />
        ) : (
          <TimelineView
            events={filtered}
            onEdit={openEdit}
            onDelete={handleDelete}
            onView={openDrawer}
          />
        )}
      </PageContainer>

      {/* Add / Edit modal */}
      <EventForm
        open={modal.open}
        mode={modal.mode}
        event={modal.event}
        onSave={handleSave}
        onClose={() => setModal({ ...modal, open: false })}
      />

      {/* Detail drawer */}
      <EventDrawer
        open={drawer.open}
        event={drawer.event}
        onClose={() => setDrawer({ open: false, event: null })}
        onEdit={openEdit}
        onVisibilityOverride={handleVisibilityOverride}
      />
    </>
  )
}
