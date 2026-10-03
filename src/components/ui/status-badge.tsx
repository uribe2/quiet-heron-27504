import type { ReactNode } from "react";

export type StatusTone = "neutral" | "success" | "warning" | "danger" | "accent";

const toneClasses: Record<StatusTone, string> = {
  neutral: "bg-neutral-soft text-text-muted",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  accent: "bg-accent-soft text-link",
};

export function StatusBadge({
  label,
  tone = "neutral",
  icon,
}: {
  label: string;
  tone?: StatusTone;
  icon?: ReactNode;
}) {
  return (
    <span
      className={`inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-xs font-medium ${toneClasses[tone]}`}
    >
      {icon}
      {label}
    </span>
  );
}
