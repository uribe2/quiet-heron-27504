import { forwardRef, type InputHTMLAttributes } from "react";

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, id, className = "", ...props }, ref) => {
    const inputId = id ?? `checkbox-${label.replace(/\s+/g, "-").toLowerCase()}`;
    return (
      <label htmlFor={inputId} className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm text-text">
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          className={`h-5 w-5 cursor-pointer rounded border-border-strong accent-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 disabled:cursor-not-allowed ${className}`}
          {...props}
        />
        {label}
      </label>
    );
  },
);
Checkbox.displayName = "Checkbox";
