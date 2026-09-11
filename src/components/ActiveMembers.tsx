import React, { useEffect, useMemo, useState } from "react";
import { Avatar } from "./ui/Avatar";
import { Icon } from "./ui/Icon";
import { ui } from "../utils/icons";
import type { ActiveUser, PresenceUser } from "../utils/realtime";
import { trackPresence } from "../utils/realtime";

interface ActiveMembersProps {
  householdId: string;
  /** The signed-in user, tracked so others see them online. */
  user: PresenceUser;
}

/**
 * Shows small avatars of the household members currently viewing the app.
 * A green ring marks yourself. Presence is best-effort: until the channel
 * connects only you are listed.
 */
export const ActiveMembers = ({ householdId, user }: ActiveMembersProps) => {
  const [active, setActive] = useState<ActiveUser[]>([]);

  useEffect(() => {
    // Seed with ourselves so the list isn't empty before the first sync.
    setActive([{ ...user, presenceRef: "self" }]);
    return trackPresence(householdId, user, setActive);
  }, [householdId, user]);

  // A user can hold several connections (phone + laptop), so collapse to one
  // avatar per person, keeping the latest presence ref for a stable key.
  const byPerson = useMemo(() => {
    const latest = new Map<string, ActiveUser>();
    for (const u of active) {
      const seen = latest.get(u.id);
      if (!seen || u.presenceRef > seen.presenceRef) latest.set(u.id, u);
    }
    return Array.from(latest.values());
  }, [active]);

  if (byPerson.length === 0) return null;

  return (
    <div
      className="flex items-center gap-2"
      role="group"
      aria-label={`Pålogget nå: ${byPerson.map((u) => u.name).join(", ")}`}
    >
      <div className="flex -space-x-2">
        {byPerson.map((u) => (
          <Avatar
            key={u.id}
            src={u.avatarUrl}
            name={u.name}
            size="h-8 w-8"
            className={cnRing(u.id === user.id)}
          />
        ))}
      </div>
    </div>
  );
};

/** Yourself gets a green ring so you can tell which one you are. */
const cnRing = (isSelf: boolean) =>
  isSelf
    ? "ring-2 ring-primary ring-offset-2 ring-offset-bg"
    : "ring-2 ring-bg";
