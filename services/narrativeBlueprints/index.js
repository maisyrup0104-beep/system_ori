import { createClient } from '@/lib/supabase/client'

export async function getAllBlueprints() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('narrative_blueprints')
    .select('*')
    .order('primary_pillar', { ascending: true })
  if (error) throw error
  return data || []
}

export async function getBlueprintsByPillar(pillar) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('narrative_blueprints')
    .select('*')
    .eq('primary_pillar', pillar)
    .order('blueprint_name', { ascending: true })
  if (error) throw error
  return data || []
}

export async function getBlueprintById(id) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('narrative_blueprints')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}
