'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { XIcon } from 'lucide-react'
import {
  EVENT_TYPE_LIST,
  EVENT_SUBTYPES,
  SEGMENTS,
  computeStrength,
} from '@/lib/eventConfig'

const EMPTY = {
  title: '',
  event_type: '',
  event_subtype: '',
  segment: '',
  notes: '',
  proof_url: '',
}

const sel = 'w-full h-9 px-3 text-sm border border-[#f0e8ee] rounded-lg bg-white text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-[#f9a8c3] focus:border-transparent transition-all'

export default function EventForm({ open, mode, event, onSave, onClose }) {
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setError('')
      if (mode === 'edit' && event) {
        setForm({
          title: event.title || '',
          event_type: event.event_type || '',
          event_subtype: event.event_subtype || '',
          segment: event.segment || '',
          notes: event.notes || '',
          proof_url: event.proof_url || '',
        })
      } else {
        setForm({
          ...EMPTY,
          event_type: event?.event_type || '',
          event_subtype: event?.event_subtype || '',
        })
      }
    }
  }, [open, mode, event])

  function set(key, value) {
    setForm((prev) => {
      if (key === 'event_type') return { ...prev, event_type: value, event_subtype: '' }
      return { ...prev, [key]: value }
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) { setError('Title is required.'); return }
    if (!form.event_type)   { setError('Type is required.'); return }
    setSaving(true)
    try {
      const strength = computeStrength(form.event_type, form.event_subtype)
      await onSave({ ...form, strength })
    } catch (err) {
      setError(err.message || 'Save failed.')
      setSaving(false)
    }
  }

  const subtypes = form.event_type ? (EVENT_SUBTYPES[form.event_type] || []) : []
  const previewStrength = form.event_type ? computeStrength(form.event_type, form.event_subtype) : null

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-[#f0e8ee] w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#f0e8ee]">
          <div>
            <h2 className="text-base font-semibold text-[#1a1a2e]">
              {mode === 'edit' ? 'Edit Event' : 'Add Event'}
            </h2>
            <p className="text-xs text-[#9ca3af] mt-0.5">Capture what happened, what it proved, what you learned.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#9ca3af] transition-colors">
            <XIcon size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[#4b5563]">
              Title <span className="text-[#e879a0]">*</span>
            </Label>
            <Input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Describe what happened..."
              className="border-[#f0e8ee] focus:ring-[#f9a8c3]"
            />
          </div>

          {/* Type + Subtype row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[#4b5563]">
                Type <span className="text-[#e879a0]">*</span>
              </Label>
              <select value={form.event_type} onChange={(e) => set('event_type', e.target.value)} className={sel}>
                <option value="">Select type...</option>
                {EVENT_TYPE_LIST.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[#4b5563]">Subtype</Label>
              <select
                value={form.event_subtype}
                onChange={(e) => set('event_subtype', e.target.value)}
                disabled={subtypes.length === 0}
                className={`${sel} disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                <option value="">Select subtype...</option>
                {subtypes.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Segment */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[#4b5563]">Segment</Label>
            <select value={form.segment} onChange={(e) => set('segment', e.target.value)} className={sel}>
              <option value="">Select segment...</option>
              {SEGMENTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[#4b5563]">Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="What happened? What did you learn? What did it prove?"
              rows={3}
              className="border-[#f0e8ee] focus:ring-[#f9a8c3] resize-none text-sm"
            />
          </div>

          {/* Proof URL */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[#4b5563]">Proof URL</Label>
            <Input
              value={form.proof_url}
              onChange={(e) => set('proof_url', e.target.value)}
              placeholder="https://..."
              className="border-[#f0e8ee] focus:ring-[#f9a8c3]"
            />
          </div>

          {/* Auto-strength preview */}
          {previewStrength != null && (
            <div className="flex items-center gap-2 px-3 py-2 bg-[#fdf7fb] rounded-lg border border-[#f0e8ee]">
              <span className="text-xs text-[#9ca3af]">Auto Strength:</span>
              <span className="text-sm font-semibold text-[#e879a0]">{previewStrength}</span>
              <span className="text-xs text-[#c4b5c0]">(computed automatically)</span>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="h-8 px-4 text-sm text-[#6b7280] border border-[#f0e8ee] rounded-lg hover:bg-[#f9f0f5] transition-colors"
            >
              Cancel
            </button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-[#e879a0] hover:bg-[#d4648a] text-white"
            >
              {saving ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Add Event'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
