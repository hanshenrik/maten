import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", noPadding = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`border-border bg-surface text-text overflow-hidden rounded-xl border ${noPadding ? "" : "p-4 sm:p-6"} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";
