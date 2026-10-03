import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Spinner } from "./spinner";

export type ButtonVariant = "primary" | "secondary" | "link" | "destructive";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "min-h-11 px-4 bg-accent text-white hover:bg-accent-hover active:bg-accent-hover disabled:bg-accent/40",
  secondary:
    "min-h-11 px-4 bg-surface text-text border border-border-strong hover:bg-surface-muted active:bg-neutral-soft disabled:text-text-disabled",
  link: "min-h-11 px-1 bg-transparent text-link hover:underline underline-offset-2",
  destructive:
    "min-h-11 px-4 bg-danger text-white hover:bg-danger-hover active:bg-danger-hover disabled:bg-danger/40",
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
        className={`inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
        {...props}
      >
        {isLoading ? <Spinner size={16} /> : null}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
