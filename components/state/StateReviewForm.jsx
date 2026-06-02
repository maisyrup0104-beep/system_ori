'use client'

import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { scoreColor, daysSinceLastReview } from '@/lib/stateEngine'

function ScorePicker({ value, onChange }) {
  return (
    <div className="flex gap-1 flex-wrap">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
        const isSelected = value === n
        const c = scoreColor(n)
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className="w-9 h-9 rounded-lg text-xs font-bold transition-all hover:scale-105 active:scale-95"
            style={
              isSelected
                ? { backgroundColor: '#e879a0', color: '#fff', boxShadow: '0 0 0 2px #e879a0' }
                : { backgroundColor: c.bg, color: c.text }
            }
          >
            {n}
          </button>
        )
      })}
    </div>
  )
}

export default function StateReviewForm({ metrics, snapshots, onSave, label }) {
  const days = daysSinceLastReview(snapshots)

  const [scores, setScores] = useState(() =>
    Object.fromEntries(metrics.map((m) => [m.key, null]))
  )
  const [notes,  setNotes]  = useState('')
  const [saving, setSaving] = useState(false)
  const [done,   setDone]   = useState(false)

  function setScore(key, val) {
    setScores((prev) => ({ ...prev, [key]: val }))
    setDone(false)
  }

  const allScored = metrics.every((m) => scores[m.key] !== null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!allScored) return
    setSaving(true)
    try {
      await onSave({ ...scores, notes })
      setScores(Object.fromEntries(metrics.map((m) => [m.key, null])))
      setNotes('')
      setDone(true)
    } finally {
      setSaving(false)
    }
  }

  const reviewDue = days === null || days >= 3

  return (
    <div className="bg-white rounded-2xl border border-[#f0e8ee] p-6 mb-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-[#1a1a2e]">New {label} Review</h3>
          <p className="text-xs text-[#9ca3af] mt-0.5">Rate each metric honestly from 1 to 10.</p>
        </div>
        {days !== null && (
          <span
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
            style={reviewDue
              ? { backgroundColor: '#fce4ed', color: '#e879a0' }
              : { backgroundColor: '#dcfce7', color: '#16a34a' }}
          >
            {reviewDue ? `Review due${days >= 3 ? ` (${days}d ago)` : ''}` : `Next in ${3 - days}d`}
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {metrics.map((m) => (
          <div key={m.key}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-sm font-medium text-[#1a1a2e]">{m.label}</span>
                <span className="text-xs text-[#9ca3af] ml-2">{m.question}</span>
              </div>
              {scores[m.key] !== null && (
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded"
                  style={scoreColor(scores[m.key])}
                >
                  {scores[m.key]}/10
                </span>
              )}
            </div>
            <ScorePicker value={scores[m.key]} onChange={(v) => setScore(m.key, v)} />
          </div>
        ))}

        <div className="pt-1">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes — what's driving these scores?"
            rows={2}
            className="border-[#f0e8ee] focus:ring-[#f9a8c3] resize-none text-sm"
          />
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={!allScored || saving}
            className="bg-[#e879a0] hover:bg-[#d4648a] text-white disabled:opacity-40"
          >
            {saving ? 'Saving...' : 'Submit Review'}
          </Button>
          {!allScored && (
            <p className="text-xs text-[#9ca3af]">Score all {metrics.length} metrics to submit.</p>
          )}
          {done && <p className="text-xs text-[#16a34a] font-medium">Review saved ✓</p>}
        </div>
      </form>
    </div>
  )
}
