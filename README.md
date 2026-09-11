# Maten

Recipes, weekly menus and a shared shopping list for the household.
Built with [Astro](https://astro.build) (server rendered, deployed on Vercel),
React islands, Tailwind CSS and [Supabase](https://supabase.com) for auth,
database and storage.

## Getting started

```sh
cp .env.example .env.local   # fill in the Supabase keys
npm install
npm run dev
```

Node version is pinned in `.tool-versions`.

## Scripts

| Script            | What it does                                |
| ----------------- | ------------------------------------------- |
| `npm run dev`     | Dev server                                  |
| `npm run network` | Dev server reachable from other devices     |
| `npm run build`   | Production build                            |
| `npm run check`   | Type check (`astro check`)                  |
| `npm run lint`    | Prettier check                              |
| `npm run format`  | Prettier write                              |
| `npm run verify`  | Lint, type check and build, as CI runs them |

## How it fits together

- `src/middleware.ts` signs the user in from the Supabase cookies, resolves
  their household (cached in a cookie) and guards every page.
- `src/pages` are server rendered. Interactive parts are React components in
  `src/components` loaded with `client:load`.
- `src/lib` holds server-side helpers: Supabase clients, session, markdown
  sanitising, shared queries. `src/utils` is safe for both server and browser.
- Access control is Supabase row level security; the app always queries as
  the signed-in user.

## Icons

- Streamline Ultimate Colors: https://www.streamlinehq.com/icons/ultimate-colos-free
- Huge Icons: https://hugeicons.com/icons/stroke-rounded

Icon names are kept in `src/utils/icons.ts`. Astro components render them with
`astro-icon`; React components use `src/components/ui/Icon.tsx`, which gets
the SVG data for exactly those names bundled at build time by
`plugins/app-icons.mjs`, so nothing is fetched from Iconify at runtime. To use
a new icon, add it to `icons.ts`; an unknown name fails the build.
