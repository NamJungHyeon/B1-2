import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useReviews } from '../hooks/useReviews'
import ReviewList from '../components/ReviewList'
import Loading from '../components/Loading'
import ErrorState from '../components/ErrorState'
import EmptyState from '../components/EmptyState'

function HeroBanner({ total, average }) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 px-6 py-10 text-white sm:px-10 sm:py-14">
      {/* 장식용 원. 이미지 없이도 밋밋하지 않게 */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-white/10" />

      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-white/80">🎬 무비로그</p>
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
            본 작품을 기록하고
            <br />
            다시 꺼내 보세요
          </h1>
          <p className="max-w-md text-sm text-white/80">
            영화와 드라마의 감상을 별점과 함께 남겨두면, 시간이 지나도 그때의
            느낌을 다시 찾을 수 있습니다.
          </p>
        </div>

        <div className="flex gap-6 sm:flex-col sm:items-end sm:gap-3">
          <div>
            <p className="text-3xl font-bold">{total}</p>
            <p className="text-xs text-white/70">등록된 리뷰</p>
          </div>
          <div>
            <p className="text-3xl font-bold">{average}</p>
            <p className="text-xs text-white/70">평균 별점</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function HomePage() {
  const { reviews, loading, error, refetch } = useReviews()
  const recent = reviews.slice(0, 4)

  const stats = useMemo(() => {
    if (reviews.length === 0) return { total: 0, average: '-' }
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0)
    return { total: reviews.length, average: (sum / reviews.length).toFixed(1) }
  }, [reviews])

  const renderRecent = () => {
    if (loading) return <Loading />
    if (error) return <ErrorState message={error} onRetry={refetch} />
    if (recent.length === 0) return <EmptyState message="아직 등록된 리뷰가 없습니다." />
    return <ReviewList reviews={recent} />
  }

  return (
    <div className="flex flex-col gap-8">
      <HeroBanner total={stats.total} average={stats.average} />

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">최근 리뷰</h2>
          <Link to="/reviews" className="text-sm text-indigo-600 hover:underline">
            전체 보기
          </Link>
        </div>
        {renderRecent()}
      </section>
    </div>
  )
}
