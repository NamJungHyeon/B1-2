import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useReviews } from '../hooks/useReviews'
import ReviewList from '../components/ReviewList'
import ReviewFilterBar from '../components/ReviewFilterBar'
import Loading from '../components/Loading'
import ErrorState from '../components/ErrorState'
import EmptyState from '../components/EmptyState'
import Toast from '../components/Toast'

export default function ReviewListPage() {
  const { reviews, loading, error, refetch } = useReviews()
  const [keyword, setKeyword] = useState('')
  const [rating, setRating] = useState('all')
  const navigate = useNavigate()

  const location = useLocation()
  const [toast, setToast] = useState(location.state?.toast ?? null)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  // 필터 결과는 별도 state로 복제하지 않고 원본에서 파생시킨다.
  const filtered = useMemo(() => {
    return reviews.filter((review) => {
      const matchesKeyword = review.title
        .toLowerCase()
        .includes(keyword.trim().toLowerCase())
      const matchesRating = rating === 'all' || review.rating === Number(rating)
      return matchesKeyword && matchesRating
    })
  }, [reviews, keyword, rating])

  // 빈 상태가 두 가지로 나뉜다: 데이터 자체가 없을 때와 필터 결과가 없을 때.
  // 안내 문구가 달라야 사용자가 헷갈리지 않는다.
  const renderBody = () => {
    if (loading) return <Loading />
    if (error) return <ErrorState message={error} onRetry={refetch} />
    if (reviews.length === 0) {
      return (
        <EmptyState
          message="아직 등록된 리뷰가 없습니다."
          actionLabel="첫 리뷰 쓰기"
          onAction={() => navigate('/reviews/new')}
        />
      )
    }
    if (filtered.length === 0) {
      return <EmptyState message="조건에 맞는 리뷰가 없습니다." />
    }
    return <ReviewList reviews={filtered} />
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">리뷰 목록</h1>
        <span className="text-sm text-slate-500">{filtered.length}개</span>
      </div>
      <ReviewFilterBar
        keyword={keyword}
        rating={rating}
        onKeywordChange={setKeyword}
        onRatingChange={setRating}
      />
      {renderBody()}
      <Toast message={toast} onClose={() => setToast(null)} />
    </section>
  )
}
