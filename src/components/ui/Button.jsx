export default function Button({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  type = 'button',
  loading,
  disabled,
  ...props
}) {
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-500 shadow-sm border border-transparent',
    secondary: 'bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50 hover:border-neutral-400 shadow-2xs',
    outline: 'bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50 hover:border-neutral-400 shadow-2xs',
    accent: 'bg-accent-600 text-white hover:bg-accent-500 border border-transparent',
    danger: 'bg-danger-600 text-white hover:bg-danger-700 border border-transparent',
    warning: 'bg-amber-600 text-white hover:bg-amber-500 border border-transparent',
    ghost: 'bg-transparent text-neutral-700 hover:bg-neutral-100 border border-transparent',
  };

  const sizes = {
    xs: 'px-2 py-1 text-xs rounded-lg gap-1',
    sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
    md: 'px-4 py-2.5 text-sm rounded-xl gap-2',
    lg: 'px-5 py-3 text-base rounded-xl gap-2.5',
  };

  const sizeClass = sizes[size] || sizes.md;
  const variantClass = variants[variant] || variants.primary;

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${sizeClass} ${variantClass} ${className}`}
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
