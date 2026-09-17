export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  const buttonClass = (active) =>
    `min-w-9 rounded-lg px-3 py-1.5 text-sm transition ${
      active
        ? 'bg-indigo-600 font-semibold text-white'
        : 'text-slate-700 hover:bg-slate-100'
    }`

  return (
    <nav className="flex items-center justify-center gap-1" aria-label="페이지 이동">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="이전 페이지"
        className="rounded-lg px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        ‹
      </button>

      {pages.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${n}페이지`}
          aria-current={n === page ? 'page' : undefined}
          className={buttonClass(n === page)}
        >
          {n}
        </button>
      ))}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="다음 페이지"
        className="rounded-lg px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        ›
      </button>
    </nav>
  )
}
