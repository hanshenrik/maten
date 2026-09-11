/**
 * Cookie helpers that are safe to use in the browser.
 *
 * Every cookie the app sets itself starts with `maten_`. Cached lookups (like
 * the household id) are swept on logout and when membership changes;
 * preferences use `maten_pref_` and survive the sweep.
 */
export const APP_COOKIE_PREFIX = "maten_";
export const PREF_COOKIE_PREFIX = `${APP_COOKIE_PREFIX}pref_`;

const ONE_YEAR = 60 * 60 * 24 * 365;

const parse = (cookieHeader: string): [string, string][] =>
  cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const eq = part.indexOf("=");
      return eq < 0 ? [part, ""] : [part.slice(0, eq), part.slice(eq + 1)];
    });

export const readCookie = (name: string): string | undefined =>
  parse(document.cookie).find(([key]) => key === name)?.[1];

export const writeCookie = (name: string, value: string, maxAge = ONE_YEAR) => {
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
};

export const deleteCookie = (name: string) => {
  document.cookie = `${name}=; path=/; max-age=0`;
};

/** Forgets every cached lookup, so the server fetches fresh on the next request. */
export const clearCachedCookies = () => {
  for (const [name] of parse(document.cookie)) {
    if (
      name.startsWith(APP_COOKIE_PREFIX) &&
      !name.startsWith(PREF_COOKIE_PREFIX)
    ) {
      deleteCookie(name);
    }
  }
};
