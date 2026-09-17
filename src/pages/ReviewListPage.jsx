import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useReviews } from '../hooks/useReviews'
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

  // 페이지 번호는 URL(?page=N)에 둔다. 새로고침·뒤로가기에도 유지되고
  // 특정 페이지를 링크로 공유할 수 있다.
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedPage = Number(searchParams.get('page')) || 1

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

  // 필터가 바뀌어 페이지 수가 줄면 URL의 page가 범위를 벗어날 수 있다.
  // 그럴 땐 마지막 페이지로 보정한다.
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const page = Math.min(requestedPage, totalPages)

  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  const goToPage = (n) => {
    if (n === 1) {
      searchParams.delete('page')
    } else {
      searchParams.set('page', String(n))
    }
    setSearchParams(searchParams)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 검색어나 별점 조건이 바뀌면 1페이지부터 다시 본다.
  const resetToFirstPage = () => {
    if (searchParams.has('page')) {
      searchParams.delete('page')
      setSearchParams(searchParams, { replace: true })
    }
  }

  const handleKeywordChange = (value) => {
    setKeyword(value)
    resetToFirstPage()
  }

  const handleRatingChange = (value) => {
    setRating(value)
    resetToFirstPage()
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
