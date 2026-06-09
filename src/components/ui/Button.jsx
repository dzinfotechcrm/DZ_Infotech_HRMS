export default function Button({ children, className = '', variant = 'primary', type = 'button', ...props }) {
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
      {...props}
    >
      {children}
    </button>
  );
}
