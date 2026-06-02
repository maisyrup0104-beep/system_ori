import { createClient } from '@/lib/supabase/client'

export async function getOriStates() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('ori_states')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createOriState(values) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('ori_states')
    .insert(values)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteOriState(id) {
  const supabase = createClient()
  const { error } = await supabase.from('ori_states').delete().eq('id', id)
  if (error) throw error
}
