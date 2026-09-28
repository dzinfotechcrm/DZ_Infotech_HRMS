import Button from './Button';

export default function PageHeader({ eyebrow, title, description, actions, children, className = '' }) {
  return (
    <div className={className}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {eyebrow && (
            <>
              <span className="text-lg font-medium text-neutral-500">{eyebrow}</span>
              <span className="text-lg text-neutral-400">/</span>
            </>
          )}
          <h1 className="text-2xl font-bold text-neutral-900">{title}</h1>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
