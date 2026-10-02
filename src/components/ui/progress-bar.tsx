export function ProgressBar({
  percent,
  label,
  tone = "accent",
}: {
  percent: number;
  label?: string;
  tone?: "accent" | "success" | "warning" | "danger";
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  const toneClass =
    tone === "success"
      ? "bg-success"
      : tone === "warning"
        ? "bg-warning"
        : tone === "danger"
          ? "bg-danger"
          : "bg-accent";
  return (
    <div className="flex flex-col gap-1">
      {label ? <span className="text-xs text-text-muted">{label}</span> : null}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 w-full overflow-hidden rounded-full bg-border"
      >
        <div className={`h-full rounded-full ${toneClass}`} style={{ width: `${clamped}%` }} />
      </div>
      <span className="text-xs font-medium text-text">{clamped}%</span>
    </div>
  );
}
