const STYLES = {
  영화: 'bg-indigo-100 text-indigo-700',
  드라마: 'bg-emerald-100 text-emerald-700',
}

export default function Badge({ type }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        STYLES[type] || 'bg-slate-100 text-slate-700'
      }`}
    >
      {type}
    </span>
  )
}
