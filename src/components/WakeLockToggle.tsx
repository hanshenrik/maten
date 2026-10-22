import React, { useCallback, useEffect, useRef, useState } from "react";
import { Toggle } from "./forms/Toggle";

/**
 * A "keep the screen awake while I cook" switch for the recipe page, backed
 * by the Screen Wake Lock API. The browser releases the lock whenever the
 * page is hidden, so it is requested again each time the tab becomes
 * visible while the switch is on.
 */
export const WakeLockToggle = () => {
  const supported = typeof navigator !== "undefined" && "wakeLock" in navigator;
  const [checked, setChecked] = useState(false);
  const [active, setActive] = useState(false);
  const lockRef = useRef<WakeLockSentinel | null>(null);

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
        label="Hold skjermen våken"
      />
      <label
        htmlFor="wake-lock"
        className="text-text-muted cursor-pointer text-sm font-medium"
        title={
          active ? "Skjermen holdes våken" : "Skjermen kan fortsatt slå seg av"
        }
      >
        Hold skjermen våken{active ? "" : " under tilberedning"}
      </label>
    </div>
  );
};
