import { createClient } from '@/lib/supabase/client'

export async function getLeadActivities(leadId) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('lead_activities')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createLeadActivity(leadId, type, content) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('lead_activities')
    .insert({ lead_id: leadId, type, content })
    .select()
    .single()
  if (error) throw error
  return data
}
