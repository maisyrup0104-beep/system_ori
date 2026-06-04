import { createClient } from '@/lib/supabase/client'

export async function getActiveForecasts() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('future_narrative_forecasts')
    .select('*')
    .eq('status', 'Active')
    .order('generated_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function saveForecastBatch(forecasts) {
  const supabase = createClient()

  // Archive existing active forecasts
  await supabase
    .from('future_narrative_forecasts')
    .update({ status: 'Archived' })
    .eq('status', 'Active')

  if (!forecasts.length) return []

  const now = new Date().toISOString()
  const rows = forecasts.map(f => ({
    pillar:           f.pillar,
    narrative_stack:  f.narrative_stack,
    allocation_pct:   f.allocation_pct,
    reason:           f.reason,
    source_state:     f.source_state || null,
    source_pmf_asset: f.source_pmf_asset || null,
    generated_at:     now,
    status:           'Active',
    is_priority:      f.is_priority || false,
  }))

  const { data, error } = await supabase
    .from('future_narrative_forecasts')
    .insert(rows)
    .select()
  if (error) throw error
  return data || []
}

export async function deleteForecast(id) {
  const supabase = createClient()
  const { error } = await supabase.from('future_narrative_forecasts').delete().eq('id', id)
  if (error) throw error
}
