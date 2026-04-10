import React from "react";

type ButtonBaseProps = {
  variant?: "primary" | "secondary" | "danger" | "ghost";
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

export const Button = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonProps
>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      fullWidth = false,
      children,
      as,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer disabled:cursor-not-allowed";

    const variants = {
      primary:
        "bg-primary text-white hover:bg-emerald-900 focus:ring-emerald-500",
      secondary:
        "bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500",
      danger:
        "bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500 border border-transparent",
      ghost:
        "bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-500",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-6 py-3 text-lg",
    };

    const combinedClassName = `${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`;

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

    return (
      <button
        ref={ref as React.ForwardedRef<HTMLButtonElement>}
        className={combinedClassName}
        {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
