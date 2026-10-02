import { Search } from "lucide-react";
import { forwardRef, type InputHTMLAttributes } from "react";

export const SearchInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { label: string }
>(({ label, className = "", id, ...props }, ref) => {
  const inputId = id ?? "search-input";
  return (
    <div className="relative">
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
      />
      <input
        ref={ref}
        id={inputId}
        type="search"
        placeholder={label}
        className={`h-11 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-text placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${className}`}
        {...props}
      />
    </div>
  );
});
SearchInput.displayName = "SearchInput";
