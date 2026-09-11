import React from "react";
import { cn } from "../../utils/cn";

/** The look shared by every text-like form control. */
export const fieldClassName =
  "border-border bg-surface text-text focus:ring-primary rounded-xl border transition-all outline-none focus:border-transparent focus:ring-2";

/** `fieldClassName` at the standard single-line height. */
export const inputClassName = cn(fieldClassName, "h-11 px-3");

export const labelClassName = "text-text-muted text-sm";

interface FieldProps {
  /** The id of the control the label points at */
  htmlFor?: string;
  label?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

/** Wraps a form control with its label and error message. */
export const Field = ({
  htmlFor,
  label,
  error,
  className,
  children,
}: FieldProps) => (
  <div className={cn("flex flex-col gap-1", className)}>
    {label && (
      <label htmlFor={htmlFor} className={labelClassName}>
        {label}
      </label>
    )}
    {children}
    {error && <span className="text-sm text-red-500">{error}</span>}
  </div>
);
