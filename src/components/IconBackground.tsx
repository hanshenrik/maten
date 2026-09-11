import React from "react";
import { cn } from "../utils/cn";

export type NavSection = "recipes" | "plans" | "shopping" | "settings";

const selectedColors: Record<NavSection, string> = {
  recipes: "bg-blue-300",
  plans: "bg-green-300",
  shopping: "bg-red-300",
  settings: "bg-gray-300",
};

const hoverColors: Record<NavSection, string> = {
  recipes: "group-hover:bg-blue-100 group-active:bg-blue-200",
  plans: "group-hover:bg-green-100 group-active:bg-green-200",
  shopping: "group-hover:bg-red-100 group-active:bg-red-200",
  settings: "group-hover:bg-gray-100 group-active:bg-gray-200",
};

/** The blob of colour behind a navigation icon. */
export const IconBackground = ({
  icon,
  isSelected,
  children,
  className,
}: {
  icon: NavSection;
  isSelected?: boolean;
  children?: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "block w-fit rounded-tl-2xl rounded-tr-md rounded-br-xl rounded-bl-lg p-2 transition-colors",
      icon === "shopping" && "pr-1",
      isSelected && selectedColors[icon],
      hoverColors[icon],
      className,
    )}
  >
    {children}
  </div>
);
