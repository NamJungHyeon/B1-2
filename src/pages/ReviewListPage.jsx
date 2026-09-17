import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useReviews } from '../hooks/useReviews'
import { usePagination } from '../hooks/usePagination'
import ReviewList from '../components/ReviewList'
import ReviewFilterBar from '../components/ReviewFilterBar'
import Pagination from '../components/Pagination'
import Loading from '../components/Loading'
import ErrorState from '../components/ErrorState'
import EmptyState from '../components/EmptyState'
import Toast from '../components/Toast'

const PAGE_SIZE = 10

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

  const { page, totalPages, pageItems, goToPage, resetPage } = usePagination(
    filtered,
    PAGE_SIZE
  )

  // 검색어나 별점 조건이 바뀌면 1페이지부터 다시 본다.
  const handleKeywordChange = (value) => {
    setKeyword(value)
    resetPage()
  }

  const handleRatingChange = (value) => {
    setRating(value)
    resetPage()
  }

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
    return (
      <>
        <ReviewList reviews={pageItems} />
        <Pagination page={page} totalPages={totalPages} onChange={goToPage} />
      </>
    )
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">리뷰 목록</h1>
        <span className="text-sm text-slate-500">
          {filtered.length}개
          {totalPages > 1 && ` · ${page}/${totalPages} 페이지`}
        </span>
      </div>
      <ReviewFilterBar
        keyword={keyword}
        rating={rating}
        onKeywordChange={handleKeywordChange}
        onRatingChange={handleRatingChange}
      />
      {renderBody()}
      <Toast message={toast} onClose={() => setToast(null)} />
    </section>
  )
}
