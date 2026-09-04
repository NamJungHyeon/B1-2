import { supabase } from './supabaseClient'

const TABLE = 'reviews'

const MISSING_CONFIG_MESSAGE =
  'Supabase 환경변수가 없습니다. .env에 VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 설정하세요.'

function client() {
  if (!supabase) throw new Error(MISSING_CONFIG_MESSAGE)
  return supabase
}

// 네트워크 자체가 실패하면 fetch는 TypeError('Failed to fetch')를 던진다.
// (오프라인, 잘못된 호스트, CORS 차단 등)
// 그대로 화면에 띄우면 사용자에게 아무 의미 없는 개발자 문구가 되므로 바꿔준다.
async function guard(run) {
  try {
    return await run()
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error(
        '서버에 연결하지 못했습니다. 네트워크 상태와 Supabase 설정을 확인하세요.'
      )
    }
    throw err
  }
}

export async function fetchReviews() {
  return guard(async () => {
    const { data, error } = await client()
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data
  })
}

export async function fetchReviewById(id) {
  return guard(async () => {
    const { data, error } = await client()
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw new Error(error.message)
    return data
  })
}

export async function createReview(values) {
  return guard(async () => {
    const { data, error } = await client()
      .from(TABLE)
      .insert(values)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  })
}

export async function updateReview(id, values) {
  return guard(async () => {
    const { data, error } = await client()
      .from(TABLE)
      .update(values)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  })
}

export async function deleteReview(id) {
  return guard(async () => {
    const { error } = await client().from(TABLE).delete().eq('id', id)
    if (error) throw new Error(error.message)
  })
}
