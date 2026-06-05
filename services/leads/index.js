import { createClient } from '@/lib/supabase/client'

// Fetch all leads ordered by sort_order (manual row order)
export async function getLeads() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true }) // tiebreaker for un-migrated rows
  if (error) throw error
  return data
}

// Insert new lead at position 2 (below row #1, above everything else)
export async function createLead(values) {
  const supabase = createClient()

  // Find current row ordering
  const { data: existing } = await supabase
    .from('leads')
    .select('id, sort_order')
    .order('sort_order', { ascending: true })

  if (!existing || existing.length === 0) {
    // First-ever lead — place at position 1
    const { data, error } = await supabase
      .from('leads')
      .insert({ ...values, sort_order: 1 })
      .select()
      .single()
    if (error) throw error
    return data
  }

  const firstOrder = existing[0].sort_order ?? 1

  // Shift all leads after row #1 down by 1 to make room
  const toShift = existing.slice(1)
  for (const lead of toShift) {
    await supabase
      .from('leads')
      .update({ sort_order: (lead.sort_order ?? 1) + 1 })
      .eq('id', lead.id)
  }

  // Insert new lead at position 2 (directly below row #1)
  const { data, error } = await supabase
    .from('leads')
    .insert({ ...values, sort_order: firstOrder + 1 })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateLead(id, values) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('leads')
    .update(values)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteLead(id) {
  const supabase = createClient()
  const { error } = await supabase.from('leads').delete().eq('id', id)
  if (error) throw error
}
