'use client'

import { useEffect, useState } from 'react'
import PageContainer from '@/components/shared/PageContainer'
import LoadingState from '@/components/shared/LoadingState'
import {
  getSegments, updateSegment,
  getTargetCustomer, upsertTargetCustomer,
  getRootProblems, createRootProblem, updateRootProblem, deleteRootProblem,
  getUnderservedNeeds, createUnderservedNeed, updateUnderservedNeed, deleteUnderservedNeed,
  getRequirements, createRequirement, updateRequirement, deleteRequirement,
  getSolutionClusters, createSolutionCluster, updateSolutionCluster, deleteSolutionCluster,
  getValueProposition, upsertValueProposition,
  getDeliverables, createDeliverable, updateDeliverable, deleteDeliverable,
  getConceptFeatures, createConceptFeature, updateConceptFeature, deleteConceptFeature,
} from '@/services/pmf'
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon, XIcon } from 'lucide-react'

const PRIORITY_OPTIONS = ['High', 'Medium', 'Low']
const FEATURE_STATUS_OPTIONS = ['Idea', 'Testing', 'Validated', 'Archived']

const PRIORITY_COLORS = {
  High:   { bg: '#dcfce7', text: '#16a34a' },
  Medium: { bg: '#fef9c3', text: '#ca8a04' },
  Low:    { bg: '#f3f4f6', text: '#6b7280' },
}

const STATUS_COLORS = {
  Idea:      { bg: '#fce4ed', text: '#e879a0' },
  Testing:   { bg: '#fef9c3', text: '#ca8a04' },
  Validated: { bg: '#dcfce7', text: '#16a34a' },
  Archived:  { bg: '#f3f4f6', text: '#6b7280' },
}

function Badge({ value, map }) {
  const c = map[value] || { bg: '#f3f4f6', text: '#6b7280' }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ backgroundColor: c.bg, color: c.text }}>
      {value}
    </span>
  )
}

// ── Section header ─────────────────────────────────────────────────────────
function SectionHead({ title, count, onAdd, addLabel = 'Add' }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-[#1a1a2e] uppercase tracking-wide">{title}</h2>
        {count != null && (
          <span className="text-xs text-[#9ca3af] bg-[#fdf2f6] border border-[#f0e8ee] rounded-full px-2 py-0.5">{count}</span>
        )}
      </div>
      {onAdd && (
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#fce4ed] text-[#e879a0] hover:bg-[#f9a8c3]/30 transition-colors"
        >
          <PlusIcon size={12} />
          {addLabel}
        </button>
      )}
    </div>
  )
}

// ── Modal wrapper ──────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl border border-[#f0e8ee] shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0e8ee]">
          <h3 className="text-sm font-semibold text-[#1a1a2e]">{title}</h3>
          <button onClick={onClose} className="text-[#9ca3af] hover:text-[#1a1a2e] transition-colors">
            <XIcon size={16} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#6b7280] mb-1">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full border border-[#f0e8ee] rounded-lg px-3 py-2 text-sm text-[#1a1a2e] bg-[#fdf9fb] focus:outline-none focus:ring-2 focus:ring-[#f9a8c3] placeholder-[#c4b5c0]'
const textareaCls = inputCls + ' resize-none'

function ModalActions({ onCancel, onSave, saving }) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm text-[#6b7280] hover:bg-[#fdf2f6] transition-colors">
        Cancel
      </button>
      <button
        onClick={onSave}
        disabled={saving}
        className="px-4 py-2 rounded-lg text-sm font-medium bg-[#e879a0] text-white hover:bg-[#d4659a] transition-colors disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  )
}

function TableActions({ onEdit, onDelete }) {
  return (
    <div className="flex items-center gap-1">
      <button onClick={onEdit} className="p-1.5 rounded-lg text-[#9ca3af] hover:text-[#e879a0] hover:bg-[#fce4ed] transition-colors">
        <PencilIcon size={13} />
      </button>
      <button onClick={onDelete} className="p-1.5 rounded-lg text-[#9ca3af] hover:text-red-500 hover:bg-red-50 transition-colors">
        <TrashIcon size={13} />
      </button>
    </div>
  )
}

const thCls = 'px-4 py-2.5 text-left text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide'
const tdCls = 'px-4 py-3 text-sm text-[#1a1a2e]'

