import { createClient } from '@/lib/supabase/client'

export async function getSettings() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)
    .single()
  if (error) throw error
  return data
}

export async function upsertSettings(values) {
  const supabase = createClient()
  const existing = await getSettings().catch(() => null)

  if (existing) {
    const { data, error } = await supabase
      .from('settings')
      .update({ ...values, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) throw error
    return data
  }

  const { data, error } = await supabase
    .from('settings')
    .insert(values)
    .select()
    .single()
  if (error) throw error
  return data
}
