import type { Theme } from "../types";
import { ui } from "./icons";

/** Mirrored by the inline script in BaseLayout, which applies it before paint. */
export const THEME_STORAGE_KEY = "theme";

export const themeOptions = [
  { value: "light", label: "Lys", icon: ui.sun },
  { value: "dark", label: "Mørk", icon: ui.moon },
  { value: "auto", label: "System", icon: ui.computer },
] as const satisfies readonly { value: Theme; label: string; icon: string }[];

const isTheme = (value: unknown): value is Theme =>
  value === "light" || value === "dark" || value === "auto";

export const readTheme = (): Theme => {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return isTheme(stored) ? stored : "auto";
};

export const applyTheme = (theme: Theme) => {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  if (theme === "auto") {
    delete document.documentElement.dataset.theme;
  } else {
    document.documentElement.dataset.theme = theme;
  }
};
