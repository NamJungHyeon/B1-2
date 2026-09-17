import { supabase } from './supabaseClient'

const BUCKET = 'posters'
const MAX_SIZE = 2 * 1024 * 1024

// 파일을 고르자마자 바로 알려줄 수 있도록 업로드 전에 검사한다.
export function validatePosterFile(file) {
  if (!file.type.startsWith('image/')) return '이미지 파일만 올릴 수 있습니다.'
  if (file.size > MAX_SIZE) return '2MB 이하의 이미지만 올릴 수 있습니다.'
  return null
}

// 업로드 후 공개 URL을 돌려준다. DB에는 이 URL 문자열만 저장하므로
// 링크 입력 방식과 파일 첨부 방식이 같은 poster_url 컬럼을 쓴다.
export async function uploadPoster(file) {
  if (!supabase) throw new Error('Supabase 환경변수가 없습니다.')

  const { data: userData } = await supabase.auth.getUser()
  const userId = userData?.user?.id
  if (!userId) throw new Error('로그인이 필요합니다.')

  // 사용자별 폴더로 나누고 타임스탬프를 붙여 이름 충돌을 피한다.
  const ext = file.name.split('.').pop()
  const path = `${userId}/${Date.now()}.${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  })
  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}