// ══════════════════════════════════════════════════════════════════════════════
// Overview cards
// ══════════════════════════════════════════════════════════════════════════════
function OverviewCards({ counts }) {
  const cards = [
    { label: 'Root Problems',      value: counts.rootProblems },
    { label: 'Underserved Needs',  value: counts.underservedNeeds },
    { label: 'Requirements',       value: counts.requirements },
    { label: 'Solution Clusters',  value: counts.solutionClusters },
    { label: 'Deliverables',       value: counts.deliverables },
    { label: 'Concept Features',   value: counts.conceptFeatures },
  ]
  return (
    <div className="grid grid-cols-3 gap-3 mb-8">
      {cards.map((c) => (
        <div key={c.label} className="bg-white rounded-xl border border-[#f0e8ee] p-4">
          <p className="text-xs text-[#9ca3af] mb-1">{c.label}</p>
          <p className="text-2xl font-semibold text-[#1a1a2e]">{c.value}</p>
        </div>
      ))}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// Active Segment
// ══════════════════════════════════════════════════════════════════════════════
function ActiveSegmentSection({ segment }) {
  if (!segment) return null
  const updated = segment.updated_at ? new Date(segment.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
  return (
    <div className="bg-white rounded-xl border border-[#f0e8ee] p-5 mb-6">
      <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide mb-3">Active Segment</p>
      <div className="flex items-center gap-4">
        <div>
          <p className="text-base font-semibold text-[#1a1a2e]">{segment.name}</p>
          <p className="text-xs text-[#9ca3af] mt-0.5">Last updated {updated}</p>
        </div>
        <span className="ml-auto inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#dcfce7] text-[#16a34a]">
          {segment.status}
        </span>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// Target Customer
// ══════════════════════════════════════════════════════════════════════════════
function TargetCustomerSection({ segmentId, customer, onReload }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [form, setForm]       = useState({})

  function openEdit() {
    setForm({
      sub_segment:          customer?.sub_segment || '',
      primary_buyer:        customer?.primary_buyer || '',
      decision_maker:       customer?.decision_maker || '',
      budget_approver:      customer?.budget_approver || '',
      primary_pain:         customer?.primary_pain || '',
      desired_outcome:      customer?.desired_outcome || '',
      current_alternatives: (customer?.current_alternatives || []).join(', '),
      success_metrics:      (customer?.success_metrics || []).join(', '),
    })
    setEditing(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await upsertTargetCustomer(segmentId, {
        ...form,
        current_alternatives: form.current_alternatives.split(',').map((s) => s.trim()).filter(Boolean),
        success_metrics:      form.success_metrics.split(',').map((s) => s.trim()).filter(Boolean),
      })
      setEditing(false)
      await onReload()
    } finally {
      setSaving(false)
    }
  }

  const f = (key) => <span className="text-[#1a1a2e]">{customer?.[key] || <span className="text-[#c4b5c0]">—</span>}</span>
  const arr = (key) => {
    const v = customer?.[key]
    if (!v || !v.length) return <span className="text-[#c4b5c0]">—</span>
    return (
      <div className="flex flex-wrap gap-1">
        {v.map((item, i) => (
          <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-[#fdf2f6] text-[#e879a0] border border-[#fce4ed]">
            {item}
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-[#f0e8ee] p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-[#1a1a2e] uppercase tracking-wide">Target Customer</h2>
        <button onClick={openEdit} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#fce4ed] text-[#e879a0] hover:bg-[#f9a8c3]/30 transition-colors">
          <PencilIcon size={12} />
          Edit
        </button>
      </div>
      <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
        {[
          ['Sub Segment',    f('sub_segment')],
          ['Primary Buyer',  f('primary_buyer')],
          ['Decision Maker', f('decision_maker')],
          ['Budget Approver',f('budget_approver')],
        ].map(([label, val]) => (
          <div key={label}>
            <p className="text-[11px] text-[#9ca3af] mb-0.5">{label}</p>
            <p>{val}</p>
          </div>
        ))}
        <div className="col-span-2">
          <p className="text-[11px] text-[#9ca3af] mb-0.5">Primary Pain</p>
          <p>{f('primary_pain')}</p>
        </div>
        <div className="col-span-2">
          <p className="text-[11px] text-[#9ca3af] mb-0.5">Desired Outcome</p>
          <p>{f('desired_outcome')}</p>
        </div>
        <div>
          <p className="text-[11px] text-[#9ca3af] mb-1">Current Alternatives</p>
          {arr('current_alternatives')}
        </div>
        <div>
          <p className="text-[11px] text-[#9ca3af] mb-1">Success Metrics</p>
          {arr('success_metrics')}
        </div>
      </div>

      <Modal open={editing} onClose={() => setEditing(false)} title="Edit Target Customer">
        <Field label="Sub Segment">
          <input className={inputCls} value={form.sub_segment} onChange={(e) => setForm({ ...form, sub_segment: e.target.value })} placeholder="e.g. Aesthetic Clinic" />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Primary Buyer">
            <input className={inputCls} value={form.primary_buyer} onChange={(e) => setForm({ ...form, primary_buyer: e.target.value })} />
          </Field>
          <Field label="Decision Maker">
            <input className={inputCls} value={form.decision_maker} onChange={(e) => setForm({ ...form, decision_maker: e.target.value })} />
          </Field>
          <Field label="Budget Approver">
            <input className={inputCls} value={form.budget_approver} onChange={(e) => setForm({ ...form, budget_approver: e.target.value })} />
          </Field>
        </div>
        <Field label="Primary Pain">
          <textarea className={textareaCls} rows={3} value={form.primary_pain} onChange={(e) => setForm({ ...form, primary_pain: e.target.value })} />
        </Field>
        <Field label="Desired Outcome">
          <textarea className={textareaCls} rows={2} value={form.desired_outcome} onChange={(e) => setForm({ ...form, desired_outcome: e.target.value })} />
        </Field>
        <Field label="Current Alternatives (comma-separated)">
          <input className={inputCls} value={form.current_alternatives} onChange={(e) => setForm({ ...form, current_alternatives: e.target.value })} placeholder="Social Media, Ads, Agencies" />
        </Field>
        <Field label="Success Metrics (comma-separated)">
          <input className={inputCls} value={form.success_metrics} onChange={(e) => setForm({ ...form, success_metrics: e.target.value })} placeholder="More consultations, Higher trust" />
        </Field>
        <ModalActions onCancel={() => setEditing(false)} onSave={handleSave} saving={saving} />
      </Modal>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// Root Problems
// ══════════════════════════════════════════════════════════════════════════════
function RootProblemsSection({ segmentId, problems, onReload }) {
  const empty = { problem: '', importance: 7, satisfaction: 5 }
  const [modal, setModal] = useState({ open: false, mode: 'add', row: null })
  const [form, setForm]   = useState(empty)
  const [saving, setSaving] = useState(false)

  function openAdd() { setForm(empty); setModal({ open: true, mode: 'add', row: null }) }
  function openEdit(row) { setForm({ problem: row.problem, importance: row.importance, satisfaction: row.satisfaction }); setModal({ open: true, mode: 'edit', row }) }

  async function handleSave() {
    setSaving(true)
    try {
      const payload = { problem: form.problem, importance: Number(form.importance), satisfaction: Number(form.satisfaction) }
      if (modal.mode === 'add') await createRootProblem(segmentId, payload)
      else await updateRootProblem(modal.row.id, payload)
      setModal({ open: false, mode: 'add', row: null })
      await onReload()
    } finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this root problem?')) return
    await deleteRootProblem(id)
    await onReload()
  }

  return (
    <div className="bg-white rounded-xl border border-[#f0e8ee] mb-6">
      <div className="px-5 pt-5 pb-3">
        <SectionHead title="Root Problems" count={problems.length} onAdd={openAdd} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-t border-b border-[#f0e8ee] bg-[#fdf9fb]">
            <tr>
              <th className={thCls}>Problem</th>
              <th className={thCls + ' text-center'}>Importance</th>
              <th className={thCls + ' text-center'}>Satisfaction</th>
              <th className={thCls + ' text-center'}>Opportunity</th>
              <th className={thCls}>Created</th>
              <th className={thCls}></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0e8ee]">
            {problems.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-sm text-center text-[#c4b5c0]">No root problems yet.</td></tr>
            )}
            {problems.map((row) => (
              <tr key={row.id} className="hover:bg-[#fdf9fb] transition-colors">
                <td className={tdCls}>{row.problem}</td>
                <td className={tdCls + ' text-center'}>{row.importance}</td>
                <td className={tdCls + ' text-center'}>{row.satisfaction}</td>
                <td className={tdCls + ' text-center'}>
                  <span className="font-medium text-[#e879a0]">{row.opportunity ? Number(row.opportunity).toFixed(1) : '—'}</span>
                </td>
                <td className={tdCls + ' text-[#9ca3af] text-xs'}>{new Date(row.created_at).toLocaleDateString()}</td>
                <td className={tdCls}><TableActions onEdit={() => openEdit(row)} onDelete={() => handleDelete(row.id)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal.open} onClose={() => setModal({ open: false, mode: 'add', row: null })} title={modal.mode === 'add' ? 'Add Root Problem' : 'Edit Root Problem'}>
        <Field label="Problem">
          <input className={inputCls} value={form.problem} onChange={(e) => setForm({ ...form, problem: e.target.value })} placeholder="Describe the root problem" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={`Importance (${form.importance}/10)`}>
            <input type="range" min={1} max={10} className="w-full accent-[#e879a0]" value={form.importance} onChange={(e) => setForm({ ...form, importance: e.target.value })} />
          </Field>
          <Field label={`Satisfaction (${form.satisfaction}/10)`}>
            <input type="range" min={1} max={10} className="w-full accent-[#86efac]" value={form.satisfaction} onChange={(e) => setForm({ ...form, satisfaction: e.target.value })} />
          </Field>
        </div>
        <ModalActions onCancel={() => setModal({ open: false, mode: 'add', row: null })} onSave={handleSave} saving={saving} />
      </Modal>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// Underserved Needs
// ══════════════════════════════════════════════════════════════════════════════
function UnderservedNeedsSection({ segmentId, needs, problems, onReload }) {
  const empty = { need: '', related_root_problem_id: '', priority: 'High' }
  const [modal, setModal]   = useState({ open: false, mode: 'add', row: null })
  const [form, setForm]     = useState(empty)
  const [saving, setSaving] = useState(false)

  function openAdd() { setForm(empty); setModal({ open: true, mode: 'add', row: null }) }
  function openEdit(row) {
    setForm({ need: row.need, related_root_problem_id: row.related_root_problem_id || '', priority: row.priority })
    setModal({ open: true, mode: 'edit', row })
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload = { need: form.need, related_root_problem_id: form.related_root_problem_id || null, priority: form.priority }
      if (modal.mode === 'add') await createUnderservedNeed(segmentId, payload)
      else await updateUnderservedNeed(modal.row.id, payload)
      setModal({ open: false, mode: 'add', row: null })
      await onReload()
    } finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this need?')) return
    await deleteUnderservedNeed(id)
    await onReload()
  }

  return (
    <div className="bg-white rounded-xl border border-[#f0e8ee] mb-6">
      <div className="px-5 pt-5 pb-3">
        <SectionHead title="Underserved Needs" count={needs.length} onAdd={openAdd} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-t border-b border-[#f0e8ee] bg-[#fdf9fb]">
            <tr>
              <th className={thCls}>Need</th>
              <th className={thCls}>Related Root Problem</th>
              <th className={thCls}>Priority</th>
              <th className={thCls}>Created</th>
              <th className={thCls}></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0e8ee]">
            {needs.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-sm text-center text-[#c4b5c0]">No underserved needs yet.</td></tr>
            )}
            {needs.map((row) => (
              <tr key={row.id} className="hover:bg-[#fdf9fb] transition-colors">
                <td className={tdCls}>{row.need}</td>
                <td className={tdCls + ' text-[#9ca3af]'}>{row.pmf_root_problems?.problem || '—'}</td>
                <td className={tdCls}><Badge value={row.priority} map={PRIORITY_COLORS} /></td>
                <td className={tdCls + ' text-[#9ca3af] text-xs'}>{new Date(row.created_at).toLocaleDateString()}</td>
                <td className={tdCls}><TableActions onEdit={() => openEdit(row)} onDelete={() => handleDelete(row.id)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal.open} onClose={() => setModal({ open: false, mode: 'add', row: null })} title={modal.mode === 'add' ? 'Add Underserved Need' : 'Edit Underserved Need'}>
        <Field label="Need">
          <input className={inputCls} value={form.need} onChange={(e) => setForm({ ...form, need: e.target.value })} placeholder="Describe the underserved need" />
        </Field>
        <Field label="Related Root Problem">
          <select className={inputCls} value={form.related_root_problem_id} onChange={(e) => setForm({ ...form, related_root_problem_id: e.target.value })}>
            <option value="">— None —</option>
            {problems.map((p) => <option key={p.id} value={p.id}>{p.problem}</option>)}
          </select>
        </Field>
        <Field label="Priority">
          <select className={inputCls} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            {PRIORITY_OPTIONS.map((p) => <option key={p}>{p}</option>)}
          </select>
        </Field>
        <ModalActions onCancel={() => setModal({ open: false, mode: 'add', row: null })} onSave={handleSave} saving={saving} />
      </Modal>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// Requirements
// ══════════════════════════════════════════════════════════════════════════════
function RequirementsSection({ segmentId, requirements, onReload }) {
  const empty = { requirement: '', description: '', priority: 'High' }
  const [modal, setModal]   = useState({ open: false, mode: 'add', row: null })
  const [form, setForm]     = useState(empty)
  const [saving, setSaving] = useState(false)

  function openAdd() { setForm(empty); setModal({ open: true, mode: 'add', row: null }) }
  function openEdit(row) {
    setForm({ requirement: row.requirement, description: row.description || '', priority: row.priority })
    setModal({ open: true, mode: 'edit', row })
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (modal.mode === 'add') await createRequirement(segmentId, form)
      else await updateRequirement(modal.row.id, form)
      setModal({ open: false, mode: 'add', row: null })
      await onReload()
    } finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this requirement?')) return
    await deleteRequirement(id)
    await onReload()
  }

  return (
    <div className="bg-white rounded-xl border border-[#f0e8ee] mb-6">
      <div className="px-5 pt-5 pb-3">
        <SectionHead title="Requirements" count={requirements.length} onAdd={openAdd} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-t border-b border-[#f0e8ee] bg-[#fdf9fb]">
            <tr>
              <th className={thCls}>Requirement</th>
              <th className={thCls}>Description</th>
              <th className={thCls}>Priority</th>
              <th className={thCls}></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0e8ee]">
            {requirements.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-sm text-center text-[#c4b5c0]">No requirements yet.</td></tr>
            )}
            {requirements.map((row) => (
              <tr key={row.id} className="hover:bg-[#fdf9fb] transition-colors">
                <td className={tdCls + ' font-medium'}>{row.requirement}</td>
                <td className={tdCls + ' text-[#6b7280]'}>{row.description || '—'}</td>
                <td className={tdCls}><Badge value={row.priority} map={PRIORITY_COLORS} /></td>
                <td className={tdCls}><TableActions onEdit={() => openEdit(row)} onDelete={() => handleDelete(row.id)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal.open} onClose={() => setModal({ open: false, mode: 'add', row: null })} title={modal.mode === 'add' ? 'Add Requirement' : 'Edit Requirement'}>
        <Field label="Requirement">
          <input className={inputCls} value={form.requirement} onChange={(e) => setForm({ ...form, requirement: e.target.value })} placeholder="e.g. Decision Confidence" />
        </Field>
        <Field label="Description">
          <textarea className={textareaCls} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <Field label="Priority">
          <select className={inputCls} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            {PRIORITY_OPTIONS.map((p) => <option key={p}>{p}</option>)}
          </select>
        </Field>
        <ModalActions onCancel={() => setModal({ open: false, mode: 'add', row: null })} onSave={handleSave} saving={saving} />
      </Modal>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// Solution Clusters
// ══════════════════════════════════════════════════════════════════════════════
function SolutionClustersSection({ segmentId, clusters, onReload }) {
  const empty = { cluster_name: '', description: '', related_requirements: '' }
  const [modal, setModal]   = useState({ open: false, mode: 'add', row: null })
  const [form, setForm]     = useState(empty)
  const [saving, setSaving] = useState(false)

  function openAdd() { setForm(empty); setModal({ open: true, mode: 'add', row: null }) }
  function openEdit(row) {
    setForm({ cluster_name: row.cluster_name, description: row.description || '', related_requirements: (row.related_requirements || []).join(', ') })
    setModal({ open: true, mode: 'edit', row })
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload = {
        cluster_name: form.cluster_name,
        description: form.description,
        related_requirements: form.related_requirements.split(',').map((s) => s.trim()).filter(Boolean),
      }
      if (modal.mode === 'add') await createSolutionCluster(segmentId, payload)
      else await updateSolutionCluster(modal.row.id, payload)
      setModal({ open: false, mode: 'add', row: null })
      await onReload()
    } finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this solution cluster?')) return
    await deleteSolutionCluster(id)
    await onReload()
  }

  return (
    <div className="mb-6">
      <SectionHead title="Solution Clusters" count={clusters.length} onAdd={openAdd} />
      <div className="grid grid-cols-2 gap-3">
        {clusters.length === 0 && (
          <div className="col-span-2 bg-white rounded-xl border border-[#f0e8ee] px-5 py-6 text-sm text-center text-[#c4b5c0]">No solution clusters yet.</div>
        )}
        {clusters.map((row) => (
          <div key={row.id} className="bg-white rounded-xl border border-[#f0e8ee] p-4">
            <div className="flex items-start justify-between mb-2">
              <p className="text-sm font-semibold text-[#1a1a2e]">{row.cluster_name}</p>
              <TableActions onEdit={() => openEdit(row)} onDelete={() => handleDelete(row.id)} />
            </div>
            {row.description && <p className="text-xs text-[#6b7280] mb-3">{row.description}</p>}
            {row.related_requirements?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {row.related_requirements.map((r, i) => (
                  <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-[#dcfce7] text-[#16a34a]">{r}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal open={modal.open} onClose={() => setModal({ open: false, mode: 'add', row: null })} title={modal.mode === 'add' ? 'Add Solution Cluster' : 'Edit Solution Cluster'}>
        <Field label="Cluster Name">
          <input className={inputCls} value={form.cluster_name} onChange={(e) => setForm({ ...form, cluster_name: e.target.value })} placeholder="e.g. Trust Building" />
        </Field>
        <Field label="Description">
          <textarea className={textareaCls} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <Field label="Related Requirements (comma-separated)">
          <input className={inputCls} value={form.related_requirements} onChange={(e) => setForm({ ...form, related_requirements: e.target.value })} placeholder="Decision Confidence, Value Communication" />
        </Field>
        <ModalActions onCancel={() => setModal({ open: false, mode: 'add', row: null })} onSave={handleSave} saving={saving} />
      </Modal>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// Value Proposition
// ══════════════════════════════════════════════════════════════════════════════
function ValuePropositionSection({ segmentId, valueProp, onReload }) {
  const [editing, setEditing] = useState(false)
  const [text, setText]       = useState('')
  const [saving, setSaving]   = useState(false)

  function openEdit() {
    setText(valueProp?.current_version || '')
    setEditing(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await upsertValueProposition(segmentId, text)
      setEditing(false)
      await onReload()
    } finally { setSaving(false) }
  }

  const updated = valueProp?.updated_at
    ? new Date(valueProp.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—'

  return (
    <div className="bg-white rounded-xl border border-[#f0e8ee] p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-[#1a1a2e] uppercase tracking-wide">Value Proposition</h2>
        <button onClick={openEdit} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#fce4ed] text-[#e879a0] hover:bg-[#f9a8c3]/30 transition-colors">
          <PencilIcon size={12} />
          Edit
        </button>
      </div>
      {valueProp ? (
        <>
          <p className="text-sm text-[#1a1a2e] leading-relaxed italic border-l-2 border-[#f9a8c3] pl-4">
            "{valueProp.current_version}"
          </p>
          <p className="text-xs text-[#9ca3af] mt-3">Last updated {updated}</p>
        </>
      ) : (
        <p className="text-sm text-[#c4b5c0]">No value proposition defined yet.</p>
      )}

      <Modal open={editing} onClose={() => setEditing(false)} title="Edit Value Proposition">
        <Field label="Current Version">
          <textarea className={textareaCls} rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder="ORI helps growing med spas…" />
        </Field>
        <ModalActions onCancel={() => setEditing(false)} onSave={handleSave} saving={saving} />
      </Modal>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// Deliverable Library
// ══════════════════════════════════════════════════════════════════════════════
function DeliverablesSection({ segmentId, deliverables, requirements, onReload }) {
  const empty = { deliverable: '', category: '', purpose: '', related_requirement_id: '' }
  const [modal, setModal]   = useState({ open: false, mode: 'add', row: null })
  const [form, setForm]     = useState(empty)
  const [saving, setSaving] = useState(false)

  function openAdd() { setForm(empty); setModal({ open: true, mode: 'add', row: null }) }
  function openEdit(row) {
    setForm({ deliverable: row.deliverable, category: row.category || '', purpose: row.purpose || '', related_requirement_id: row.related_requirement_id || '' })
    setModal({ open: true, mode: 'edit', row })
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload = { ...form, related_requirement_id: form.related_requirement_id || null }
      if (modal.mode === 'add') await createDeliverable(segmentId, payload)
      else await updateDeliverable(modal.row.id, payload)
      setModal({ open: false, mode: 'add', row: null })
      await onReload()
    } finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this deliverable?')) return
    await deleteDeliverable(id)
    await onReload()
  }

  return (
    <div className="bg-white rounded-xl border border-[#f0e8ee] mb-6">
      <div className="px-5 pt-5 pb-3">
        <SectionHead title="Deliverable Library" count={deliverables.length} onAdd={openAdd} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-t border-b border-[#f0e8ee] bg-[#fdf9fb]">
            <tr>
              <th className={thCls}>Deliverable</th>
              <th className={thCls}>Category</th>
              <th className={thCls}>Purpose</th>
              <th className={thCls}>Related Requirement</th>
              <th className={thCls}></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0e8ee]">
            {deliverables.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-sm text-center text-[#c4b5c0]">No deliverables yet.</td></tr>
            )}
            {deliverables.map((row) => (
              <tr key={row.id} className="hover:bg-[#fdf9fb] transition-colors">
                <td className={tdCls + ' font-medium'}>{row.deliverable}</td>
                <td className={tdCls}>
                  {row.category
                    ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-[#fdf2f6] text-[#e879a0] border border-[#fce4ed]">{row.category}</span>
                    : <span className="text-[#c4b5c0]">—</span>
                  }
                </td>
                <td className={tdCls + ' text-[#6b7280] max-w-xs'}>{row.purpose || '—'}</td>
                <td className={tdCls + ' text-[#9ca3af]'}>{row.pmf_requirements?.requirement || '—'}</td>
                <td className={tdCls}><TableActions onEdit={() => openEdit(row)} onDelete={() => handleDelete(row.id)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal.open} onClose={() => setModal({ open: false, mode: 'add', row: null })} title={modal.mode === 'add' ? 'Add Deliverable' : 'Edit Deliverable'}>
        <Field label="Deliverable">
          <input className={inputCls} value={form.deliverable} onChange={(e) => setForm({ ...form, deliverable: e.target.value })} placeholder="e.g. Trust Film" />
        </Field>
        <Field label="Category">
          <input className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Film, Series, Story" />
        </Field>
        <Field label="Purpose">
          <textarea className={textareaCls} rows={2} value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
        </Field>
        <Field label="Related Requirement">
          <select className={inputCls} value={form.related_requirement_id} onChange={(e) => setForm({ ...form, related_requirement_id: e.target.value })}>
            <option value="">— None —</option>
            {requirements.map((r) => <option key={r.id} value={r.id}>{r.requirement}</option>)}
          </select>
        </Field>
        <ModalActions onCancel={() => setModal({ open: false, mode: 'add', row: null })} onSave={handleSave} saving={saving} />
      </Modal>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// Concept Feature Library
// ══════════════════════════════════════════════════════════════════════════════
function ConceptFeaturesSection({ segmentId, features, problems, onReload }) {
  const empty = { title: '', hypothesis: '', root_problem_id: '', status: 'Idea' }
  const [modal, setModal]   = useState({ open: false, mode: 'add', row: null })
  const [form, setForm]     = useState(empty)
  const [saving, setSaving] = useState(false)

  function openAdd() { setForm(empty); setModal({ open: true, mode: 'add', row: null }) }
  function openEdit(row) {
    setForm({ title: row.title, hypothesis: row.hypothesis || '', root_problem_id: row.root_problem_id || '', status: row.status })
    setModal({ open: true, mode: 'edit', row })
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload = { ...form, root_problem_id: form.root_problem_id || null }
      if (modal.mode === 'add') await createConceptFeature(segmentId, payload)
      else await updateConceptFeature(modal.row.id, payload)
      setModal({ open: false, mode: 'add', row: null })
      await onReload()
    } finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this concept feature?')) return
    await deleteConceptFeature(id)
    await onReload()
  }

  async function handleStatusChange(id, status) {
    await updateConceptFeature(id, { status })
    await onReload()
  }

  return (
    <div className="mb-6">
      <SectionHead title="Concept Feature Library" count={features.length} onAdd={openAdd} />
      <div className="grid grid-cols-2 gap-3">
        {features.length === 0 && (
          <div className="col-span-2 bg-white rounded-xl border border-[#f0e8ee] px-5 py-6 text-sm text-center text-[#c4b5c0]">No concept features yet.</div>
        )}
        {features.map((row) => (
          <div key={row.id} className="bg-white rounded-xl border border-[#f0e8ee] p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge value={row.status} map={STATUS_COLORS} />
              </div>
              <TableActions onEdit={() => openEdit(row)} onDelete={() => handleDelete(row.id)} />
            </div>
            <p className="text-sm font-semibold text-[#1a1a2e] mb-1">{row.title}</p>
            {row.hypothesis && <p className="text-xs text-[#6b7280] mb-3 leading-relaxed">{row.hypothesis}</p>}
            {row.pmf_root_problems?.problem && (
              <p className="text-[11px] text-[#9ca3af]">Root Problem: <span className="text-[#e879a0]">{row.pmf_root_problems.problem}</span></p>
            )}
            <p className="text-[11px] text-[#c4b5c0] mt-1">{new Date(row.created_at).toLocaleDateString()}</p>
            <div className="flex gap-1 mt-3 flex-wrap">
              {FEATURE_STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(row.id, s)}
                  className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                    row.status === s
                      ? 'bg-[#e879a0] text-white'
                      : 'bg-[#fdf2f6] text-[#9ca3af] hover:bg-[#fce4ed] hover:text-[#e879a0]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Modal open={modal.open} onClose={() => setModal({ open: false, mode: 'add', row: null })} title={modal.mode === 'add' ? 'Add Concept Feature' : 'Edit Concept Feature'}>
        <Field label="Title">
          <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. The Trust Gap" />
        </Field>
        <Field label="Hypothesis">
          <textarea className={textareaCls} rows={3} value={form.hypothesis} onChange={(e) => setForm({ ...form, hypothesis: e.target.value })} placeholder="We believe that…" />
        </Field>
        <Field label="Root Problem">
          <select className={inputCls} value={form.root_problem_id} onChange={(e) => setForm({ ...form, root_problem_id: e.target.value })}>
            <option value="">— None —</option>
            {problems.map((p) => <option key={p.id} value={p.id}>{p.problem}</option>)}
          </select>
        </Field>
        <Field label="Status">
          <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {FEATURE_STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <ModalActions onCancel={() => setModal({ open: false, mode: 'add', row: null })} onSave={handleSave} saving={saving} />
      </Modal>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// Main Page
// ══════════════════════════════════════════════════════════════════════════════
export default function PMFIntelligencePage() {
  const [loading, setLoading]       = useState(true)
  const [segment, setSegment]       = useState(null)
  const [customer, setCustomer]     = useState(null)
  const [problems, setProblems]     = useState([])
  const [needs, setNeeds]           = useState([])
  const [requirements, setReqs]     = useState([])
  const [clusters, setClusters]     = useState([])
  const [valueProp, setValueProp]   = useState(null)
  const [deliverables, setDelivs]   = useState([])
  const [features, setFeatures]     = useState([])

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const segs = await getSegments()
      const seg  = segs?.[0] || null
      setSegment(seg)
      if (!seg) return

      const sid = seg.id
      const [cust, probs, nds, reqs, clust, vp, delivs, feats] = await Promise.all([
        getTargetCustomer(sid).catch(() => null),
        getRootProblems(sid).catch(() => []),
        getUnderservedNeeds(sid).catch(() => []),
        getRequirements(sid).catch(() => []),
        getSolutionClusters(sid).catch(() => []),
        getValueProposition(sid).catch(() => null),
        getDeliverables(sid).catch(() => []),
        getConceptFeatures(sid).catch(() => []),
      ])
      setCustomer(cust)
      setProblems(probs)
      setNeeds(nds)
      setReqs(reqs)
      setClusters(clust)
      setValueProp(vp)
      setDelivs(delivs)
      setFeatures(feats)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingState message="Loading PMF Intelligence…" />

  const segmentId = segment?.id

  return (
    <PageContainer className="max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#1a1a2e] tracking-tight">PMF Intelligence</h1>
        <p className="text-sm text-[#9ca3af] mt-0.5">
          Product-Market Fit research — the intelligence layer for Content OS, outreach, and strategy.
        </p>
      </div>

      {/* Overview Cards */}
      <OverviewCards counts={{
        rootProblems:    problems.length,
        underservedNeeds: needs.length,
        requirements:    requirements.length,
        solutionClusters: clusters.length,
        deliverables:    deliverables.length,
        conceptFeatures: features.length,
      }} />

      {/* Active Segment */}
      <ActiveSegmentSection segment={segment} />

      {/* Target Customer */}
      {segmentId && (
        <TargetCustomerSection segmentId={segmentId} customer={customer} onReload={load} />
      )}

      {/* Root Problems */}
      {segmentId && (
        <RootProblemsSection segmentId={segmentId} problems={problems} onReload={load} />
      )}

      {/* Underserved Needs */}
      {segmentId && (
        <UnderservedNeedsSection segmentId={segmentId} needs={needs} problems={problems} onReload={load} />
      )}

      {/* Requirements */}
      {segmentId && (
        <RequirementsSection segmentId={segmentId} requirements={requirements} onReload={load} />
      )}

      {/* Solution Clusters */}
      {segmentId && (
        <SolutionClustersSection segmentId={segmentId} clusters={clusters} onReload={load} />
      )}

      {/* Value Proposition */}
      {segmentId && (
        <ValuePropositionSection segmentId={segmentId} valueProp={valueProp} onReload={load} />
      )}

      {/* Deliverable Library */}
      {segmentId && (
        <DeliverablesSection segmentId={segmentId} deliverables={deliverables} requirements={requirements} onReload={load} />
      )}

      {/* Concept Feature Library */}
      {segmentId && (
        <ConceptFeaturesSection segmentId={segmentId} features={features} problems={problems} onReload={load} />
      )}
    </PageContainer>
  )
}
