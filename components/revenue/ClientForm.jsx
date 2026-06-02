'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { XIcon } from 'lucide-react'
import { SEGMENTS, PAYMENT_STATUSES } from '@/lib/pipelineConfig'

const EMPTY = {
  business_name: '',
  segment: '',
  package_name: '',
  price: '',
  actual_revenue: '',
  payment_status: 'Unpaid',
  revenue_notes: '',
}

const inp = 'border-[#f0e8ee] focus:ring-[#f9a8c3]'
const sel = 'w-full h-9 px-3 text-sm border border-[#f0e8ee] rounded-lg bg-white text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-[#f9a8c3] focus:border-transparent'

export default function ClientForm({ open, mode, client, onSave, onClose }) {
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  useEffect(() => {
    if (open) {
      setError('')
      setForm(mode === 'edit' && client ? {
        business_name:  client.business_name || '',
        segment:        client.segment || '',
        package_name:   client.package_name || '',
        price:          client.price ?? '',
        actual_revenue: client.actual_revenue ?? '',
        payment_status: client.payment_status || 'Unpaid',
        revenue_notes:  client.revenue_notes || '',
      } : EMPTY)
    }
  }, [open, mode, client])

  function set(key, value) { setForm((p) => ({ ...p, [key]: value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.business_name.trim()) { setError('Business name is required.'); return }
    setSaving(true)
    try {
      await onSave({
        ...form,
        price:          form.price          !== '' ? Number(form.price)          : null,
        actual_revenue: form.actual_revenue  !== '' ? Number(form.actual_revenue)  : 0,
      })
    } catch (err) {
      setError(err.message || 'Save failed.')
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-[#f0e8ee] w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#f0e8ee]">
          <div>
            <h2 className="text-base font-semibold text-[#1a1a2e]">{mode === 'edit' ? 'Edit Client' : 'Add Client'}</h2>
            <p className="text-xs text-[#9ca3af] mt-0.5">Track actual revenue received.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#9ca3af]">
            <XIcon size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[#4b5563]">Business Name <span className="text-[#e879a0]">*</span></Label>
            <Input value={form.business_name} onChange={(e) => set('business_name', e.target.value)} placeholder="e.g. Glow Med Spa" className={inp} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[#4b5563]">Segment</Label>
              <select value={form.segment} onChange={(e) => set('segment', e.target.value)} className={sel}>
                <option value="">Select...</option>
                {SEGMENTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[#4b5563]">Package Name</Label>
              <Input value={form.package_name} onChange={(e) => set('package_name', e.target.value)} placeholder="e.g. Starter Pack" className={inp} />
            </div>
          </div>

          {/* Revenue fields */}
          <div className="rounded-xl border border-[#f0e8ee] p-4 space-y-3 bg-[#fdf7fb]/50">
            <p className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">Revenue</p>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[#4b5563]">Quoted Price (₱)</Label>
                <Input type="number" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="0" className={inp} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[#4b5563]">Actual Revenue (₱) <span className="text-[#e879a0]">*</span></Label>
                <Input type="number" value={form.actual_revenue} onChange={(e) => set('actual_revenue', e.target.value)} placeholder="0" className={inp} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[#4b5563]">Payment Status</Label>
              <select value={form.payment_status} onChange={(e) => set('payment_status', e.target.value)} className={sel}>
                {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[#4b5563]">Revenue Notes</Label>
              <Textarea value={form.revenue_notes} onChange={(e) => set('revenue_notes', e.target.value)} placeholder="e.g. Free Sample, Custom Package..." rows={2} className={`${inp} resize-none text-sm`} />
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="h-8 px-4 text-sm text-[#6b7280] border border-[#f0e8ee] rounded-lg hover:bg-[#f9f0f5]">
              Cancel
            </button>
            <Button type="submit" disabled={saving} className="bg-[#e879a0] hover:bg-[#d4648a] text-white">
              {saving ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Add Client'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
