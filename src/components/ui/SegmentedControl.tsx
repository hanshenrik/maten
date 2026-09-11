import React from "react";
import { Icon } from "./Icon";
import { cn } from "../../utils/cn";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: string;
}

interface SegmentedControlProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Accessible name for the group */
  label: string;
}

/** A row of mutually exclusive choices, like a tab bar for settings. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="bg-bg border-border flex gap-1 rounded-2xl border p-1"
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-xl px-2 py-2.5 text-xs font-medium transition-all md:gap-2 md:text-sm",
              selected
                ? "bg-surface text-primary ring-border shadow-sm ring-1"
                : "text-text-muted hover:text-text hover:bg-surface/50",
            )}
          >
            {option.icon && <Icon icon={option.icon} className="h-4 w-4" />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
