'use client'

import { useEffect, useState } from 'react'
import PageContainer from '@/components/shared/PageContainer'
import LoadingState from '@/components/shared/LoadingState'
import StateReviewForm from '@/components/state/StateReviewForm'
import StateHistoryChart from '@/components/state/StateHistoryChart'
import { getPersonalStates, createPersonalState, deletePersonalState } from '@/services/personalStates'
import { PERSONAL_METRICS, scoreColor } from '@/lib/stateEngine'

function LatestScores({ snapshot }) {
  if (!snapshot) return null
  return (
    <div className="grid grid-cols-4 gap-3 mb-6">
      {PERSONAL_METRICS.map((m) => {
        const val = snapshot[m.key]
        const c   = scoreColor(val)
        return (
          <div key={m.key} className="bg-white rounded-xl border border-[#f0e8ee] p-4 text-center">
            <p className="text-xs text-[#9ca3af] mb-1">{m.label}</p>
            <p className="text-3xl font-bold" style={{ color: c.text }}>{val ?? '—'}</p>
            <p className="text-xs mt-1" style={{ color: c.text }}>{m.question}</p>
          </div>
        )
      })}
    </div>
  )
}

export default function PersonalStatePage() {
  const [snapshots, setSnapshots] = useState([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const data = await getPersonalStates()
      setSnapshots(data || [])
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  async function handleSave(values) {
    await createPersonalState(values)
    await load()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this review?')) return
    await deletePersonalState(id)
    await load()
  }

  if (loading) return <LoadingState message="Loading personal state..." />

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#1a1a2e] tracking-tight">Personal State</h1>
        <p className="text-sm text-[#9ca3af] mt-0.5">
          Track your authority, trust, momentum, and authenticity every 3 days.
        </p>
      </div>

      {/* Latest scores */}
      <LatestScores snapshot={snapshots[0]} />

      {/* Review form */}
      <StateReviewForm
        metrics={PERSONAL_METRICS}
        snapshots={snapshots}
        onSave={handleSave}
        label="Personal State"
      />

      {/* History */}
      <StateHistoryChart
        snapshots={snapshots}
        metrics={PERSONAL_METRICS}
        onDelete={handleDelete}
      />
    </PageContainer>
  )
}
