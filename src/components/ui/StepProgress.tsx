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
  /** What each step is called, for screen readers and hover tooltips */
  stepNames?: string[];
  /** Makes the circles clickable, so you can jump back to an earlier step */
  onStepSelect?: (step: number) => void;
  /**
   * Which steps `onStepSelect` will accept. Only the ones you have already
   * been through by default, since stepping forward usually needs whatever
   * the current step is asking for.
   */
  canSelectStep?: (step: number) => boolean;
  className?: string;
}

const dot = (filled: boolean) =>
  cn(
    "h-2.5 w-2.5 rounded-full transition-colors",
    filled ? "bg-primary" : "border-border border bg-transparent",
  );

/**
 * How far along a multi-step flow you are: one circle per step, filled up to
 * the one you are on, with the count spelled out next to them. Pass
 * `onStepSelect` to turn the circles into buttons that go back to a step.
 */
export const StepProgress = ({
  current,
  total,
  direction = "horizontal",
  label = "Framdrift",
  stepNames,
  onStepSelect,
  canSelectStep = (step) => step <= current,
  className,
}: StepProgressProps) => {
  const isRow = direction === "horizontal";
  const steps = Array.from({ length: total }, (_, index) => index + 1);
  const nameOf = (step: number) =>
    [`Steg ${step}`, stepNames?.[step - 1]].filter(Boolean).join(": ");

  const wrapper = cn(
    "flex items-center gap-3",
    isRow ? "flex-row" : "flex-col",
    className,
  );
  const count = (
    <span className="text-text-muted text-sm font-medium tabular-nums">
      {current}/{total}
    </span>
  );

  if (!onStepSelect) {
    return (
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={current}
        aria-valuetext={`Steg ${current} av ${total}`}
        className={wrapper}
      >
        <div className={cn("flex gap-1.5", isRow ? "flex-row" : "flex-col")}>
          {steps.map((step) => (
            <span key={step} className={dot(step <= current)} />
          ))}
        </div>
        {count}
      </div>
    );
  }

  return (
    // The circles are their own little set of links through the flow, so they
    // get a nav of their own rather than the progressbar role, which is meant
    // to hold nothing you can click.
    <nav aria-label={label} className={wrapper}>
      {/* The buttons pad themselves out to a big enough tap target, so the
          row pulls back in to leave the circles sitting where they would
          otherwise. */}
      <div
        className={cn(
          "flex",
          isRow ? "-mx-2 flex-row" : "-my-2 flex-col",
          "[&>*]:p-2",
        )}
      >
        {steps.map((step) => {
          const selectable = canSelectStep(step);
          return (
            <button
              key={step}
              type="button"
              onClick={() => onStepSelect(step)}
              disabled={!selectable}
              aria-current={step === current ? "step" : undefined}
              aria-label={`${nameOf(step)} av ${total}`}
              title={nameOf(step)}
              className="focus:ring-primary group flex cursor-pointer items-center justify-center rounded-full focus:ring-2 focus:outline-none disabled:cursor-default"
            >
              <span
                className={cn(
                  dot(step <= current),
                  "transition-transform group-hover:scale-125 group-disabled:scale-100",
                )}
              />
            </button>
          );
        })}
      </div>
      {count}
    </nav>
  );
};
