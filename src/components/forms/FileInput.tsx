import React, { useId, useRef } from "react";
import { cn } from "../../utils/cn";
import { Icon } from "../ui/Icon";
import { ui } from "../../utils/icons";
import { Field } from "./Field";

interface FileInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "onChange"
> {
  label?: string;
  /** The image that is saved right now, if there is one */
  previewUrl?: string | null;
  /** True while the picked file is on its way to storage */
  uploading?: boolean;
  /** A newly picked file, or null when the picture was removed */
  onChange: (file: File | null) => void;
}

const actionClassName =
  "border-border bg-surface/90 text-text flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border shadow-sm backdrop-blur transition-colors";

/**
 * Picks a single image. The file is handed straight to the parent, which
 * uploads it, so there is nothing in between "picked" and "uploaded": the
 * control is either empty, uploading, or showing the picture it has.
 */
export const FileInput = ({
  label,
  previewUrl,
  uploading = false,
  onChange,
  id,
  className,
  ...props
}: FileInputProps) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const inputRef = useRef<HTMLInputElement>(null);

  const pickFile = () => inputRef.current?.click();

  return (
    <Field htmlFor={inputId} label={label}>
      <div
        className={cn(
          "relative h-48 w-full max-w-md overflow-hidden rounded-xl",
          previewUrl && "border-border border",
          className,
        )}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <button
            type="button"
            onClick={pickFile}
            disabled={uploading}
            className="border-border bg-surface text-text-muted hover:border-primary hover:text-primary flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed transition-colors disabled:cursor-not-allowed"
          >
            <Icon icon={ui.image} className="h-8 w-8" />
            <span className="text-sm font-medium">Velg bilde</span>
          </button>
        )}

        {uploading && (
          <div className="bg-surface/80 text-text-muted absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Icon icon={ui.image} className="h-8 w-8 animate-pulse" />
            <span className="text-sm font-medium">Laster opp...</span>
          </div>
        )}

        {previewUrl && !uploading && (
          <div className="absolute right-2 bottom-2 flex gap-2">
            <button
              type="button"
              onClick={pickFile}
              title="Bytt bilde"
              aria-label="Bytt bilde"
              className={cn(actionClassName, "hover:text-primary")}
            >
              <Icon icon={ui.edit} className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              title="Fjern bilde"
              aria-label="Fjern bilde"
              className={cn(actionClassName, "hover:text-red-500")}
            >
              <Icon icon={ui.delete} className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        // Focus lives on the buttons above, so the input stays out of the way
        tabIndex={-1}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
          // Clearing lets the same file be picked again after a failed upload
          e.target.value = "";
          if (file) onChange(file);
        }}
        {...props}
      />
    </Field>
  );
};
