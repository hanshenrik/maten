import React from "react";
import { Icon } from "../ui/Icon";
import { cn } from "../../utils/cn";
import { ui } from "../../utils/icons";

interface CheckboxButtonProps {
  checked: boolean;
  onChange?: () => void;
  label?: string;
  subLabel?: string;
  className?: string;
}

/** A big tappable row with a check mark, for lists you tick off. */
export const CheckboxButton = ({
  checked,
  onChange,
  label,
  subLabel,
  className,
}: CheckboxButtonProps) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={checked}
    onClick={onChange}
    className={cn(
      "flex w-full cursor-pointer items-center justify-between rounded-xl border p-4 text-left transition-all",
      checked
        ? "border-primary/20 bg-primary/10 opacity-60"
        : "border-border hover:border-text/20 bg-bg",
      className,
    )}
  >
    <div className="flex items-center gap-3">
      <div
        aria-hidden
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          checked
            ? "border-primary bg-primary text-white"
            : "border-border bg-surface",
        )}
      >
        {checked && <Icon icon={ui.checked} className="h-4 w-4" />}
      </div>
      <div className="flex flex-wrap items-baseline gap-x-2">
        {label && (
          <span
            className={cn(
              "font-medium",
              checked ? "text-text-muted line-through" : "text-text",
            )}
          >
            {label}
          </span>
        )}
        {subLabel && (
          <span className="text-text-muted text-sm">{subLabel}</span>
        )}
      </div>
    </div>
  </button>
);
