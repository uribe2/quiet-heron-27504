import { forwardRef, type TextareaHTMLAttributes } from "react";
import { fieldClasses } from "./input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className = "", ...props }, ref) => {
  return <textarea ref={ref} className={`px-3 py-2.5 ${fieldClasses} ${className}`} {...props} />;
});
Textarea.displayName = "Textarea";
