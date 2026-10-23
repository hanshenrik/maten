import { PREF_COOKIE_PREFIX, readCookie, writeCookie } from "./cookies";

/**
 * Whether the recipe page's "keep the screen awake" switch starts on.
 * A preference cookie, so the choice follows the user; the wake lock itself
 * is only ever held while a recipe page is open.
 */
export const WAKE_LOCK_PREF_COOKIE = `${PREF_COOKIE_PREFIX}wake_lock`;

export const readWakeLockPref = (): boolean =>
  readCookie(WAKE_LOCK_PREF_COOKIE) === "true";

export const writeWakeLockPref = (on: boolean) =>
  writeCookie(WAKE_LOCK_PREF_COOKIE, String(on));
