import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi, test, expect, beforeEach } from 'vitest'

const useReviews = vi.fn()
const useAuth = vi.fn()
vi.mock('../hooks/useReviews', () => ({ useReviews: () => useReviews() }))
vi.mock('../contexts/AuthContext', () => ({ useAuth: () => useAuth() }))

const { default: ProfilePage } = await import('./ProfilePage')

const mine = (n) =>
  Array.from({ length: n }, (_, i) => ({
    id: `m${i + 1}`,
    title: `내 리뷰 ${i + 1}`,
    media_type: '영화',
    rating: 4,
    content: 'x',
    user_id: 'me',
  }))

const others = [
  { id: 'o1', title: '남의 리뷰', media_type: '드라마', rating: 5, content: 'y', user_id: 'other' },
]

const renderAt = (path = '/profile') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <ProfilePage />
    </MemoryRouter>
  )

beforeEach(() => {
  useReviews.mockReset()
  useAuth.mockReset()
  useAuth.mockReturnValue({ user: { id: 'me', email: 'me@test.com' } })
})

test('내 리뷰만 집계하고 남의 리뷰는 제외한다', () => {
  useReviews.mockReturnValue({
    reviews: [...mine(3), ...others],
    loading: false,
    error: null,
    refetch: vi.fn(),
  })
  renderAt()
  expect(screen.getAllByText('3개').length).toBeGreaterThan(0)
  expect(screen.queryByText('남의 리뷰')).not.toBeInTheDocument()
})

test('내 리뷰가 10개를 넘으면 10개씩 나눠 보여준다', () => {
  useReviews.mockReturnValue({
    reviews: mine(22),
    loading: false,
    error: null,
    refetch: vi.fn(),
  })
  renderAt()
  expect(screen.getByText('내 리뷰 1')).toBeInTheDocument()
  expect(screen.getByText('내 리뷰 10')).toBeInTheDocument()
  expect(screen.queryByText('내 리뷰 11')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: '3페이지' })).toBeInTheDocument()
})

test('페이지 버튼으로 다음 묶음을 볼 수 있다', async () => {
  useReviews.mockReturnValue({
    reviews: mine(22),
    loading: false,
    error: null,
    refetch: vi.fn(),
  })
  renderAt()
  await userEvent.click(screen.getByRole('button', { name: '3페이지' }))
  expect(screen.getByText('내 리뷰 21')).toBeInTheDocument()
  expect(screen.getByText('내 리뷰 22')).toBeInTheDocument()
  expect(screen.queryByText('내 리뷰 20')).not.toBeInTheDocument()
})

test('통계는 페이지와 무관하게 전체 기준이다', async () => {
  useReviews.mockReturnValue({
    reviews: mine(22),
    loading: false,
    error: null,
    refetch: vi.fn(),
  })
  renderAt('/profile?page=3')
  expect(screen.getAllByText('22개').length).toBeGreaterThan(0)
})

test('내 리뷰가 없으면 빈 상태를 보여준다', () => {
  useReviews.mockReturnValue({ reviews: others, loading: false, error: null, refetch: vi.fn() })
  renderAt()
  expect(screen.getByText('아직 작성한 리뷰가 없습니다.')).toBeInTheDocument()
})
