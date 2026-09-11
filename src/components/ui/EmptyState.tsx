import React from "react";
import { cn } from "../../utils/cn";

interface EmptyStateProps {
  children: React.ReactNode;
  className?: string;
}

/** The friendly box shown where a list would be, when there is nothing in it. */
export const EmptyState = ({ children, className }: EmptyStateProps) => (
  <div
    className={cn(
      "border-border bg-surface text-text-muted space-y-4 rounded-xl border p-6",
      className,
    )}
  >
    {children}
  </div>
);
