import Button from './Button'

export default function EmptyState({
  message = '표시할 데이터가 없습니다.',
  actionLabel,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 py-16">
      <p className="text-sm text-slate-500">{message}</p>
      {onAction && actionLabel && <Button onClick={onAction}>{actionLabel}</Button>}
    </div>
  )
}
