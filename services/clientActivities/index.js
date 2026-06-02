import { createClient } from '@/lib/supabase/client'

export async function getClientActivities(clientId) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('client_activities')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createClientActivity(clientId, type, content) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('client_activities')
    .insert({ client_id: clientId, type, content })
    .select()
    .single()
  if (error) throw error
  return data
}
