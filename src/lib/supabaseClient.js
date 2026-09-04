import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

// import 시점에 throw하지 않는다.
// 여기서 던지면 환경변수가 빠졌을 때 앱 전체가 흰 화면이 되어 원인을 알 수 없다.
// 대신 null을 두고, 실제로 요청할 때 reviewsApi가 읽을 수 있는 에러를 던진다.
export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null
