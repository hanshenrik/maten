import React from "react";
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  MenuSeparator,
} from "@headlessui/react";
import { Icon } from "./Icon";
import { ui } from "../../utils/icons";

export interface DotMenuItem {
  label: string;
  /** Iconify icon name, e.g. from `ui` in utils/icons */
  icon?: string;
  onClick?: () => void;
  /** Renders the item as a link instead of a button */
  href?: string;
  variant?: "default" | "danger";
  disabled?: boolean;
}

/** Insert between items to draw a dividing line */
export const dotMenuSeparator = "separator" as const;

export type DotMenuEntry = DotMenuItem | typeof dotMenuSeparator;

interface DotMenuProps {
  items: DotMenuEntry[];
  /** Which edge of the button the menu lines up with */
  align?: "start" | "end";
  /** Accessible name for the trigger button */
  label?: string;
  className?: string;
}

export const DotMenu: React.FC<DotMenuProps> = ({
  items,
  align = "end",
  label = "Flere valg",
  className = "",
}) => (
  <Menu>
    <MenuButton
      aria-label={label}
      className={`text-text-muted hover:bg-primary/5 hover:text-primary focus:ring-border data-[open]:bg-primary/5 data-[open]:text-primary flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl transition-all focus:ring-2 focus:outline-none ${className}`}
    >
      <Icon icon={ui.more} className="h-5 w-5" />
    </MenuButton>

    {/* `anchor` flips and shifts the panel to keep it inside the viewport, and
        caps its height at `--anchor-max-height` or the space available. */}
    <MenuItems
      anchor={{ to: `bottom ${align}`, gap: 4, padding: 8 }}
      className="border-border bg-surface text-text z-50 min-w-48 rounded-xl border py-1 shadow-lg outline-none [--anchor-max-height:20rem]"
    >
      {items.map((item, index) =>
        item === dotMenuSeparator ? (
          <MenuSeparator
            key={`separator-${index}`}
            className="border-border my-1 border-t"
          />
        ) : (
          // The child must be the <a>/<button> itself so Headless UI can put
          // its focus props and ref on it — don't wrap it in a component.
          <MenuItem key={item.label} disabled={item.disabled}>
            {item.href ? (
              <a href={item.href} className={rowClassName(item)}>
                <RowContent item={item} />
              </a>
            ) : (
              <button
                type="button"
                onClick={item.onClick}
                className={rowClassName(item)}
              >
                <RowContent item={item} />
              </button>
            )}
          </MenuItem>
        ),
      )}
    </MenuItems>
  </Menu>
);

function rowClassName(item: DotMenuItem) {
  return `flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors outline-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 ${
    item.variant === "danger"
      ? "text-danger data-[focus]:bg-danger/10"
      : "text-text data-[focus]:bg-primary/5 data-[focus]:text-primary"
  }`;
}

function RowContent({ item }: { item: DotMenuItem }) {
  return (
    <>
      {item.icon ? (
        <Icon icon={item.icon} className="h-5 w-5 shrink-0" />
      ) : null}
      <span className="truncate">{item.label}</span>
    </>
  );
}
