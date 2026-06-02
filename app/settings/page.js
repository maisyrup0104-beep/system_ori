'use client'

import { useEffect, useState } from 'react'
import PageContainer from '@/components/shared/PageContainer'
import SectionHeader from '@/components/shared/SectionHeader'
import LoadingState from '@/components/shared/LoadingState'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { getSettings, upsertSettings } from '@/services/settings'

export default function SettingsPage() {
  const [form, setForm] = useState({
    revenue_goal: '',
    current_revenue: '',
    days_remaining: '',
    current_focus: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getSettings()
      .then((data) => {
        if (data) {
          setForm({
            revenue_goal: data.revenue_goal ?? '',
            current_revenue: data.current_revenue ?? '',
            days_remaining: data.days_remaining ?? '',
            current_focus: data.current_focus ?? '',
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setSaved(false)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await upsertSettings({
        revenue_goal: Number(form.revenue_goal) || 0,
        current_revenue: Number(form.current_revenue) || 0,
        days_remaining: Number(form.days_remaining) || 0,
        current_focus: form.current_focus,
      })
      setSaved(true)
    } catch (err) {
      alert('Save failed: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingState message="Loading settings..." />

  return (
    <PageContainer>
      <SectionHeader
        title="Settings"
        description="Configure your sprint goals and current focus."
      />

      <form onSubmit={handleSave} className="max-w-lg">
        <Card className="border-[#f0e8ee] shadow-none">
          <CardContent className="p-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="revenue_goal" className="text-sm text-[#4b5563]">
                Revenue Goal (PHP)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm">₱</span>
                <Input
                  id="revenue_goal"
                  name="revenue_goal"
                  type="number"
                  value={form.revenue_goal}
                  onChange={handleChange}
                  className="pl-7 border-[#f0e8ee] focus:ring-[#f9a8c3]"
                  placeholder="40000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_revenue" className="text-sm text-[#4b5563]">
                Current Revenue (PHP)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm">₱</span>
                <Input
                  id="current_revenue"
                  name="current_revenue"
                  type="number"
                  value={form.current_revenue}
                  onChange={handleChange}
                  className="pl-7 border-[#f0e8ee] focus:ring-[#f9a8c3]"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="days_remaining" className="text-sm text-[#4b5563]">
                Days Remaining
              </Label>
              <Input
                id="days_remaining"
                name="days_remaining"
                type="number"
                value={form.days_remaining}
                onChange={handleChange}
                className="border-[#f0e8ee] focus:ring-[#f9a8c3]"
                placeholder="18"
                min="0"
                max="18"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_focus" className="text-sm text-[#4b5563]">
                Current Focus
              </Label>
              <Textarea
                id="current_focus"
                name="current_focus"
                value={form.current_focus}
                onChange={handleChange}
                className="border-[#f0e8ee] focus:ring-[#f9a8c3] resize-none"
                placeholder="e.g. Book first discovery call"
                rows={3}
              />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <Button
                type="submit"
                disabled={saving}
                className="bg-[#e879a0] hover:bg-[#d4648a] text-white"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
              {saved && (
                <span className="text-xs text-[#86efac] font-medium">Saved</span>
              )}
            </div>
          </CardContent>
        </Card>
      </form>
    </PageContainer>
  )
}
