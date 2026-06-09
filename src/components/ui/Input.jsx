import { forwardRef } from 'react';

const Input = forwardRef(({ label, error, className = '', ...props }, ref) => {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-neutral-700">
      {label && <span>{label}</span>}
      <input
        ref={ref}
        className={`w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 ${error ? 'border-danger-600 focus:border-danger-600 focus:ring-danger-100' : ''} ${className}`}
        {...props}
      />
      {error && <span className="text-xs font-medium text-danger-600">{error}</span>}
    </label>
  );
});

Input.displayName = 'Input';
export default Input;
