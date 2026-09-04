import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Input from '../components/Input'
import Button from '../components/Button'
import Loading from '../components/Loading'

export default function LoginPage() {
  const { user, loading, signIn, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [notice, setNotice] = useState(null)

  const isSignUp = mode === 'signup'

  const validate = () => {
    const found = {}
    if (!email.trim()) found.email = '이메일을 입력하세요.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      found.email = '올바른 이메일 형식이 아닙니다.'
    if (!password) found.password = '비밀번호를 입력하세요.'
    else if (password.length < 6) found.password = '비밀번호는 6자 이상이어야 합니다.'
    return found
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSubmitting(true)
    setSubmitError(null)
    setNotice(null)
    try {
      if (isSignUp) {
        await register(email.trim(), password)
        setNotice('가입이 완료됐습니다. 이제 로그인하세요.')
        setMode('signin')
        setPassword('')
      } else {
        await signIn(email.trim(), password)
        navigate(location.state?.from ?? '/reviews', { replace: true })
      }
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loading message="확인 중..." />
  if (user) return <Navigate to="/reviews" replace />

  return (
    <section className="mx-auto flex w-full max-w-sm flex-col gap-6">
      <h1 className="text-2xl font-bold text-slate-900">
        {isSignUp ? '회원가입' : '로그인'}
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {submitError && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {submitError}
          </p>
        )}
        {notice && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {notice}
          </p>
        )}

        <Input
          label="이메일"
          type="email"
          value={email}
          onChange={(value) => {
            setEmail(value)
            setErrors((prev) => ({ ...prev, email: undefined }))
          }}
          error={errors.email}
          placeholder="you@example.com"
        />
        <Input
          label="비밀번호"
          type="password"
          value={password}
          onChange={(value) => {
            setPassword(value)
            setErrors((prev) => ({ ...prev, password: undefined }))
          }}
          error={errors.password}
          placeholder="6자 이상"
        />

        <Button type="submit" loading={submitting}>
          {isSignUp ? '가입하기' : '로그인'}
        </Button>
      </form>

      <p className="text-center text-sm text-slate-600">
        {isSignUp ? '이미 계정이 있나요?' : '계정이 없나요?'}{' '}
        <button
          type="button"
          onClick={() => {
            setMode(isSignUp ? 'signin' : 'signup')
            setErrors({})
            setSubmitError(null)
            setNotice(null)
          }}
          className="font-medium text-indigo-600 hover:underline"
        >
          {isSignUp ? '로그인' : '회원가입'}
        </button>
      </p>
    </section>
  )
}
