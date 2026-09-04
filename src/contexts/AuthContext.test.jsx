import { render, screen, waitFor } from '@testing-library/react'
import { vi, test, expect, beforeEach } from 'vitest'

const getSession = vi.fn()
const onAuthStateChange = vi.fn()
const unsubscribe = vi.fn()

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: (...a) => getSession(...a),
      onAuthStateChange: (...a) => onAuthStateChange(...a),
    },
  },
  isSupabaseConfigured: true,
}))

vi.mock('../lib/authApi', () => ({
  signIn: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
}))

const { AuthProvider, useAuth } = await import('./AuthContext')

function Probe() {
  const { user, loading } = useAuth()
  if (loading) return <p>확인 중</p>
  return <p>{user ? user.email : '비로그인'}</p>
}

const renderProbe = () =>
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  )

beforeEach(() => {
  getSession.mockReset()
  onAuthStateChange.mockReset()
  onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe } },
  })
})

test('세션이 있으면 user를 제공한다', async () => {
  getSession.mockResolvedValue({
    data: { session: { user: { id: 'u1', email: 'a@b.com' } } },
  })

  renderProbe()
  expect(screen.getByText('확인 중')).toBeInTheDocument()
  await waitFor(() => expect(screen.getByText('a@b.com')).toBeInTheDocument())
})

test('세션이 없으면 user가 null이다', async () => {
  getSession.mockResolvedValue({ data: { session: null } })

  renderProbe()
  await waitFor(() => expect(screen.getByText('비로그인')).toBeInTheDocument())
})

test('언마운트하면 구독을 해지한다', async () => {
  getSession.mockResolvedValue({ data: { session: null } })

  const { unmount } = renderProbe()
  await waitFor(() => expect(screen.getByText('비로그인')).toBeInTheDocument())

  unmount()
  expect(unsubscribe).toHaveBeenCalled()
})
