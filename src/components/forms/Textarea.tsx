import React, { useId } from "react";
import { cn } from "../../utils/cn";
import { Field, fieldClassName } from "./Field";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, fullWidth = true, id, rows = 4, ...props }, ref) => {
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
            "px-3 py-2.5",
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
