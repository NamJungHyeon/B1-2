import Button from './Button'

export default function ConfirmDialog({
  open,
  message,
  onConfirm,
  onCancel,
  confirming = false,
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <p className="text-sm text-slate-700">{message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={confirming}>
            취소
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={confirming}>
            삭제
          </Button>
        </div>
      </div>
    </div>
  )
}
