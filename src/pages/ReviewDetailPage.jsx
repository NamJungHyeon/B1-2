import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useReviewDetail } from '../hooks/useReviewDetail'
import { deleteReview } from '../lib/reviewsApi'
import Badge from '../components/Badge'
import RatingStars from '../components/RatingStars'
import Button from '../components/Button'
import Loading from '../components/Loading'
import ErrorState from '../components/ErrorState'
import ConfirmDialog from '../components/ConfirmDialog'
import Toast from '../components/Toast'

export default function ReviewDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { review, loading, error, refetch } = useReviewDetail(id)

  const location = useLocation()
  const [toast, setToast] = useState(location.state?.toast ?? null)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  // 훅은 조기 반환(early return)보다 위에 있어야 한다.
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  const handleDelete = async () => {
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteReview(id)
      setConfirmOpen(false)
      navigate('/reviews', { state: { toast: '리뷰를 삭제했습니다.' } })
    } catch (err) {
      setConfirmOpen(false)
      setDeleteError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <Loading />
  if (error) return <ErrorState message={error} onRetry={refetch} />
  if (!review) return <ErrorState message="리뷰를 찾을 수 없습니다." />

  return (
    <article className="flex flex-col gap-6">
      {deleteError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          삭제에 실패했습니다: {deleteError}
        </p>
      )}

      <div className="flex flex-col gap-4 sm:flex-row">
        {review.poster_url && (
          <img
            src={review.poster_url}
            alt={`${review.title} 포스터`}
            className="h-64 w-44 shrink-0 rounded-xl object-cover"
          />
        )}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Badge type={review.media_type} />
            <RatingStars value={review.rating} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{review.title}</h1>
          {review.watched_date && (
            <p className="text-sm text-slate-500">본 날짜: {review.watched_date}</p>
          )}
        </div>
      </div>

      <p className="whitespace-pre-wrap text-slate-700">{review.content}</p>

      <div className="flex gap-2">
        <Link
          to={`/reviews/${review.id}/edit`}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          수정
        </Link>
        <Button variant="danger" onClick={() => setConfirmOpen(true)}>
          삭제
        </Button>
        <Link
          to="/reviews"
          className="ml-auto self-center text-sm text-slate-500 hover:underline"
        >
          목록으로
        </Link>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        message="이 리뷰를 삭제할까요? 되돌릴 수 없습니다."
        confirming={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />

      <Toast message={toast} onClose={() => setToast(null)} />
    </article>
  )
}
