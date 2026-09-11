import React from "react";
import { cn } from "../../utils/cn";

interface StepProgressProps {
  /**
   * The step you are on, counting from 1. That circle and every one before
   * it are filled.
   */
  current: number;
  total: number;
  /** Only horizontal for now; vertical is left open for later. */
  direction?: "horizontal";
  /** Names what is being stepped through, for screen readers */
  label?: string;
  className?: string;
}

/**
 * How far along a multi-step flow you are: one circle per step, filled up to
 * the one you are on, with the count spelled out next to them.
 */
export const StepProgress = ({
  current,
  total,
  direction = "horizontal",
  label = "Framdrift",
  className,
}: StepProgressProps) => (
  <div
    role="progressbar"
    aria-label={label}
    aria-valuemin={1}
    aria-valuemax={total}
    aria-valuenow={current}
    aria-valuetext={`Steg ${current} av ${total}`}
    className={cn(
      "flex items-center gap-3",
      direction === "horizontal" ? "flex-row" : "flex-col",
      className,
    )}
  >
    <div
      className={cn(
        "flex gap-1.5",
        direction === "horizontal" ? "flex-row" : "flex-col",
      )}
    >
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={cn(
            "h-2.5 w-2.5 rounded-full transition-colors",
            index < current
              ? "bg-primary"
              : "border-border border bg-transparent",
          )}
        />
      ))}
    </div>
    <span className="text-text-muted text-sm font-medium tabular-nums">
      {current}/{total}
    </span>
  </div>
);
