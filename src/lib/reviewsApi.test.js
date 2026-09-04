import { vi, describe, test, expect, beforeEach } from 'vitest'

const mockFrom = vi.fn()
vi.mock('./supabaseClient', () => ({
  supabase: { from: (...args) => mockFrom(...args) },
}))

const { fetchReviews, fetchReviewById, createReview, deleteReview } =
  await import('./reviewsApi')

beforeEach(() => {
  mockFrom.mockReset()
})

describe('fetchReviews', () => {
  test('성공하면 리뷰 배열을 반환한다', async () => {
    const rows = [{ id: '1', title: '인터스텔라' }]
    mockFrom.mockReturnValue({
      select: () => ({
        order: () => Promise.resolve({ data: rows, error: null }),
      }),
    })

    await expect(fetchReviews()).resolves.toEqual(rows)
  })

  test('실패하면 에러를 던진다', async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        order: () =>
          Promise.resolve({ data: null, error: { message: '연결 실패' } }),
      }),
    })

    await expect(fetchReviews()).rejects.toThrow('연결 실패')
  })
})

describe('fetchReviewById', () => {
  test('단건을 반환한다', async () => {
    const row = { id: '1', title: '인터스텔라' }
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: row, error: null }),
        }),
      }),
    })

    await expect(fetchReviewById('1')).resolves.toEqual(row)
  })
})

describe('createReview', () => {
  test('생성된 리뷰를 반환한다', async () => {
    const row = { id: '2', title: '오징어 게임' }
    mockFrom.mockReturnValue({
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: row, error: null }),
        }),
      }),
    })

    await expect(createReview({ title: '오징어 게임' })).resolves.toEqual(row)
  })
})

describe('deleteReview', () => {
  test('실패하면 에러를 던진다', async () => {
    mockFrom.mockReturnValue({
      delete: () => ({
        eq: () => Promise.resolve({ error: { message: '삭제 실패' } }),
      }),
    })

    await expect(deleteReview('1')).rejects.toThrow('삭제 실패')
  })
})
