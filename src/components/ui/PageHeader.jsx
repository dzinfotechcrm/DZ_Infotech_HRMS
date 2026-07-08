import Button from './Button';

export default function PageHeader({ eyebrow, title, description, actions, children, className = '' }) {
  return (
    <div className={className}>
      <div className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-slate-50 shadow-2xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-4xl">
            {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-300/80">{eyebrow}</p>}
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">{title}</h1>
            {description && <p className="mt-2 text-sm text-slate-300/80 whitespace-nowrap overflow-hidden text-ellipsis">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}
