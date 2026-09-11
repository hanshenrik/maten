import React, { useId, useRef } from "react";
import { cn } from "../../utils/cn";
import { Icon } from "../ui/Icon";
import { IconButton } from "../ui/IconButton";
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

// The buttons sit on top of the picture, so they need a backdrop of their own
const actionClassName = "bg-surface/90 shadow-sm backdrop-blur";

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
            <IconButton
              variant="secondary"
              icon={ui.edit}
              label="Bytt bilde"
              onClick={pickFile}
              className={actionClassName}
            />
            <IconButton
              variant="danger"
              icon={ui.delete}
              label="Fjern bilde"
              onClick={() => onChange(null)}
              className={actionClassName}
            />
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
