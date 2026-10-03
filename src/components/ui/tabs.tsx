"use client";

import { useId } from "react";

export interface TabItem {
  value: string;
  label: string;
}

export function Tabs({
  items,
  value,
  onChange,
}: {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <div role="tablist" aria-orientation="horizontal" className="flex gap-6 overflow-x-auto border-b border-border">
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            id={`${id}-tab-${item.value}`}
            role="tab"
            type="button"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.value)}
            className={`-mb-px min-h-11 whitespace-nowrap border-b-2 px-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
              selected ? "border-accent text-text" : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
