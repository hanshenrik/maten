import { app } from "./icons";

// Preference cookie. The `maten_pref_` prefix marks it as a user preference so
// it survives the `maten_` cache sweep in SettingsForm.
export const START_PAGE_COOKIE = "maten_pref_start_page";

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
