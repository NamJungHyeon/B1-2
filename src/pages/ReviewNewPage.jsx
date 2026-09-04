import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createReview } from '../lib/reviewsApi'
import ReviewForm from '../components/ReviewForm'

export default function ReviewNewPage() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  const handleSubmit = async (values) => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const created = await createReview(values)
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
