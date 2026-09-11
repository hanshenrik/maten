import React, { useId } from "react";
import { cn } from "../../utils/cn";
import { Field, fieldClassName } from "./Field";

interface FileInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "onChange"
> {
  label?: string;
  /** The image already saved, shown until a new file is picked */
  previewUrl?: string;
  selectedFile?: File | null;
  onChange: (file: File | null) => void;
}

export const FileInput = ({
  label,
  previewUrl,
  selectedFile,
  onChange,
  id,
  className,
  ...props
}: FileInputProps) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <Field htmlFor={inputId} label={label}>
      {previewUrl && !selectedFile && (
        <div className="border-border relative mb-3 h-48 w-full max-w-md overflow-hidden rounded-xl border">
          <img src={previewUrl} alt="" className="h-full w-full object-cover" />
        </div>
      )}
      {selectedFile && (
        <div className="text-primary mb-3 text-sm font-medium">
          Valgt: {selectedFile.name}
        </div>
      )}
      <input
        id={inputId}
        type="file"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        className={cn(
          fieldClassName,
          "file:bg-primary/10 file:text-primary hover:file:bg-primary/20 w-full px-3 py-2 file:mr-4 file:rounded-full file:border-0 file:px-4 file:py-2 file:text-sm file:font-semibold",
          className,
        )}
        {...props}
      />
    </Field>
  );
};
