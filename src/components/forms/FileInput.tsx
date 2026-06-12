import React from "react";

interface FileInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  label?: string;
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
  className = "",
  ...props
}: FileInputProps) => {
  const inputId =
    id ||
    (label ? `file-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-text mb-1 text-sm font-medium">
          {label}
        </label>
      )}
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
        className={`border-border bg-surface text-text focus:ring-primary file:bg-primary/10 file:text-primary hover:file:bg-primary/20 w-full rounded-xl border px-3 py-2 transition-all outline-none file:mr-4 file:rounded-full file:border-0 file:px-4 file:py-2 file:text-sm file:font-semibold focus:border-transparent focus:ring-2 ${className}`}
        {...props}
      />
    </div>
  );
};
