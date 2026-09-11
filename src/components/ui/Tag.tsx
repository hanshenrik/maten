import React from "react";
import { cn } from "../../utils/cn";

interface TagProps {
  title: string;
  className?: string;
  children: React.ReactNode;
}

const Tag = ({ title, className, children }: TagProps) => (
  <span
    className={cn(
      "text-text-muted cursor-help rounded px-1.5 py-0.5 text-xs font-medium",
      className,
    )}
    title={title}
  >
    {children}
  </span>
);

/** Marks an ingredient most kitchens already have, like salt or oil. */
export const BasicTag = () => (
  <Tag title="Basisvare" className="bg-blue-50 dark:bg-blue-950">
    B
  </Tag>
);

/** Marks an ingredient the recipe works fine without. */
export const OptionalTag = () => (
  <Tag title="Valgfri" className="bg-fuchsia-100 dark:bg-fuchsia-950">
    V
  </Tag>
);
