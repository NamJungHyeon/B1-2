import { Link } from 'react-router-dom'
import Badge from './Badge'
import RatingStars from './RatingStars'

export default function ReviewCard({ review }) {
  return (
    <Link
      to={`/reviews/${review.id}`}
      className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-indigo-300 hover:shadow-sm"
    >
      {review.poster_url ? (
        <img
          src={review.poster_url}
          alt={`${review.title} 포스터`}
          className="h-28 w-20 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div className="flex h-28 w-20 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">
          이미지 없음
        </div>
      )}
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-center gap-2">
          <Badge type={review.media_type} />
          <RatingStars value={review.rating} size="sm" />
        </div>
        <h3 className="truncate font-semibold text-slate-900">{review.title}</h3>
        <p className="line-clamp-2 text-sm text-slate-600">{review.content}</p>
      </div>
    </Link>
  )
}
