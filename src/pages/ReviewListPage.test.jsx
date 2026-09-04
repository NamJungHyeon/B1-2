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
