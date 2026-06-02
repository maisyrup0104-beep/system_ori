import { createClient } from '@/lib/supabase/client'

export async function getPersonalStates() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('personal_states')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createPersonalState(values) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('personal_states')
    .insert(values)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deletePersonalState(id) {
  const supabase = createClient()
  const { error } = await supabase.from('personal_states').delete().eq('id', id)
  if (error) throw error
}
