import { Link } from 'react-router-dom'
import { useReviews } from '../hooks/useReviews'
import ReviewList from '../components/ReviewList'
import Loading from '../components/Loading'
import ErrorState from '../components/ErrorState'
import EmptyState from '../components/EmptyState'

export default function HomePage() {
  const { reviews, loading, error, refetch } = useReviews()
  const recent = reviews.slice(0, 3)

  const renderRecent = () => {
    if (loading) return <Loading />
    if (error) return <ErrorState message={error} onRetry={refetch} />
    if (recent.length === 0) return <EmptyState message="아직 등록된 리뷰가 없습니다." />
    return <ReviewList reviews={recent} />
  }

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold text-slate-900">무비로그</h1>
        <p className="text-sm text-slate-600">
          본 영화와 드라마의 감상을 기록하고 다시 꺼내 보세요.
        </p>
        <Link
          to="/reviews/new"
          className="w-fit rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          리뷰 쓰기
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">최근 리뷰</h2>
          <Link to="/reviews" className="text-sm text-indigo-600 hover:underline">
            전체 보기
          </Link>
        </div>
        {renderRecent()}
      </div>
    </section>
  )
}
