import { renderHook, waitFor } from '@testing-library/react'
import { vi, test, expect, beforeEach } from 'vitest'

const fetchReviewById = vi.fn()
vi.mock('../lib/reviewsApi', () => ({
  fetchReviewById: (...a) => fetchReviewById(...a),
}))

const { useReviewDetail } = await import('./useReviewDetail')

beforeEach(() => {
  fetchReviewById.mockReset()
})

test('id로 단건을 불러온다', async () => {
  fetchReviewById.mockResolvedValue({ id: '1', title: '인터스텔라' })
  const { result } = renderHook(() => useReviewDetail('1'))

  await waitFor(() => expect(result.current.loading).toBe(false))
  expect(fetchReviewById).toHaveBeenCalledWith('1')
  expect(result.current.review.title).toBe('인터스텔라')
})

test('실패하면 error를 준다', async () => {
  fetchReviewById.mockRejectedValue(new Error('없는 리뷰입니다'))
  const { result } = renderHook(() => useReviewDetail('999'))

  await waitFor(() => expect(result.current.loading).toBe(false))
  expect(result.current.error).toBe('없는 리뷰입니다')
  expect(result.current.review).toBe(null)
})
