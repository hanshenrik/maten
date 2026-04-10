import React from "react";
import { Icon } from "@iconify/react";

interface DetailsProps {
  title: React.ReactNode;
  children: React.ReactNode;
  open?: boolean;
  className?: string;
  summaryClassName?: string;
}

export const Details: React.FC<DetailsProps> = ({
  title,
  children,
  open = false,
  className = "",
  summaryClassName = "",
}) => {
  return (
    <details className={`group ${className}`} open={open}>
      <summary
        className={`text-text-muted hover:text-text flex cursor-pointer list-none items-center gap-2 transition-colors focus:outline-none ${summaryClassName}`}
      >
        <Icon
          icon="hugeicons:arrow-right-01"
          className="h-5 w-5 transition-transform group-open:rotate-90"
        />
        {title}
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
};
