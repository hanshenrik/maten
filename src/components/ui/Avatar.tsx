import React from "react";
import { cn } from "../../utils/cn";
import { Icon } from "./Icon";
import { ui } from "../../utils/icons";

interface AvatarProps {
  /** Profile picture URL, if any. Falls back to a person icon. */
  src?: string | null;
  /** Used for the `alt` and the tooltip on the fallback. */
  name: string;
  /** Tailwind size classes, e.g. `h-8 w-8`. Defaults to `h-10 w-10`. */
  size?: string;
  /** Extra classes for the wrapper. */
  className?: string;
}

/**
 * A round avatar: the user's picture when there is one, a person icon
 * otherwise. Mirrors the avatar treatment in the settings page.
 */
export const Avatar = ({
  src,
  name,
  size = "h-10 w-10",
  className,
}: AvatarProps) =>
  src ? (
    <img
      src={src}
      alt={name}
      title={name}
      className={cn("rounded-full object-cover", size, className)}
    />
  ) : (
    <div
      title={name}
      className={cn(
        "bg-primary/10 text-primary flex items-center justify-center rounded-full",
        size,
        className,
      )}
    >
      <Icon icon={ui.user} className="h-1/2 w-1/2" />
    </div>
  );
