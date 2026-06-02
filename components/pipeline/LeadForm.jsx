'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { XIcon } from 'lucide-react'
import { SEGMENTS, STAGES } from '@/lib/pipelineConfig'

const EMPTY = {
  business_name: '',
  segment: '',
  stage: 'Prospect',
  contact_name: '',
  facebook_link: '',
  instagram_link: '',
  website: '',
  phone: '',
  notes: '',
}

const inp = 'border-[#f0e8ee] focus:ring-[#f9a8c3]'
const sel = 'w-full h-9 px-3 text-sm border border-[#f0e8ee] rounded-lg bg-white text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-[#f9a8c3] focus:border-transparent transition-all'

export default function LeadForm({ open, mode, lead, onSave, onClose }) {
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  useEffect(() => {
    if (open) {
      setError('')
      setForm(mode === 'edit' && lead ? {
        business_name: lead.business_name || '',
        segment:       lead.segment || '',
        stage:         lead.stage || 'Prospect',
        contact_name:  lead.contact_name || '',
        facebook_link: lead.facebook_link || '',
        instagram_link:lead.instagram_link || '',
        website:       lead.website || '',
        phone:         lead.phone || '',
        notes:         lead.notes || '',
      } : EMPTY)
    }
  }, [open, mode, lead])

  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.business_name.trim()) { setError('Business name is required.'); return }
    if (!form.segment)              { setError('Segment is required.'); return }
    setSaving(true)
    try {
      await onSave(form)
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
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#f0e8ee]">
          <div>
            <h2 className="text-base font-semibold text-[#1a1a2e]">
              {mode === 'edit' ? 'Edit Lead' : 'Add Lead'}
            </h2>
            <p className="text-xs text-[#9ca3af] mt-0.5">Add a new prospect to the pipeline.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#9ca3af] transition-colors">
            <XIcon size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Business name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[#4b5563]">Business Name <span className="text-[#e879a0]">*</span></Label>
            <Input value={form.business_name} onChange={(e) => set('business_name', e.target.value)} placeholder="e.g. Glow Med Spa" className={inp} />
          </div>

          {/* Segment + Stage */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[#4b5563]">Segment <span className="text-[#e879a0]">*</span></Label>
              <select value={form.segment} onChange={(e) => set('segment', e.target.value)} className={sel}>
                <option value="">Select...</option>
                {SEGMENTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[#4b5563]">Stage</Label>
              <select value={form.stage} onChange={(e) => set('stage', e.target.value)} className={sel}>
                {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Contact name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[#4b5563]">Contact Name</Label>
            <Input value={form.contact_name} onChange={(e) => set('contact_name', e.target.value)} placeholder="Owner / Manager name" className={inp} />
          </div>

          {/* Social links */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[#4b5563]">Facebook</Label>
              <Input value={form.facebook_link} onChange={(e) => set('facebook_link', e.target.value)} placeholder="facebook.com/..." className={inp} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[#4b5563]">Instagram</Label>
              <Input value={form.instagram_link} onChange={(e) => set('instagram_link', e.target.value)} placeholder="instagram.com/..." className={inp} />
            </div>
          </div>

          {/* Website + Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[#4b5563]">Website</Label>
              <Input value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://..." className={inp} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[#4b5563]">Phone</Label>
              <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+63..." className={inp} />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[#4b5563]">Notes</Label>
            <Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Initial context, observations..." rows={3} className={`${inp} resize-none text-sm`} />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="h-8 px-4 text-sm text-[#6b7280] border border-[#f0e8ee] rounded-lg hover:bg-[#f9f0f5] transition-colors">
              Cancel
            </button>
            <Button type="submit" disabled={saving} className="bg-[#e879a0] hover:bg-[#d4648a] text-white">
              {saving ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Add Lead'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
