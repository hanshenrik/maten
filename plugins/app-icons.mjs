import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { getIconData } from "@iconify/utils";

/**
 * Bundles the icons the React components use.
 *
 * `@iconify/react` normally fetches icon data from api.iconify.design the
 * first time an icon is shown. This plugin reads every "prefix:name" string
 * in src/utils/icons.ts, pulls the SVG data out of the installed
 * `@iconify-json/*` packages at build time, and serves it as the virtual
 * module `virtual:app-icons`. No network, no flash of missing icons, and a
 * typo in an icon name fails the build instead of rendering nothing.
 */

const VIRTUAL_ID = "virtual:app-icons";
const RESOLVED_ID = `\0${VIRTUAL_ID}`;
const ICONS_FILE = fileURLToPath(
  new URL("../src/utils/icons.ts", import.meta.url),
);
const ICON_NAME = /"([a-z0-9-]+):([a-z0-9-]+)"/g;

const require = createRequire(import.meta.url);

export default function appIcons() {
  return {
    name: "app-icons",

    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
    },

    async load(id) {
      if (id !== RESOLVED_ID) return;
      this.addWatchFile(ICONS_FILE);

      const source = await readFile(ICONS_FILE, "utf8");
      const collections = new Map();
      const icons = {};

      for (const [, prefix, name] of source.matchAll(ICON_NAME)) {
        if (!collections.has(prefix)) {
          collections.set(
            prefix,
            require(`@iconify-json/${prefix}/icons.json`),
          );
        }
        const data = getIconData(collections.get(prefix), name);
        if (!data) {
          throw new Error(
            `Unknown icon "${prefix}:${name}" in src/utils/icons.ts`,
          );
        }
        icons[`${prefix}:${name}`] = data;
      }

      return `export default ${JSON.stringify(icons)};`;
    },
  };
}
