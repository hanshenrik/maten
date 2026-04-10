import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, fullWidth = true, id, ...props }, ref) => {
    const inputId =
      id ||
      (label ? `input-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);

    return (
      <div className={`${fullWidth ? "w-full" : ""} flex flex-col gap-1.5`}>
        {label && (
          <label htmlFor={inputId} className="text-text text-sm font-medium">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`focus:border-primary focus:ring-primary bg-surface text-text rounded-xl border px-3 py-2 transition-all focus:ring-1 focus:outline-none ${error ? "border-red-500" : "border-border"} ${className}`}
          {...props}
        />
        {error && <span className="text-sm text-red-500">{error}</span>}
      </div>
    );
  },
);

Input.displayName = "Input";
