import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Button from './Button';

export default function ConfirmModal({ open, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', confirmVariant = 'primary' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    if (open) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onCancel]);

  if (!open) {
    return null;
  }

  const modalContent = (
    <>
      <div 
        className="fixed inset-0 backdrop-blur-sm"
        style={{ zIndex: 9999, background: 'rgba(0,0,0,0.4)' }}
        onClick={onCancel}
      />
      <div 
        className="fixed bg-white rounded-2xl shadow-soft flex flex-col"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: '780px',
          maxHeight: '90vh',
          zIndex: 10000
        }}
      >
        <div className="border-b border-neutral-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
            </div>
            <button onClick={onCancel} className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 leading-none flex items-center justify-center h-8 w-8 text-xl">
              ×
            </button>
          </div>
        </div>

        <div className="px-6 py-5 flex-1 overflow-y-auto">
          <p className="text-neutral-700">{message}</p>
        </div>
        
        <div className="border-t border-neutral-200 px-6 py-4 flex-shrink-0 flex justify-end gap-3">
          <Button variant="primary" onClick={onCancel} type="button">
            {cancelText}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} type="button">
            {confirmText}
          </Button>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}
