import { Icon as OfflineIcon, addIcon } from "@iconify/react/offline";
import icons from "virtual:app-icons";

// Register once per module load, on the server and in the browser alike
for (const [name, data] of Object.entries(icons)) {
  addIcon(name, data);
}

/**
 * The icon component for React. Works exactly like `Icon` from
 * `@iconify/react`, but only knows the icons listed in `src/utils/icons.ts`,
 * which are bundled at build time instead of fetched from Iconify's API.
 */
export const Icon = OfflineIcon;
export type { IconProps } from "@iconify/react/offline";
