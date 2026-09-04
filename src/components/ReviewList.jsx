import ReviewCard from './ReviewCard'

export default function ReviewList({ reviews }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </div>
  )
}
