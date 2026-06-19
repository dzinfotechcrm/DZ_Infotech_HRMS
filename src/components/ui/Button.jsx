export default function Button({ children, className = '', variant = 'primary', type = 'button', loading, disabled, ...props }) {
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-500 shadow-sm',
    secondary: 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50',
    accent: 'bg-accent-600 text-white hover:bg-accent-500',
    danger: 'bg-danger-600 text-white hover:bg-danger-600/90',
    ghost: 'bg-transparent text-neutral-700 hover:bg-neutral-100',
  };

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {children}
        </>
      ) : children}
    </button>
  );
}
