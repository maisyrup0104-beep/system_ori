import { createClient } from '@/lib/supabase/client'

// Called from Content OS "Save To Queue" — maps opportunity fields to DB columns
export async function saveToQueue(values) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('content_queue')
    .insert({
      platform:                 values.platform,
      visibility:               values.visibility,
      priority:                 values.priority,
      primary_pillar:           values.primary_pillar,
      narrative_stack:          values.narrative_stack,
      supporting_moments:       values.supporting_moments,
      story_template_name:      values.story_template?.name,
      story_template_steps:     values.story_template?.steps,
      source_type:              values.source_type,
      source_events:            values.source_events,
      source_pmf_assets:        values.source_pmf_assets,
      source_concept_features:      values.source_concept_features || [],
      reason:                       values.reason,
      status:                       'Queued',
      blueprint_name:               values.blueprint?.blueprint_name || null,
      blueprint_life_moments:       values.blueprint?.life_moments || [],
      blueprint_work_moments:       values.blueprint?.work_moments || [],
      blueprint_reflection_moments: values.blueprint?.reflection_moments || [],
      blueprint_locations:          values.blueprint?.recommended_locations || [],
      blueprint_props:              values.blueprint?.recommended_props || [],
      blueprint_wardrobe:           values.blueprint?.recommended_wardrobe || [],
    })
    .select()
    .single()
  if (error) throw error
  return data
}

// Manual queue entry from Queue page
export async function createQueueItem(values) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('content_queue')
    .insert({
      title:                    values.title || null,
      platform:                 values.platform || 'Both',
      visibility:               values.platform || 'Both',
      priority:                 values.priority || 'Medium',
      primary_pillar:           values.primary_pillar,
      narrative_stack:          values.narrative_stack || null,
      supporting_moments:       values.supporting_moments || [],
      story_template_name:      values.story_template_name || null,
      story_template_steps:     values.story_template_steps || [],
      source_type:              'Manual',
      source_events:            [],
      source_pmf_assets:        [],
      source_concept_features:  [],
      notes:                    values.notes || null,
      scheduled_date:           values.scheduled_date || null,
      status:                   'Queued',
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getQueue() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('content_queue')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function updateQueueItem(id, values) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('content_queue')
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateQueueStatus(id, status) {
  const supabase = createClient()
  const updates = {
    status,
    updated_at: new Date().toISOString(),
    ...(status === 'Posted' ? { posted_at: new Date().toISOString() } : {}),
  }
  const { data, error } = await supabase
    .from('content_queue')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteFromQueue(id) {
  const supabase = createClient()
  const { error } = await supabase.from('content_queue').delete().eq('id', id)
  if (error) throw error
}
