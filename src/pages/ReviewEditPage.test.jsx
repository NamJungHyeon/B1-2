import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, test, expect, beforeEach } from 'vitest'

const useReviewDetail = vi.fn()
const useAuth = vi.fn()

vi.mock('../hooks/useReviewDetail', () => ({
  useReviewDetail: () => useReviewDetail(),
}))
vi.mock('../contexts/AuthContext', () => ({ useAuth: () => useAuth() }))
vi.mock('../lib/reviewsApi', () => ({ updateReview: vi.fn() }))

const { default: ReviewEditPage } = await import('./ReviewEditPage')

const renderPage = () =>
  render(
    <MemoryRouter>
      <ReviewEditPage />
    </MemoryRouter>
  )

const review = {
  id: 'r1',
  title: '인터스텔라',
  media_type: '영화',
  rating: 5,
  content: '좋았다',
  poster_url: null,
  watched_date: null,
  user_id: 'owner-1',
}

beforeEach(() => {
  useReviewDetail.mockReset()
  useAuth.mockReset()
  useReviewDetail.mockReturnValue({
    review,
    loading: false,
    error: null,
    refetch: vi.fn(),
  })
})

test('내 리뷰면 수정 폼을 보여준다', () => {
  useAuth.mockReturnValue({ user: { id: 'owner-1' } })
  renderPage()
  expect(screen.getByLabelText('제목')).toHaveValue('인터스텔라')
})

test('남의 리뷰면 폼 대신 안내를 보여준다', () => {
  useAuth.mockReturnValue({ user: { id: 'someone-else' } })
  renderPage()

  expect(screen.getByText('본인이 작성한 리뷰만 수정할 수 있습니다.')).toBeInTheDocument()
  expect(screen.queryByLabelText('제목')).not.toBeInTheDocument()
})

test('주인 없는 리뷰도 수정할 수 없다', () => {
  useReviewDetail.mockReturnValue({
    review: { ...review, user_id: null },
    loading: false,
    error: null,
    refetch: vi.fn(),
  })
  useAuth.mockReturnValue({ user: { id: 'owner-1' } })
  renderPage()

  expect(screen.getByText('본인이 작성한 리뷰만 수정할 수 있습니다.')).toBeInTheDocument()
})
