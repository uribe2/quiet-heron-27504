export function ProgressBar({
  percent,
  label,
  ariaLabel,
  tone = "accent",
}: {
  percent: number;
  label?: string;
  /** Accessible name when there is no visible label (e.g. the title is shown above). */
  ariaLabel?: string;
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
  const textClass = tone === "danger" ? "text-danger" : "text-text";
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        {label ? <span className="text-xs text-text-muted">{label}</span> : <span />}
        <span className={`text-sm font-semibold ${textClass}`}>{clamped}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? ariaLabel}
        className="h-2 w-full overflow-hidden rounded-full bg-border"
      >
        <div className={`h-full rounded-full ${toneClass}`} style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}
