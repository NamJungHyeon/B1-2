import { supabase } from './supabaseClient'

const MISSING_CONFIG_MESSAGE =
  'Supabase 환경변수가 없습니다. .env에 VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 설정하세요.'

function client() {
  if (!supabase) throw new Error(MISSING_CONFIG_MESSAGE)
  return supabase
}

// Supabase가 돌려주는 영어 메시지를 사용자가 읽을 수 있는 문구로 바꾼다.
// 매칭되지 않으면 원문을 그대로 쓴다.
const MESSAGES = [
  ['Invalid login credentials', '이메일 또는 비밀번호가 올바르지 않습니다.'],
  ['User already registered', '이미 가입된 이메일입니다.'],
  ['Password should be at least', '비밀번호는 6자 이상이어야 합니다.'],
  ['Email not confirmed', '이메일 인증이 완료되지 않았습니다. 메일함을 확인하세요.'],
]

function toKorean(message) {
  const found = MESSAGES.find(([en]) => message.includes(en))
  return found ? found[1] : message
}

export async function signIn(email, password) {
  const { data, error } = await client().auth.signInWithPassword({ email, password })
  if (error) throw new Error(toKorean(error.message))
  return data.user
}

export async function register(email, password) {
  const { data, error } = await client().auth.signUp({ email, password })
  if (error) throw new Error(toKorean(error.message))
  return data.user
}

export async function logout() {
  const { error } = await client().auth.signOut()
  if (error) throw new Error(toKorean(error.message))
}
