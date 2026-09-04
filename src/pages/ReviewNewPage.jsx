import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createReview } from '../lib/reviewsApi'
import { useAuth } from '../contexts/AuthContext'
import ReviewForm from '../components/ReviewForm'

export default function ReviewNewPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  const handleSubmit = async (values) => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      // RLS 정책이 auth.uid() = user_id를 요구하므로 작성자를 반드시 넣어야 한다.
      const created = await createReview({ ...values, user_id: user.id })
      navigate(`/reviews/${created.id}`, { state: { toast: '리뷰를 등록했습니다.' } })
    } catch (err) {
      setSubmitError(`저장에 실패했습니다: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-slate-900">리뷰 쓰기</h1>
      <ReviewForm
        onSubmit={handleSubmit}
        submitting={submitting}
        submitError={submitError}
        submitLabel="등록하기"
      />
    </section>
  )
}
