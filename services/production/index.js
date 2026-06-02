import { createClient } from '@/lib/supabase/client'

export async function getProductionItems() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('production_items')
    .select('*, clients(id, business_name, segment, client_type, delivery_date, testimonial_status)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createProductionItem(values) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('production_items')
    .insert(values)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateProductionItem(id, values) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('production_items')
    .update(values)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteProductionItem(id) {
  const supabase = createClient()
  const { error } = await supabase.from('production_items').delete().eq('id', id)
  if (error) throw error
}
