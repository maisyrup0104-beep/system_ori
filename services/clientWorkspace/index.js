import { createClient } from '@/lib/supabase/client'

// ── Client ────────────────────────────────────────────────────────────────────

export async function getClientById(id) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function updateClientWorkspace(id, values) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('clients')
    .update(values)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Discovery ─────────────────────────────────────────────────────────────────

export async function getDiscovery(clientId) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('client_discovery')
    .select('*')
    .eq('client_id', clientId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function upsertDiscovery(clientId, values) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('client_discovery')
    .upsert({ client_id: clientId, ...values, updated_at: new Date().toISOString() }, { onConflict: 'client_id' })
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Opportunity Analysis ──────────────────────────────────────────────────────

export async function getOpportunityAnalysis(clientId) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('client_opportunity_analysis')
    .select('*')
    .eq('client_id', clientId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function upsertOpportunityAnalysis(clientId, values) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('client_opportunity_analysis')
    .upsert({ client_id: clientId, ...values, updated_at: new Date().toISOString() }, { onConflict: 'client_id' })
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Production Workspace ──────────────────────────────────────────────────────

export async function getProductionWorkspace(clientId) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('client_production_workspace')
    .select('*')
    .eq('client_id', clientId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function upsertProductionWorkspace(clientId, values) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('client_production_workspace')
    .upsert({ client_id: clientId, ...values, updated_at: new Date().toISOString() }, { onConflict: 'client_id' })
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Delivery Workspace ────────────────────────────────────────────────────────

export async function getDeliveryWorkspace(clientId) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('client_delivery_workspace')
    .select('*')
    .eq('client_id', clientId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function upsertDeliveryWorkspace(clientId, values) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('client_delivery_workspace')
    .upsert({ client_id: clientId, ...values, updated_at: new Date().toISOString() }, { onConflict: 'client_id' })
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Testimonial Workspace ─────────────────────────────────────────────────────

export async function getTestimonialWorkspace(clientId) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('client_testimonial_workspace')
    .select('*')
    .eq('client_id', clientId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function upsertTestimonialWorkspace(clientId, values) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('client_testimonial_workspace')
    .upsert({ client_id: clientId, ...values, updated_at: new Date().toISOString() }, { onConflict: 'client_id' })
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Assets ────────────────────────────────────────────────────────────────────

export async function getAssets(clientId) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('client_assets')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function createAsset(clientId, values) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('client_assets')
    .insert({ client_id: clientId, ...values })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteAsset(id) {
  const supabase = createClient()
  const { error } = await supabase.from('client_assets').delete().eq('id', id)
  if (error) throw error
}

// ── Validation Signals ────────────────────────────────────────────────────────

export async function getValidationSignals(clientId) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('client_validation_signals')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createValidationSignal(clientId, values) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('client_validation_signals')
    .insert({ client_id: clientId, ...values })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteValidationSignal(id) {
  const supabase = createClient()
  const { error } = await supabase.from('client_validation_signals').delete().eq('id', id)
  if (error) throw error
}

// ── Timeline ──────────────────────────────────────────────────────────────────

export async function getTimeline(clientId) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('client_workspace_timeline')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function addTimelineEntry(clientId, event_type, description) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('client_workspace_timeline')
    .insert({ client_id: clientId, event_type, description })
    .select()
    .single()
  if (error) throw error
  return data
}
