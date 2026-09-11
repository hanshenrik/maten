import React from "react";
import { Icon } from "./Icon";
import { cn } from "../../utils/cn";
import { ui } from "../../utils/icons";

interface DetailsProps {
  title: React.ReactNode;
  children: React.ReactNode;
  open?: boolean;
  className?: string;
  summaryClassName?: string;
}

/** A native collapsible section. Works without JavaScript. */
export const Details = ({
  title,
  children,
  open = false,
  className,
  summaryClassName,
}: DetailsProps) => (
  <details className={cn("group", className)} open={open}>
    <summary
      className={cn(
        "text-text-muted hover:text-text flex cursor-pointer list-none items-center gap-2 transition-colors focus:outline-none",
        summaryClassName,
      )}
    >
      <Icon
        icon={ui.chevronRight}
        className="h-5 w-5 transition-transform group-open:rotate-90"
      />
      {title}
    </summary>
    <div className="mt-4">{children}</div>
  </details>
);
