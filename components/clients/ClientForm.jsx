'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { XIcon } from 'lucide-react'
import {
  SEGMENTS, CLIENT_TYPES, CLIENT_STATUSES,
  PAYMENT_STATUSES, TESTIMONIAL_STATUSES, CLIENT_TYPE_COLORS,
} from '@/lib/clientsConfig'

const EMPTY = {
  business_name: '', segment: '', client_type: 'Paid Client',
  client_status: 'Active', package_name: '',
  price: '', actual_revenue: '', payment_status: 'Unpaid', revenue_notes: '',
  start_date: '', delivery_date: '', delivered_date: '',
  testimonial_status: 'Not Requested',
  drive_link: '', photos_link: '', videos_link: '', brand_ref_link: '',
  notes: '',
}

const inp = 'border-[#f0e8ee] focus:ring-[#f9a8c3]'
const sel = 'w-full h-9 px-3 text-sm border border-[#f0e8ee] rounded-lg bg-white text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-[#f9a8c3] focus:border-transparent'

export default function ClientForm({ open, mode, client, onSave, onClose }) {
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  useEffect(() => {
    if (open) {
      setError('')
      setForm(mode === 'edit' && client ? {
        business_name:       client.business_name || '',
        segment:             client.segment || '',
        client_type:         client.client_type || 'Paid Client',
        client_status:       client.client_status || 'Active',
        package_name:        client.package_name || '',
        price:               client.price ?? '',
        actual_revenue:      client.actual_revenue ?? '',
        payment_status:      client.payment_status || 'Unpaid',
        revenue_notes:       client.revenue_notes || '',
        start_date:          client.start_date || '',
        delivery_date:       client.delivery_date || '',
        delivered_date:      client.delivered_date || '',
        testimonial_status:  client.testimonial_status || 'Not Requested',
        drive_link:          client.drive_link || '',
        photos_link:         client.photos_link || '',
        videos_link:         client.videos_link || '',
        brand_ref_link:      client.brand_ref_link || '',
        notes:               client.notes || '',
      } : EMPTY)
    }
  }, [open, mode, client])

  function set(k, v) {
    setForm((p) => {
      const next = { ...p, [k]: v }
      if (k === 'client_type' && v !== 'Paid Client') {
        next.actual_revenue = '0'
        next.price          = ''
        next.revenue_notes  = ''
        next.payment_status = v === 'Free Sample' ? 'Free' : 'Demo'
      }
      return next
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.business_name.trim()) { setError('Business name is required.'); return }
    setSaving(true)
    try {
      const isPaid = form.client_type === 'Paid Client'
      await onSave({
        ...form,
        price:          isPaid && form.price !== '' ? Number(form.price) : null,
        actual_revenue: isPaid && form.actual_revenue !== '' ? Number(form.actual_revenue) : 0,
        payment_status: isPaid ? form.payment_status : (form.client_type === 'Free Sample' ? 'Free' : 'Demo'),
        start_date:     form.start_date     || null,
        delivery_date:  form.delivery_date  || null,
        delivered_date: form.delivered_date || null,
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
      <div className="relative bg-white rounded-2xl shadow-2xl border border-[#f0e8ee] w-full max-w-2xl mx-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#f0e8ee] sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base font-semibold text-[#1a1a2e]">{mode === 'edit' ? 'Edit Client' : 'Add Client'}</h2>
            <p className="text-xs text-[#9ca3af] mt-0.5">Manage client details, revenue, and delivery.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#9ca3af]"><XIcon size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Identity */}
          <div className="space-y-3">
            <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide">Identity</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs font-medium text-[#4b5563]">Business Name <span className="text-[#e879a0]">*</span></Label>
                <Input value={form.business_name} onChange={(e) => set('business_name', e.target.value)} placeholder="e.g. Glow Med Spa" className={inp} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[#4b5563]">Segment</Label>
                <select value={form.segment} onChange={(e) => set('segment', e.target.value)} className={sel}>
                  <option value="">Select...</option>
                  {SEGMENTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[#4b5563]">Client Type</Label>
                {mode === 'edit' ? (
                  <div className="flex items-center gap-2 h-9">
                    {(() => {
                      const c = CLIENT_TYPE_COLORS[form.client_type] || { bg: '#f1f5f9', text: '#64748b' }
                      return (
                        <span className="text-xs font-semibold px-2 py-1 rounded" style={{ backgroundColor: c.bg, color: c.text }}>
                          {form.client_type}
                        </span>
                      )
                    })()}
                    <span className="text-xs text-[#c4b5c0]">Cannot be changed</span>
                  </div>
                ) : (
                  <select value={form.client_type} onChange={(e) => set('client_type', e.target.value)} className={sel}>
                    {CLIENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[#4b5563]">Package Name</Label>
                <Input value={form.package_name} onChange={(e) => set('package_name', e.target.value)} placeholder="e.g. Starter Pack" className={inp} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[#4b5563]">Status</Label>
                <select value={form.client_status} onChange={(e) => set('client_status', e.target.value)} className={sel}>
                  {CLIENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Revenue — Paid Client only */}
          {form.client_type === 'Paid Client' ? (
            <div className="space-y-3 bg-[#fdf7fb]/60 rounded-xl border border-[#f0e8ee] p-4">
              <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide">Revenue</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[#4b5563]">Quoted Price (₱)</Label>
                  <Input type="number" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="0" className={inp} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[#4b5563]">Actual Revenue (₱)</Label>
                  <Input type="number" value={form.actual_revenue} onChange={(e) => set('actual_revenue', e.target.value)} placeholder="0" className={inp} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[#4b5563]">Payment Status</Label>
                  <select value={form.payment_status} onChange={(e) => set('payment_status', e.target.value)} className={sel}>
                    {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[#4b5563]">Testimonial Status</Label>
                  <select value={form.testimonial_status} onChange={(e) => set('testimonial_status', e.target.value)} className={sel}>
                    {TESTIMONIAL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label className="text-xs font-medium text-[#4b5563]">Revenue Notes</Label>
                  <Input value={form.revenue_notes} onChange={(e) => set('revenue_notes', e.target.value)} placeholder="e.g. Custom Package, Early Discount..." className={inp} />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 bg-[#f9fafb] rounded-xl border border-[#f0e8ee] p-4">
              <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide">Revenue</p>
              <p className="text-xs text-[#c4b5c0]">Revenue is not tracked for {form.client_type} projects. Actual revenue is locked at ₱0.</p>
              {/* Testimonial still allowed */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[#4b5563]">Testimonial Status</Label>
                <select value={form.testimonial_status} onChange={(e) => set('testimonial_status', e.target.value)} className={sel}>
                  {TESTIMONIAL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Delivery */}
          <div className="space-y-3">
            <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide">Delivery</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[#4b5563]">Start Date</Label>
                <Input type="date" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} className={inp} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[#4b5563]">Target Delivery</Label>
                <Input type="date" value={form.delivery_date} onChange={(e) => set('delivery_date', e.target.value)} className={inp} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[#4b5563]">Delivered Date</Label>
                <Input type="date" value={form.delivered_date} onChange={(e) => set('delivered_date', e.target.value)} className={inp} />
              </div>
            </div>
          </div>

          {/* Assets */}
          <div className="space-y-3">
            <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide">Asset Links</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs font-medium text-[#4b5563]">Google Drive</Label>
                <Input value={form.drive_link} onChange={(e) => set('drive_link', e.target.value)} placeholder="https://drive.google.com/..." className={inp} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[#4b5563]">Photos</Label>
                <Input value={form.photos_link} onChange={(e) => set('photos_link', e.target.value)} placeholder="URL to photos" className={inp} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[#4b5563]">Videos</Label>
                <Input value={form.videos_link} onChange={(e) => set('videos_link', e.target.value)} placeholder="URL to videos" className={inp} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs font-medium text-[#4b5563]">Brand References</Label>
                <Input value={form.brand_ref_link} onChange={(e) => set('brand_ref_link', e.target.value)} placeholder="URL to brand refs / moodboard" className={inp} />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[#4b5563]">Notes</Label>
            <Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Additional context..." rows={3} className={`${inp} resize-none text-sm`} />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="h-8 px-4 text-sm text-[#6b7280] border border-[#f0e8ee] rounded-lg hover:bg-[#f9f0f5]">Cancel</button>
            <Button type="submit" disabled={saving} className="bg-[#e879a0] hover:bg-[#d4648a] text-white">
              {saving ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Add Client'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
