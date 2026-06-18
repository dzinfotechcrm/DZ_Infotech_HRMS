import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({ open, title, onClose, children, footer }) {
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
      {/* Modal Overlay */}
      <div 
        className="fixed inset-0 backdrop-blur-sm"
        style={{ zIndex: 1000, background: 'rgba(0,0,0,0.5)' }}
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div 
        className="fixed bg-white rounded-2xl shadow-soft flex flex-col"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: '780px',
          maxHeight: '90vh',
          zIndex: 1001
        }}
      >
        <div className="border-b border-neutral-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
            </div>
            <button onClick={onClose} className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100">
              ×
            </button>
          </div>
        </div>
        
        <div className="overflow-y-auto px-6 py-5 flex-1">
          {children}
        </div>
        
        {footer && (
          <div className="border-t border-neutral-200 px-6 py-4 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}
