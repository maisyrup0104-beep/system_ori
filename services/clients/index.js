import { createClient } from '@/lib/supabase/client'

export async function getClients() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createClientRecord(values) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('clients')
    .insert(values)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateClientRecord(id, values) {
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

export async function deleteClientRecord(id) {
  const supabase = createClient()
  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) throw error
}
