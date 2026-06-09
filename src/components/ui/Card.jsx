export default function Card({ children, className = '', ...props }) {
  return (
    <div className={`rounded-xl border border-neutral-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-soft ${className}`} {...props}>
      {children}
    </div>
  );
}
