import React from "react";
import { cn } from "../../utils/cn";

interface AlertProps {
  variant?: "error" | "success";
  children: React.ReactNode;
  className?: string;
}

const variants = {
  error: "border-red-500/20 bg-red-500/10 text-red-500",
  success: "border-primary/20 bg-primary/10 text-primary",
};

/** A message box for errors and confirmations. */
export const Alert = ({
  variant = "error",
  children,
  className,
}: AlertProps) => (
  <div
    role="alert"
    className={cn(
      "rounded-xl border p-4 text-sm",
      variants[variant],
      className,
    )}
  >
    {children}
  </div>
);
