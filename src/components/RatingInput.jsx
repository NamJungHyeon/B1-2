export default function RatingInput({ value, onChange, error }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-slate-700">별점</span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            type="button"
            aria-label={`별점 ${score}점`}
            onClick={() => onChange(score)}
            className={`text-2xl transition ${
              score <= value ? 'text-amber-500' : 'text-slate-300'
            }`}
          >
            ★
          </button>
        ))}
        <span className="ml-2 text-sm text-slate-500">
          {value ? `${value}점` : '선택 안 함'}
        </span>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
