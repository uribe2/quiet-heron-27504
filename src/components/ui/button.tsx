import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Spinner } from "./spinner";

export type ButtonVariant = "primary" | "secondary" | "link" | "destructive";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-text text-white hover:bg-text/90 active:bg-text/80 disabled:bg-text/40",
  secondary:
    "bg-surface text-text border border-border hover:bg-bg active:bg-border disabled:text-text-muted",
  link: "bg-transparent text-link underline hover:text-link/80 p-0",
  destructive:
    "bg-danger text-white hover:bg-danger/90 active:bg-danger/80 disabled:bg-danger/40",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", isLoading = false, disabled, className = "", children, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
        {...props}
      >
        {isLoading ? <Spinner size={16} /> : null}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
