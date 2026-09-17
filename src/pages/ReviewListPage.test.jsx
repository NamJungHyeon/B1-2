import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi, test, expect, beforeEach } from 'vitest'

const useReviews = vi.fn()
vi.mock('../hooks/useReviews', () => ({ useReviews: () => useReviews() }))

const { default: ReviewListPage } = await import('./ReviewListPage')

const renderPage = () =>
  render(
    <MemoryRouter>
      <ReviewListPage />
    </MemoryRouter>
  )

beforeEach(() => {
  useReviews.mockReset()
})

test('로딩 중이면 로딩을 보여준다', () => {
  useReviews.mockReturnValue({ reviews: [], loading: true, error: null, refetch: vi.fn() })
  renderPage()
  expect(screen.getByText('불러오는 중...')).toBeInTheDocument()
})

test('에러면 에러 상태를 보여준다', () => {
  useReviews.mockReturnValue({
    reviews: [],
    loading: false,
    error: '연결 실패',
    refetch: vi.fn(),
  })
  renderPage()
  expect(screen.getByText('연결 실패')).toBeInTheDocument()
})

test('데이터가 없으면 빈 상태를 보여준다', () => {
  useReviews.mockReturnValue({ reviews: [], loading: false, error: null, refetch: vi.fn() })
  renderPage()
  expect(screen.getByText('아직 등록된 리뷰가 없습니다.')).toBeInTheDocument()
})

test('검색어를 입력하면 목록이 걸러진다', async () => {
  useReviews.mockReturnValue({
    reviews: [
      { id: '1', title: '인터스텔라', media_type: '영화', rating: 5, content: 'a' },
      { id: '2', title: '오징어 게임', media_type: '드라마', rating: 4, content: 'b' },
    ],
    loading: false,
    error: null,
    refetch: vi.fn(),
  })
  renderPage()

  expect(screen.getByText('인터스텔라')).toBeInTheDocument()
  await userEvent.type(screen.getByLabelText('제목 검색'), '오징어')

  expect(screen.queryByText('인터스텔라')).not.toBeInTheDocument()
  expect(screen.getByText('오징어 게임')).toBeInTheDocument()
})

const makeReviews = (n) =>
  Array.from({ length: n }, (_, i) => ({
    id: String(i + 1),
    title: `리뷰 ${i + 1}`,
    media_type: '영화',
    rating: 4,
    content: 'x',
  }))

const renderAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <ReviewListPage />
    </MemoryRouter>
  )

test('10개씩 끊어 첫 페이지에는 10개만 보인다', () => {
  useReviews.mockReturnValue({ reviews: makeReviews(25), loading: false, error: null, refetch: vi.fn() })
  renderAt('/reviews')

  expect(screen.getByText('리뷰 1')).toBeInTheDocument()
  expect(screen.getByText('리뷰 10')).toBeInTheDocument()
  expect(screen.queryByText('리뷰 11')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: '3페이지' })).toBeInTheDocument()
})

test('?page=3이면 21~25번째가 보인다', () => {
  useReviews.mockReturnValue({ reviews: makeReviews(25), loading: false, error: null, refetch: vi.fn() })
  renderAt('/reviews?page=3')

  expect(screen.getByText('리뷰 21')).toBeInTheDocument()
  expect(screen.getByText('리뷰 25')).toBeInTheDocument()
  expect(screen.queryByText('리뷰 20')).not.toBeInTheDocument()
})

test('페이지 버튼을 누르면 해당 페이지로 넘어간다', async () => {
  useReviews.mockReturnValue({ reviews: makeReviews(25), loading: false, error: null, refetch: vi.fn() })
  renderAt('/reviews')

  await userEvent.click(screen.getByRole('button', { name: '2페이지' }))
  expect(screen.getByText('리뷰 11')).toBeInTheDocument()
  expect(screen.queryByText('리뷰 1')).not.toBeInTheDocument()
})

test('검색어를 입력하면 1페이지로 돌아간다', async () => {
  useReviews.mockReturnValue({ reviews: makeReviews(25), loading: false, error: null, refetch: vi.fn() })
  renderAt('/reviews?page=3')
  expect(screen.getByText('리뷰 21')).toBeInTheDocument()

  await userEvent.type(screen.getByLabelText('제목 검색'), '리뷰 1')

  // '리뷰 1', '리뷰 10'~'리뷰 19' = 11개 → 1페이지에 10개
  expect(screen.getByText('리뷰 1')).toBeInTheDocument()
  expect(screen.queryByText('리뷰 21')).not.toBeInTheDocument()
})

test('범위를 벗어난 page는 마지막 페이지로 보정된다', () => {
  useReviews.mockReturnValue({ reviews: makeReviews(25), loading: false, error: null, refetch: vi.fn() })
  renderAt('/reviews?page=99')
  expect(screen.getByText('리뷰 25')).toBeInTheDocument()
})

test('10개 이하면 페이지네이션이 안 보인다', () => {
  useReviews.mockReturnValue({ reviews: makeReviews(7), loading: false, error: null, refetch: vi.fn() })
  renderAt('/reviews')
  expect(screen.queryByRole('button', { name: /페이지$/ })).not.toBeInTheDocument()
})
