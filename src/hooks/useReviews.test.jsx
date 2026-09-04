import { renderHook, waitFor } from '@testing-library/react'
import { vi, test, expect, beforeEach } from 'vitest'

const fetchReviews = vi.fn()
vi.mock('../lib/reviewsApi', () => ({ fetchReviews: (...a) => fetchReviews(...a) }))

const { useReviews } = await import('./useReviews')

// 블록 본문으로 쓴다. `() => fetchReviews.mockReset()`처럼 간결 본문으로 쓰면
// mockReset()이 반환하는 목 함수가 beforeEach의 반환값이 되고,
// Vitest는 훅이 반환한 함수를 teardown으로 간주해 테스트 후 호출한다.
// 그러면 목이 한 번 더 호출되어 처리되지 않은 rejection이 발생한다.
beforeEach(() => {
  fetchReviews.mockReset()
})

test('성공하면 목록과 loading=false를 준다', async () => {
  fetchReviews.mockResolvedValue([{ id: '1', title: '인터스텔라' }])
  const { result } = renderHook(() => useReviews())

  expect(result.current.loading).toBe(true)
  await waitFor(() => expect(result.current.loading).toBe(false))
  expect(result.current.reviews).toHaveLength(1)
  expect(result.current.error).toBe(null)
})

test('실패하면 error 메시지를 준다', async () => {
  fetchReviews.mockRejectedValue(new Error('연결 실패'))
  const { result } = renderHook(() => useReviews())

  await waitFor(() => expect(result.current.loading).toBe(false))
  expect(result.current.error).toBe('연결 실패')
  expect(result.current.reviews).toEqual([])
})
