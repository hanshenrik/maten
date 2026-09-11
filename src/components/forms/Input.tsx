import React, { useId } from "react";
import { cn } from "../../utils/cn";
import { Field, inputClassName } from "./Field";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, fullWidth = true, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <Field
        htmlFor={inputId}
        label={label}
        error={error}
        className={cn(fullWidth && "w-full")}
      >
        <input
          id={inputId}
          ref={ref}
          className={cn(inputClassName, error && "border-red-500", className)}
          {...props}
        />
      </Field>
    );
  },
);

Input.displayName = "Input";
