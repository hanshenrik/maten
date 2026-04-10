import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
  isClickable?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    { children, className = "", noPadding = false, isClickable, ...props },
    ref,
  ) => {
    const hoverClasses =
      isClickable || props.onClick
        ? "hover:border-primary/50 cursor-pointer"
        : "";

    return (
      <div
        ref={ref}
        className={`border-border bg-surface text-text overflow-hidden rounded-xl border transition-all duration-200 ${hoverClasses} ${noPadding ? "" : "p-4 sm:p-6"} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";
