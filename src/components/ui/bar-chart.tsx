import { useId } from "react";

export interface BarChartSeries {
  key: string;
  label: string;
  /** Diagonal hatch pattern (used for projected values). */
  hatched?: boolean;
}

export interface BarChartCategory {
  label: string;
  values: Record<string, number>;
}

interface BarChartProps {
  title: string;
  series: BarChartSeries[];
  categories: BarChartCategory[];
  /** Short label written on top of each bar. */
  formatValue: (value: number) => string;
  /** Full-precision value used in the accessible table. */
  formatFullValue?: (value: number) => string;
  /** Header of the first column of the accessible table. */
  categoryHeader: string;
}

const WIDTH = 640;
const HEIGHT = 280;
const PAD = { top: 24, right: 8, bottom: 32, left: 8 };

/** Plain-SVG grouped bar chart with legend, value labels and a sr-only table. */
export function BarChart({
  title,
  series,
  categories,
  formatValue,
  formatFullValue,
  categoryHeader,
}: BarChartProps) {
  const rawId = useId();
  const patternId = `hatch-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const full = formatFullValue ?? formatValue;
  const max = Math.max(1, ...categories.flatMap((c) => series.map((s) => c.values[s.key] ?? 0)));
  const plotW = WIDTH - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const groupW = plotW / Math.max(1, categories.length);
  const barW = Math.min(36, (groupW - 12) / Math.max(1, series.length));

  return (
    <figure className="rounded-xl border border-border bg-surface p-6">
      <figcaption className="mb-3 text-base font-semibold tracking-tight text-text">{title}</figcaption>
      <ul className="mb-3 flex flex-wrap gap-4 text-xs text-text">
        {series.map((s) => (
          <li key={s.key} className="flex items-center gap-2">
            <svg width="16" height="16" aria-hidden="true">
              <rect
                x="1"
                y="1"
                width="14"
                height="14"
                rx="2"
                fill={s.hatched ? `url(#${patternId})` : "var(--accent)"}
                stroke="var(--accent)"
                strokeWidth="1.5"
              />
            </svg>
            <span>{s.label}</span>
          </li>
        ))}
      </ul>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="min-w-[560px] w-full"
          role="img"
          aria-label={title}
        >
          <defs>
            <pattern id={patternId} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="6" height="6" fill="var(--surface)" />
              <line x1="0" y1="0" x2="0" y2="6" stroke="var(--accent)" strokeWidth="3" />
            </pattern>
          </defs>
          {[0.25, 0.5, 0.75].map((f) => (
            <line
              key={f}
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={PAD.top + plotH * (1 - f)}
              y2={PAD.top + plotH * (1 - f)}
              stroke="var(--border)"
              strokeDasharray="3 4"
            />
          ))}
          <line
            x1={PAD.left}
            x2={WIDTH - PAD.right}
            y1={PAD.top + plotH}
            y2={PAD.top + plotH}
            stroke="var(--border-strong)"
          />
          {categories.map((c, ci) => {
            const groupX = PAD.left + ci * groupW;
            const used = barW * series.length;
            const startX = groupX + (groupW - used) / 2;
            return (
              <g key={c.label}>
                {series.map((s, si) => {
                  const value = c.values[s.key] ?? 0;
                  const h = (value / max) * plotH;
                  const x = startX + si * barW;
                  const y = PAD.top + plotH - h;
                  return (
                    <g key={s.key}>
                      {value > 0 ? (
                        <rect
                          x={x + 1}
                          y={y}
                          width={barW - 2}
                          height={h}
                          rx="2"
                          fill={s.hatched ? `url(#${patternId})` : "var(--accent)"}
                          stroke="var(--accent)"
                          strokeWidth="1.5"
                        />
                      ) : null}
                      {value > 0 ? (
                        <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize="11" fontWeight="500" fill="var(--text)">
                          {formatValue(value)}
                        </text>
                      ) : null}
                    </g>
                  );
                })}
                <text
                  x={groupX + groupW / 2}
                  y={HEIGHT - 10}
                  textAnchor="middle"
                  fontSize="12"
                  fill="var(--text-muted)"
                >
                  {c.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">{categoryHeader}</th>
            {series.map((s) => (
              <th key={s.key} scope="col">
                {s.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c.label}>
              <th scope="row">{c.label}</th>
              {series.map((s) => (
                <td key={s.key}>{full(c.values[s.key] ?? 0)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
