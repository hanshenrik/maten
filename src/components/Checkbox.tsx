import React from "react";
import { Icon } from "@iconify/react";

interface CheckboxProps {
  checked: boolean;
  onChange?: () => void;
  label?: string;
  subLabel?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  label,
  subLabel,
}) => {
  return (
    <div
      onClick={onChange}
      className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all ${
        checked
          ? "border-primary/20 bg-primary/10 opacity-60"
          : "border-border bg-bg hover:border-text/20"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
            checked
              ? "border-primary bg-primary text-white"
              : "border-border bg-surface"
          }`}
        >
          {checked && <Icon icon="hugeicons:tick-01" className="h-4 w-4" />}
        </div>
        <div className="flex items-center">
          {label && (
            <span
              className={`font-medium ${checked ? "text-text-muted line-through" : "text-text"}`}
            >
              {label}
            </span>
          )}
          {subLabel && (
            <span className="text-text-muted ml-2 text-sm">{subLabel}</span>
          )}
        </div>
      </div>
    </div>
  );
};
