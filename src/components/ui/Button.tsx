import React from "react";
import { cn } from "../../utils/cn";

type ButtonBaseProps = {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
};

type ButtonAsButtonProps = ButtonBaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    as?: "button";
  };

type ButtonAsAnchorProps = ButtonBaseProps &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    as: "a";
  };

export type ButtonProps = ButtonAsButtonProps | ButtonAsAnchorProps;

const variants = {
  primary:
    "bg-primary text-white hover:bg-primary-hover focus:ring-primary border border-transparent",
  secondary:
    "bg-surface text-text hover:text-primary hover:border-current hover:bg-primary/5 focus:ring-border border border-border",
  danger:
    "bg-surface text-text hover:text-red-500 hover:bg-red-500/10 focus:ring-red-500 border border-border hover:border-current",
};

const sizes = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-base",
  lg: "h-14 px-6 text-lg",
};

export const Button = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonProps
>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      fullWidth = false,
      children,
      as,
      ...props
    },
    ref,
  ) => {
    const combinedClassName = cn(
      "inline-flex cursor-pointer items-center justify-center rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      variants[variant],
      sizes[size],
      fullWidth && "w-full",
      className,
    );

    if (as === "a") {
      return (
        <a
          ref={ref as React.ForwardedRef<HTMLAnchorElement>}
          className={combinedClassName}
          {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {children}
        </a>
      );
    }

    // Buttons inside forms submit by default, which is almost never wanted
    // for anything but the actual submit button.
    return (
      <button
        ref={ref as React.ForwardedRef<HTMLButtonElement>}
        type="button"
        className={combinedClassName}
        {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
