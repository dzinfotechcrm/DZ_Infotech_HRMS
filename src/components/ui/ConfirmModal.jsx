import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Button from './Button';

export default function ConfirmModal({ open, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', confirmVariant = 'primary' }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

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
        className="fixed bg-white rounded-2xl shadow-xl flex flex-col p-6"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: '400px',
          zIndex: 10000
        }}
      >
        <h3 className="text-lg font-bold text-neutral-900 mb-2">{title}</h3>
        <p className="text-neutral-600 text-sm mb-6">{message}</p>
        
        <div className="flex justify-end gap-3 mt-auto">
          <Button variant="secondary" onClick={onCancel} type="button">
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
