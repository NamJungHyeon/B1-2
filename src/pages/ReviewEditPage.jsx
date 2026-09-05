import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useReviewDetail } from '../hooks/useReviewDetail'
import { updateReview } from '../lib/reviewsApi'
import { useAuth } from '../contexts/AuthContext'
import ReviewForm from '../components/ReviewForm'
import Loading from '../components/Loading'
import ErrorState from '../components/ErrorState'

export default function ReviewEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { review, loading, error, refetch } = useReviewDetail(id)
  const { user } = useAuth()

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  const handleSubmit = async (values) => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      await updateReview(id, values)
      navigate(`/reviews/${id}`, { state: { toast: '리뷰를 수정했습니다.' } })
    } catch (err) {
      setSubmitError(`수정에 실패했습니다: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  // ReviewForm은 initialValues를 useState의 초기값으로만 읽는다.
  // 따라서 데이터가 도착한 뒤에 폼을 렌더링해야 값이 채워진다.
  if (loading) return <Loading />
  if (error) return <ErrorState message={error} onRetry={refetch} />
  if (!review) return <ErrorState message="리뷰를 찾을 수 없습니다." />

  // 라우트는 로그인만 검사한다. 남의 리뷰 수정 URL로 직접 들어오는 경우를 여기서 막는다.
  // 막지 않으면 폼이 열리고, 저장을 눌러야 RLS에 걸려 개발자 문구가 뜬다.
  if (!user || review.user_id !== user.id) {
    return <ErrorState message="본인이 작성한 리뷰만 수정할 수 있습니다." />
  }

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-slate-900">리뷰 수정</h1>
      <ReviewForm
        initialValues={{
          title: review.title,
          media_type: review.media_type,
          rating: review.rating,
          content: review.content,
          poster_url: review.poster_url ?? '',
          watched_date: review.watched_date ?? '',
        }}
        onSubmit={handleSubmit}
        submitting={submitting}
        submitError={submitError}
        submitLabel="수정하기"
      />
    </section>
  )
}
