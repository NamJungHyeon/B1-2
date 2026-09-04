export default function RatingStars({ value, size = 'md' }) {
  const textSize = size === 'sm' ? 'text-sm' : 'text-lg'

  return (
    <span className={`${textSize} text-amber-500`} aria-label={`별점 ${value}점`}>
      {'★'.repeat(value)}
      <span className="text-slate-300">{'★'.repeat(5 - value)}</span>
    </span>
  )
}
