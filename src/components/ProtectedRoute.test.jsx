import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi, test, expect, beforeEach } from 'vitest'

const useAuth = vi.fn()
vi.mock('../contexts/AuthContext', () => ({ useAuth: () => useAuth() }))

const { default: ProtectedRoute } = await import('./ProtectedRoute')

const renderAt = (path = '/secret') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/secret" element={<p>비밀 화면</p>} />
        </Route>
        <Route path="/login" element={<p>로그인 화면</p>} />
      </Routes>
    </MemoryRouter>
  )

beforeEach(() => {
  useAuth.mockReset()
})

test('세션 확인 중에는 로딩을 보여준다', () => {
  useAuth.mockReturnValue({ user: null, loading: true })
  renderAt()
  expect(screen.getByText('불러오는 중...')).toBeInTheDocument()
})

test('비로그인이면 로그인 화면으로 보낸다', () => {
  useAuth.mockReturnValue({ user: null, loading: false })
  renderAt()
  expect(screen.getByText('로그인 화면')).toBeInTheDocument()
  expect(screen.queryByText('비밀 화면')).not.toBeInTheDocument()
})

test('로그인 상태면 자식 화면을 보여준다', () => {
  useAuth.mockReturnValue({ user: { id: 'u1' }, loading: false })
  renderAt()
  expect(screen.getByText('비밀 화면')).toBeInTheDocument()
})
