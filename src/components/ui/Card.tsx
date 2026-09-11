import React from "react";
import { cn } from "../../utils/cn";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
  isClickable?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className, noPadding = false, isClickable, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "border-border bg-surface text-text overflow-hidden rounded-xl border transition-all duration-200",
        (isClickable || props.onClick) &&
          "hover:border-primary/50 cursor-pointer",
        !noPadding && "p-4 sm:p-6",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);

Card.displayName = "Card";
