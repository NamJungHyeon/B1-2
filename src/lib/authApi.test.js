import { vi, test, expect, beforeEach } from 'vitest'

const signInWithPassword = vi.fn()
const signUp = vi.fn()
const signOut = vi.fn()

vi.mock('./supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: (...a) => signInWithPassword(...a),
      signUp: (...a) => signUp(...a),
      signOut: (...a) => signOut(...a),
    },
  },
  isSupabaseConfigured: true,
}))

const { signIn, register, logout } = await import('./authApi')

beforeEach(() => {
  signInWithPassword.mockReset()
  signUp.mockReset()
  signOut.mockReset()
})

test('로그인에 성공하면 user를 반환한다', async () => {
  const user = { id: 'u1', email: 'a@b.com' }
  signInWithPassword.mockResolvedValue({ data: { user }, error: null })

  await expect(signIn('a@b.com', 'pw123456')).resolves.toEqual(user)
  expect(signInWithPassword).toHaveBeenCalledWith({
    email: 'a@b.com',
    password: 'pw123456',
  })
})

test('자격 증명이 틀리면 읽을 수 있는 한국어 메시지를 던진다', async () => {
  signInWithPassword.mockResolvedValue({
    data: null,
    error: { message: 'Invalid login credentials' },
  })

  await expect(signIn('a@b.com', 'wrong')).rejects.toThrow(
    '이메일 또는 비밀번호가 올바르지 않습니다.'
  )
})

test('가입한 이메일이 이미 있으면 안내 메시지를 던진다', async () => {
  signUp.mockResolvedValue({
    data: null,
    error: { message: 'User already registered' },
  })

  await expect(register('a@b.com', 'pw123456')).rejects.toThrow(
    '이미 가입된 이메일입니다.'
  )
})

test('로그아웃 실패는 에러를 던진다', async () => {
  signOut.mockResolvedValue({ error: { message: '실패' } })
  await expect(logout()).rejects.toThrow('실패')
})
