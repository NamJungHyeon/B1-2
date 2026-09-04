export default function Textarea({
  label,
  value,
  onChange,
  error,
  rows = 6,
  id,
  ...rest
}) {
  const inputId = id || label

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <textarea
        id={inputId}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 ${
          error ? 'border-red-500' : 'border-slate-300'
        }`}
        {...rest}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
