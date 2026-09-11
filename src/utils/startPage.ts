import { PREF_COOKIE_PREFIX } from "./cookies";
import { app } from "./icons";

// A cookie rather than localStorage, because "/" redirects on the server and
// has to know the choice before any JavaScript runs.
export const START_PAGE_COOKIE = `${PREF_COOKIE_PREFIX}start_page`;

export const startPages = [
  { path: "/recipes", label: "Oppskrifter", icon: app.recipes },
  { path: "/plans", label: "Menyer", icon: app.plans },
  { path: "/shopping", label: "Handleliste", icon: app.shopping },
] as const;

export type StartPagePath = (typeof startPages)[number]["path"];

export const DEFAULT_START_PAGE: StartPagePath = "/plans";

export const resolveStartPage = (value?: string | null): StartPagePath =>
  startPages.some((page) => page.path === value)
    ? (value as StartPagePath)
    : DEFAULT_START_PAGE;
