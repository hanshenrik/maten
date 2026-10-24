import { readFileSync } from "node:fs";
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

/**
 * The names in src/utils/icons.ts grouped by icon set, e.g.
 * `{ hugeicons: ["plus-sign", …] }`. Also the `include` list for astro-icon,
 * which otherwise bundles every icon in each installed set into the server.
 */
export function iconNamesBySet() {
  const sets = {};
  for (const [, prefix, name] of readFileSync(ICONS_FILE, "utf8").matchAll(
    ICON_NAME,
  )) {
    if (!sets[prefix]) {
      sets[prefix] = [];
    }
    sets[prefix].push(name);
  }
  return sets;
}

export default function appIcons() {
  return {
    name: "app-icons",

    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
    },

    load(id) {
      if (id !== RESOLVED_ID) return;
      this.addWatchFile(ICONS_FILE);

      const icons = {};

      for (const [prefix, names] of Object.entries(iconNamesBySet())) {
        const collection = require(`@iconify-json/${prefix}/icons.json`);
        for (const name of names) {
          const data = getIconData(collection, name);
          if (!data) {
            throw new Error(
              `Unknown icon "${prefix}:${name}" in src/utils/icons.ts`,
            );
          }
          icons[`${prefix}:${name}`] = data;
        }
      }

      return `export default ${JSON.stringify(icons)};`;
    },
  };
}
