import React from "react";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", label, error, fullWidth = true, id, ...props }, ref) => {
    const textareaId =
      id ||
      (label
        ? `textarea-${label.replace(/\s+/g, "-").toLowerCase()}`
        : undefined);

    return (
      <div className={`${fullWidth ? "w-full" : ""} flex flex-col gap-1`}>
        {label && (
          <label htmlFor={textareaId} className="text-text mb-1 text-sm font-medium">
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          className={`border-border bg-surface text-text focus:ring-primary rounded-xl border px-4 py-3 transition-all outline-none focus:border-transparent focus:ring-2 ${error ? "border-red-500" : ""} ${className}`}
          {...props}
        />
        {error && <span className="text-sm text-red-500">{error}</span>}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
