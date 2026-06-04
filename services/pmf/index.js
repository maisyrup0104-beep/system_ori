import { createClient } from '@/lib/supabase/client'

// ── Segments ──────────────────────────────────────────────────────────────────

export async function getSegments() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pmf_segments')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function updateSegment(id, values) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pmf_segments')
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Target Customers ──────────────────────────────────────────────────────────

export async function getTargetCustomer(segmentId) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pmf_target_customers')
    .select('*')
    .eq('segment_id', segmentId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function upsertTargetCustomer(segmentId, values) {
  const supabase = createClient()
  const existing = await getTargetCustomer(segmentId)
  if (existing) {
    const { data, error } = await supabase
      .from('pmf_target_customers')
      .update({ ...values, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) throw error
    return data
  } else {
    const { data, error } = await supabase
      .from('pmf_target_customers')
      .insert({ segment_id: segmentId, ...values })
      .select()
      .single()
    if (error) throw error
    return data
  }
}

// ── Root Problems ─────────────────────────────────────────────────────────────

export async function getRootProblems(segmentId) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pmf_root_problems')
    .select('*')
    .eq('segment_id', segmentId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function createRootProblem(segmentId, values) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pmf_root_problems')
    .insert({ segment_id: segmentId, ...values })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateRootProblem(id, values) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pmf_root_problems')
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteRootProblem(id) {
  const supabase = createClient()
  const { error } = await supabase.from('pmf_root_problems').delete().eq('id', id)
  if (error) throw error
}

// ── Underserved Needs ─────────────────────────────────────────────────────────

export async function getUnderservedNeeds(segmentId) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pmf_underserved_needs')
    .select('*, pmf_root_problems(problem)')
    .eq('segment_id', segmentId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function createUnderservedNeed(segmentId, values) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pmf_underserved_needs')
    .insert({ segment_id: segmentId, ...values })
    .select('*, pmf_root_problems(problem)')
    .single()
  if (error) throw error
  return data
}

export async function updateUnderservedNeed(id, values) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pmf_underserved_needs')
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, pmf_root_problems(problem)')
    .single()
  if (error) throw error
  return data
}

export async function deleteUnderservedNeed(id) {
  const supabase = createClient()
  const { error } = await supabase.from('pmf_underserved_needs').delete().eq('id', id)
  if (error) throw error
}

// ── Requirements ──────────────────────────────────────────────────────────────

export async function getRequirements(segmentId) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pmf_requirements')
    .select('*')
    .eq('segment_id', segmentId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function createRequirement(segmentId, values) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pmf_requirements')
    .insert({ segment_id: segmentId, ...values })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateRequirement(id, values) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pmf_requirements')
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteRequirement(id) {
  const supabase = createClient()
  const { error } = await supabase.from('pmf_requirements').delete().eq('id', id)
  if (error) throw error
}

// ── Solution Clusters ─────────────────────────────────────────────────────────

export async function getSolutionClusters(segmentId) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pmf_solution_clusters')
    .select('*')
    .eq('segment_id', segmentId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function createSolutionCluster(segmentId, values) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pmf_solution_clusters')
    .insert({ segment_id: segmentId, ...values })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateSolutionCluster(id, values) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pmf_solution_clusters')
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteSolutionCluster(id) {
  const supabase = createClient()
  const { error } = await supabase.from('pmf_solution_clusters').delete().eq('id', id)
  if (error) throw error
}

// ── Value Proposition ─────────────────────────────────────────────────────────

export async function getValueProposition(segmentId) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pmf_value_propositions')
    .select('*')
    .eq('segment_id', segmentId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function upsertValueProposition(segmentId, currentVersion) {
  const supabase = createClient()
  const existing = await getValueProposition(segmentId)
  if (existing) {
    const { data, error } = await supabase
      .from('pmf_value_propositions')
      .update({ current_version: currentVersion, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) throw error
    return data
  } else {
    const { data, error } = await supabase
      .from('pmf_value_propositions')
      .insert({ segment_id: segmentId, current_version: currentVersion })
      .select()
      .single()
    if (error) throw error
    return data
  }
}

// ── Deliverables ──────────────────────────────────────────────────────────────

export async function getDeliverables(segmentId) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pmf_deliverables')
    .select('*, pmf_requirements(requirement)')
    .eq('segment_id', segmentId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function createDeliverable(segmentId, values) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pmf_deliverables')
    .insert({ segment_id: segmentId, ...values })
    .select('*, pmf_requirements(requirement)')
    .single()
  if (error) throw error
  return data
}

export async function updateDeliverable(id, values) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pmf_deliverables')
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, pmf_requirements(requirement)')
    .single()
  if (error) throw error
  return data
}

export async function deleteDeliverable(id) {
  const supabase = createClient()
  const { error } = await supabase.from('pmf_deliverables').delete().eq('id', id)
  if (error) throw error
}

// ── Concept Features ──────────────────────────────────────────────────────────

export async function getConceptFeatures(segmentId) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pmf_concept_features')
    .select('*, pmf_root_problems(problem)')
    .eq('segment_id', segmentId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function createConceptFeature(segmentId, values) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pmf_concept_features')
    .insert({ segment_id: segmentId, ...values })
    .select('*, pmf_root_problems(problem)')
    .single()
  if (error) throw error
  return data
}

export async function updateConceptFeature(id, values) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pmf_concept_features')
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, pmf_root_problems(problem)')
    .single()
  if (error) throw error
  return data
}

export async function deleteConceptFeature(id) {
  const supabase = createClient()
  const { error } = await supabase.from('pmf_concept_features').delete().eq('id', id)
  if (error) throw error
}
