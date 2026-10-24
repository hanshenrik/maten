import React, { useCallback, useEffect, useRef, useState } from "react";
import { Toggle } from "./forms/Toggle";
import { readWakeLockPref } from "../utils/wakeLockPref";

/**
 * A "keep the screen awake while I cook" switch for the recipe page, backed
 * by the Screen Wake Lock API. Starts from the saved preference and only
 * holds the lock while this page is open: the browser releases it whenever
 * the page is hidden or closed, and it is requested again each time the tab
 * becomes visible while the switch is on.
 */
export const WakeLockToggle = () => {
  // The Wake Lock API is only in some browsers, and the server doesn't know
  // which one will show up. Branching on it while rendering makes the
  // client's first render differ from the server's empty one, which is a
  // hydration error, so both start empty and the switch appears after mount.
  const [supported, setSupported] = useState(false);
  const [checked, setChecked] = useState(false);
  const [active, setActive] = useState(false);
  const lockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    setSupported("wakeLock" in navigator);
  }, []);

  // The preference cookie is only readable in the browser, so start from it
  // after mount rather than initialising state directly.
  useEffect(() => {
    if (readWakeLockPref()) setChecked(true);
  }, []);

  useEffect(() => {
    if (!checked) {
      lockRef.current?.release().catch(() => {});
      lockRef.current = null;
      setActive(false);
      return;
    }
    // Requesting while the page is hidden is rejected outright, so wait for
    // it to be visible first; the visibilitychange listener re-requests.
    const request = () => {
      if (!("wakeLock" in navigator)) return;
      if (document.visibilityState !== "visible") return;
      navigator.wakeLock
        .request("screen")
        .then((sentinel) => {
          lockRef.current = sentinel;
          setActive(true);
          sentinel.addEventListener("release", () => setActive(false));
        })
        .catch(() => setActive(false));
    };
    request();
    document.addEventListener("visibilitychange", request);
    return () => {
      document.removeEventListener("visibilitychange", request);
      lockRef.current?.release().catch(() => {});
      lockRef.current = null;
      setActive(false);
    };
  }, [checked]);

  const onChange = useCallback((value: boolean) => setChecked(value), []);

  if (!supported) return null;

  return (
    <div className="mb-4 flex items-center gap-3">
      <Toggle
        id="wake-lock"
        checked={checked}
        onChange={onChange}
        label="Hold skjermen på"
      />
      <label
        htmlFor="wake-lock"
        className="text-text-muted cursor-pointer text-sm font-medium"
        title={
          active ? "Skjermen holdes våken" : "Skjermen kan fortsatt slå seg av"
        }
      >
        Hold skjermen på
      </label>
    </div>
  );
};
