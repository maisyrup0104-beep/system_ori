import { createClient } from '@/lib/supabase/client'

export async function getEvents() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createEvent(values) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('events')
    .insert(values)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateEvent(id, values) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('events')
    .update(values)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteEvent(id) {
  const supabase = createClient()
  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) throw error
}
