import { forwardRef, type SelectHTMLAttributes } from "react";
import { fieldClasses } from "./input";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <select ref={ref} className={`h-11 pl-3 pr-8 ${fieldClasses} ${className}`} {...props}>
        {children}
      </select>
    );
  },
);
Select.displayName = "Select";
