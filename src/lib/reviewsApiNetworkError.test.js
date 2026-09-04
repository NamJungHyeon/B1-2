import { vi, test, expect } from 'vitest'

// 네트워크 자체가 실패하면 fetch는 TypeError를 던진다.
// (CORS 차단, 오프라인, 잘못된 호스트 등)
const mockFrom = vi.fn(() => ({
  select: () => ({
    order: () => Promise.reject(new TypeError('Failed to fetch')),
  }),
}))

vi.mock('./supabaseClient', () => ({
  supabase: { from: (...args) => mockFrom(...args) },
  isSupabaseConfigured: true,
}))

const { fetchReviews } = await import('./reviewsApi')

test('네트워크 오류는 개발자 문구 대신 읽을 수 있는 한국어 메시지가 된다', async () => {
  await expect(fetchReviews()).rejects.toThrow('서버에 연결하지 못했습니다')
  await expect(fetchReviews()).rejects.not.toThrow('Failed to fetch')
})
