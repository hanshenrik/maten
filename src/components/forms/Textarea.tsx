import React, { useId } from "react";
import { cn } from "../../utils/cn";
import { Field, fieldClassName } from "./Field";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { className, label, error, fullWidth = true, id, rows = 4, ...props },
    ref,
  ) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    return (
      <Field
        htmlFor={textareaId}
        label={label}
        error={error}
        className={cn(fullWidth && "w-full")}
      >
        <textarea
          id={textareaId}
          ref={ref}
          rows={rows}
          className={cn(
            fieldClassName,
            // 16px font: smaller text makes iOS Safari auto-zoom on focus
            "px-2.5 py-1.5 text-base",
            error && "border-red-500",
            className,
          )}
          {...props}
        />
      </Field>
    );
  },
);

Textarea.displayName = "Textarea";
