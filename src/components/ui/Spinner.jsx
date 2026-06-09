export default function Spinner({ className = '' }) {
  return <div className={`h-5 w-5 animate-spin rounded-full border-2 border-primary-600 border-t-transparent ${className}`} />;
}
