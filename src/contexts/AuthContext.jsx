import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { signIn as signInApi, register as registerApi, logout as logoutApi } from '../lib/authApi'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // 세션을 확인하기 전에는 loading이 true다.
  // 이게 없으면 보호 라우트가 새로고침 직후 잠깐 로그인 화면으로 튕긴다.
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    // 로그인/로그아웃/토큰 갱신이 일어나면 여기로 통보된다.
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      signIn: async (email, password) => setUser(await signInApi(email, password)),
      register: async (email, password) => registerApi(email, password),
      logout: async () => {
        await logoutApi()
        setUser(null)
      },
    }),
    [user, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth는 AuthProvider 안에서만 쓸 수 있습니다.')
  }
  return context
}
