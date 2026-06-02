import { createClient } from '@/lib/supabase/client'

export async function getLeads() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createLead(values) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('leads')
    .insert(values)
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
