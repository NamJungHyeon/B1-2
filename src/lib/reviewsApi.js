import { supabase } from './supabaseClient'

const TABLE = 'reviews'

export async function fetchReviews() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function fetchReviewById(id) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function createReview(values) {
  const { data, error } = await supabase
    .from(TABLE)
    .insert(values)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function updateReview(id, values) {
  const { data, error } = await supabase
    .from(TABLE)
    .update(values)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function deleteReview(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw new Error(error.message)
}
