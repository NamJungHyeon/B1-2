const STYLES = {
  success: 'bg-emerald-600',
  error: 'bg-red-600',
}

export default function Toast({ type = 'success', message, onClose }) {
  if (!message) return null

  return (
    <div
      className={`fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-lg px-4 py-3 text-sm text-white shadow-lg ${STYLES[type]}`}
      role="status"
    >
      <span>{message}</span>
      {onClose && (
        <button type="button" onClick={onClose} aria-label="알림 닫기">
          ✕
        </button>
      )}
    </div>
  )
}
