import { forwardRef, type InputHTMLAttributes } from "react";

export const fieldClasses =
  "w-full rounded-lg border border-border-strong bg-surface text-sm text-text placeholder:text-text-disabled transition-colors focus:outline-none focus-within:ring-2 focus-within:ring-focus focus-within:ring-offset-2 aria-[invalid=true]:border-danger disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-muted";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => {
    return <input ref={ref} className={`h-11 px-3 ${fieldClasses} ${className}`} {...props} />;
  },
);
Input.displayName = "Input";
