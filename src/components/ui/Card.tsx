import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", noPadding = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm ${noPadding ? "" : "p-4 sm:p-6"} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";
