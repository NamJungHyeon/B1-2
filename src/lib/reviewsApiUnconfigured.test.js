import { vi, test, expect } from 'vitest'

// 환경변수가 없어서 클라이언트가 만들어지지 않은 상황을 재현한다.
vi.mock('./supabaseClient', () => ({
  supabase: null,
  isSupabaseConfigured: false,
}))

const { fetchReviews } = await import('./reviewsApi')

test('환경변수가 없으면 import가 아니라 호출 시점에 읽을 수 있는 에러를 던진다', async () => {
  await expect(fetchReviews()).rejects.toThrow('Supabase 환경변수가 없습니다')
})
