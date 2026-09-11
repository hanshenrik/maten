import React, { useEffect, useId, useRef } from "react";
import { cn } from "../../utils/cn";
import { Button } from "./Button";

interface DialogProps {
  open: boolean;
  /** Called when the dialog closes: the button, Escape, or a click outside */
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
  /** A message with a single dismiss button, the way `window.alert` works */
  alert?: boolean;
  /** The dismiss button on an `alert` dialog */
  closeLabel?: string;
  /** Makes this a confirmation, the way `window.confirm` works */
  onConfirm?: () => void;
  confirmLabel?: string;
  confirmVariant?: "primary" | "danger";
  cancelLabel?: string;
  /** Buttons along the bottom, instead of the ones above */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * A modal built on the native `<dialog>` element, so the browser handles the
 * top layer, the backdrop, focus trapping and Escape for us.
 */
export const Dialog = ({
  open,
  onClose,
  title,
  children,
  alert = false,
  closeLabel = "OK",
  onConfirm,
  confirmLabel = "OK",
  confirmVariant = "primary",
  cancelLabel = "Avbryt",
  actions,
  className,
}: DialogProps) => {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  // `showModal()` throws if the dialog is already open, so check first
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      role={alert || onConfirm ? "alertdialog" : undefined}
      aria-labelledby={title ? titleId : undefined}
      // Escape closes the dialog on its own, so let that tell React about it
      onClose={onClose}
      // The dialog itself is only hit when the click landed on the backdrop
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className={cn(
        "bg-surface text-text border-border m-auto max-h-[calc(100dvh-2rem)] w-[min(28rem,calc(100vw-2rem))] overflow-auto rounded-2xl border p-0 shadow-lg backdrop:bg-black/50",
        className,
      )}
    >
      <div className="flex flex-col gap-4 p-6">
        {title && (
          <h2 id={titleId} className="text-text text-lg font-semibold">
            {title}
          </h2>
        )}
        {children && <div className="text-text-muted">{children}</div>}
        <div className="flex justify-end gap-3">
          {actions ??
            (onConfirm ? (
              // Cancel comes first, so that is what the browser focuses
              <>
                <Button variant="secondary" onClick={onClose}>
                  {cancelLabel}
                </Button>
                <Button variant={confirmVariant} onClick={onConfirm}>
                  {confirmLabel}
                </Button>
              </>
            ) : (
              <Button autoFocus onClick={onClose}>
                {closeLabel}
              </Button>
            ))}
        </div>
      </div>
    </dialog>
  );
};
