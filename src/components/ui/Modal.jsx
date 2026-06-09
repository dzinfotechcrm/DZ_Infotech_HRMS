export default function Modal({ open, title, onClose, children, footer }) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/50 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-soft">
        <div className="border-b border-neutral-200 px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
            </div>
            <button onClick={onClose} className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100">
              ×
            </button>
          </div>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="border-t border-neutral-200 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}
