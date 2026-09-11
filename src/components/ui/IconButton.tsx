import React from "react";
import { cn } from "../../utils/cn";
import { Icon } from "./Icon";

type IconButtonBaseProps = {
  /** Iconify icon name, e.g. from `ui` in utils/icons */
  icon: string;
  /**
   * Accessible name. There is no visible text to fall back on, so this is
   * required, and it doubles as the hover tooltip unless `title` says otherwise.
   */
  label: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  /** `xs` is for icons tucked inside another control, such as a search field */
  size?: "xs" | "sm" | "md";
};

type IconButtonAsButtonProps = IconButtonBaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
    as?: "button";
  };

type IconButtonAsAnchorProps = IconButtonBaseProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "children"> & {
    as: "a";
  };

export type IconButtonProps = IconButtonAsButtonProps | IconButtonAsAnchorProps;

const variants = {
  primary:
    "bg-primary text-white hover:bg-primary-hover focus:ring-primary border border-transparent",
  secondary:
    "bg-surface text-text hover:text-primary hover:border-current hover:bg-primary/5 focus:ring-border border border-border",
  danger:
    "bg-surface text-text hover:text-danger hover:bg-danger/10 focus:ring-danger border border-border hover:border-current",
  ghost:
    "text-text-muted hover:text-primary hover:bg-primary/5 focus:ring-border data-[open]:bg-primary/5 data-[open]:text-primary border border-transparent",
};

const sizes = {
  xs: { button: "h-7 w-7", icon: "h-4 w-4" },
  sm: { button: "h-9 w-9", icon: "h-5 w-5" },
  md: { button: "h-11 w-11", icon: "h-6 w-6" },
};

/**
 * A square button whose whole content is one icon. Use this anywhere a bare
 * icon is clickable — back links, dot menus, remove buttons — so they all end
 * up the same size and with the same hover and focus treatment.
 */
export const IconButton = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  IconButtonProps
>(
  (
    {
      className,
      icon,
      label,
      variant = "ghost",
      size = "sm",
      title,
      as,
      ...props
    },
    ref,
  ) => {
    const combinedClassName = cn(
      "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-xl transition-all focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
      variants[variant],
      sizes[size].button,
      className,
    );

    const glyph = <Icon icon={icon} className={sizes[size].icon} />;

    if (as === "a") {
      return (
        <a
          ref={ref as React.ForwardedRef<HTMLAnchorElement>}
          aria-label={label}
          title={title ?? label}
          className={combinedClassName}
          {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {glyph}
        </a>
      );
    }

    const buttonProps = props as React.ButtonHTMLAttributes<HTMLButtonElement>;

    return (
      <button
        ref={ref as React.ForwardedRef<HTMLButtonElement>}
        aria-label={label}
        title={title ?? label}
        className={combinedClassName}
        {...buttonProps}
        // Buttons inside forms submit by default, which is almost never wanted
        // for anything but the actual submit button. This sits after the spread
        // because Headless UI passes an explicit `type: undefined`.
        type={buttonProps.type ?? "button"}
      >
        {glyph}
      </button>
    );
  },
);

IconButton.displayName = "IconButton";
