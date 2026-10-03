import type { ReactNode } from "react";

export function KpiCard({
  label,
  value,
  hint,
  icon,
  footer,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-border bg-surface">
      <div className="flex-1 p-6">
        <div className="flex items-start justify-between gap-2">
          <p className="label-eyebrow text-text-muted">{label}</p>
          {icon ? <span className="text-text-muted">{icon}</span> : null}
        </div>
        <p className="mt-3 text-3xl font-semibold tracking-tight text-text">{value}</p>
        {hint ? <p className="mt-2 text-sm text-text-muted">{hint}</p> : null}
      </div>
      {footer ? (
        <div className="rounded-b-xl border-t border-border bg-surface-muted px-6 py-3 text-sm text-text-muted">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
