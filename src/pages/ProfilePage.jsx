import { useMemo } from 'react'
import { useReviews } from '../hooks/useReviews'
import { useAuth } from '../contexts/AuthContext'
import Loading from '../components/Loading'
import ErrorState from '../components/ErrorState'
import EmptyState from '../components/EmptyState'

// 이 파일 안에서만 쓰이는 작은 표현 컴포넌트라 같은 파일에 둔다.
// 여러 화면에서 쓰이게 되면 그때 components/로 옮긴다.
function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  )
}

export default function ProfilePage() {
  const { reviews, loading, error, refetch } = useReviews()
  const { user } = useAuth()

  // 목록 전체가 아니라 내가 쓴 것만 집계한다.
  const mine = useMemo(
    () => reviews.filter((review) => review.user_id === user?.id),
    [reviews, user?.id]
  )

  const stats = useMemo(() => {
    if (mine.length === 0) return null
    const total = mine.length
    const sum = mine.reduce((acc, review) => acc + review.rating, 0)
    const movies = mine.filter((review) => review.media_type === '영화').length

    return {
      total,
      average: (sum / total).toFixed(1),
      movies,
      dramas: total - movies,
    }
  }, [mine])

  if (loading) return <Loading />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">내 기록</h1>
        <p className="mt-1 text-sm text-slate-500">{user?.email}</p>
      </div>
      {stats ? (
        <div className="grid gap-3 sm:grid-cols-4">
          <StatCard label="총 리뷰" value={`${stats.total}개`} />
          <StatCard label="평균 별점" value={stats.average} />
          <StatCard label="영화" value={`${stats.movies}개`} />
          <StatCard label="드라마" value={`${stats.dramas}개`} />
        </div>
      ) : (
        <EmptyState message="아직 작성한 리뷰가 없습니다." />
      )}
    </section>
  )
}
