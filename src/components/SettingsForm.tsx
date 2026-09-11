import React, { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { supabase } from "../lib/supabase";
import type { HouseholdMember, Theme } from "../types";
import { clearCachedCookies, readCookie, writeCookie } from "../utils/cookies";
import { formatDistanceToNow } from "../utils/date";
import { ui } from "../utils/icons";
import {
  DEFAULT_START_PAGE,
  START_PAGE_COOKIE,
  resolveStartPage,
  startPages,
  type StartPagePath,
} from "../utils/startPage";
import { applyTheme, readTheme, themeOptions } from "../utils/theme";
import { Input } from "./forms/Input";
import { Alert } from "./ui/Alert";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { SegmentedControl } from "./ui/SegmentedControl";

interface PendingInvite {
  id: string;
  household_id: string;
  households: { name: string } | null;
}

interface SettingsFormProps {
  userId: string;
  userEmail?: string;
  householdId?: string;
  fullName?: string;
  avatarUrl?: string;
}

const startPageOptions = startPages.map(({ path, label, icon }) => ({
  value: path,
  label,
  icon,
}));

export const SettingsForm = ({
  userId,
  userEmail,
  householdId,
  fullName,
  avatarUrl: initialAvatarUrl,
}: SettingsFormProps) => {
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [householdName, setHouseholdName] = useState("");
  const [loading, setLoading] = useState(!!householdId);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [theme, setTheme] = useState<Theme>("auto");
  const [startPage, setStartPage] = useState<StartPagePath>(DEFAULT_START_PAGE);

  // Preferences live in the browser, so read them after mount
  useEffect(() => {
    setTheme(readTheme());
    setStartPage(resolveStartPage(readCookie(START_PAGE_COOKIE)));
  }, []);

  const fetchInvites = useCallback(async () => {
    if (!userEmail) return;
    const { data, error } = await supabase
      .from("household_members")
      .select("id, household_id, households (name)")
      .eq("email", userEmail)
      .is("user_id", null);
    if (error) {
      console.error("Error fetching invites:", error);
      return;
    }
    setInvites((data as unknown as PendingInvite[]) ?? []);
  }, [userEmail]);

  const fetchMembers = useCallback(async () => {
    if (!householdId) return;
    try {
      const [membersRes, householdRes] = await Promise.all([
        supabase
          .from("household_member_profiles")
          .select("*")
          .eq("household_id", householdId)
          .order("created_at", { ascending: true }),
        supabase
          .from("households")
          .select("name")
          .eq("id", householdId)
          .single(),
      ]);
      if (membersRes.error) throw membersRes.error;
      if (householdRes.error) throw householdRes.error;

      setMembers((membersRes.data as HouseholdMember[]) ?? []);
      setHouseholdName(householdRes.data?.name ?? "");
    } catch (err) {
      console.error("Error fetching members:", err);
      setError("Huff da, vi klarte ikke å hente inn de som bor her.");
    } finally {
      setLoading(false);
    }
  }, [householdId]);

  useEffect(() => {
    fetchMembers();
    fetchInvites();
  }, [fetchMembers, fetchInvites]);

  /** Runs an action, showing a message on success or failure */
  const run = async (
    action: () => Promise<void>,
    messages: { success?: string; failure: string },
  ) => {
    setError(null);
    setNotice(null);
    try {
      await action();
      if (messages.success) setNotice(messages.success);
    } catch (err) {
      console.error(messages.failure, err);
      setError(messages.failure);
    }
  };

  const handleThemeChange = (next: Theme) => {
    setTheme(next);
    applyTheme(next);
  };

  const handleStartPageChange = (next: StartPagePath) => {
    setStartPage(next);
    writeCookie(START_PAGE_COOKIE, next);
  };

  const handleAcceptInvite = (inviteId: string) =>
    run(
      async () => {
        const { error } = await supabase
          .from("household_members")
          .update({ user_id: userId })
          .eq("id", inviteId);
        if (error) throw error;
        // The middleware caches household membership in cookies. Forget
        // them and reload, so it picks up the new household.
        clearCachedCookies();
        window.location.reload();
      },
      { failure: "Det oppsto en feil da vi prøvde å godta invitasjonen." },
    );

  const handleRefuseInvite = (inviteId: string) =>
    run(
      async () => {
        const { error } = await supabase
          .from("household_members")
          .delete()
          .eq("id", inviteId);
        if (error) throw error;
        clearCachedCookies();
        await fetchInvites();
      },
      { failure: "Vi klarte ikke å fjerne invitasjonen." },
    );

  const handleRemoveMember = (member: HouseholdMember) => {
    if (
      !confirm(
        `Er du helt sikker på at du vil fjerne ${member.email} fra husstanden?`,
      )
    )
      return;
    run(
      async () => {
        const { error } = await supabase
          .from("household_members")
          .delete()
          .eq("id", member.id);
        if (error) throw error;
        await fetchMembers();
      },
      { failure: "Det gikk ikke å fjerne medlemmet." },
    );
  };

  if (loading) {
    return <div className="text-text-muted">Henter innstillingene dine...</div>;
  }

  if (!householdId) {
    return (
      <Alert className="p-6">
        <h2 className="mb-2 text-lg font-bold">Her mangler det noe...</h2>
        <p>Prøv å logge ut og inn igjen, så vi får deg helt på plass.</p>
      </Alert>
    );
  }

  const isOwner = members.find((m) => m.user_id === userId)?.role === "owner";

  return (
    <div className="space-y-8">
      {error && <Alert>{error}</Alert>}
      {notice && <Alert variant="success">{notice}</Alert>}

      <ProfileCard
        userId={userId}
        fullName={fullName}
        avatarUrl={initialAvatarUrl}
        run={run}
      />

      {isOwner && (
        <Card>
          <h2 className="text-text mb-4 text-xl font-semibold">
            Hva skal husstanden hete?
          </h2>
          <InlineForm
            value={householdName}
            onChange={setHouseholdName}
            placeholder="f.eks. Familien Hansen"
            buttonLabel="Lagre nytt navn"
            onSubmit={(name) =>
              run(
                async () => {
                  const { error } = await supabase
                    .from("households")
                    .update({ name })
                    .eq("id", householdId);
                  if (error) throw error;
                },
                {
                  success: "Husstanden har fått nytt navn.",
                  failure: "Ops, vi fikk ikke lagret det nye navnet.",
                },
              )
            }
          />
        </Card>
      )}

      <Card>
        <h2 className="text-text mb-4 text-xl font-semibold">
          Hvordan skal appen se ut?
        </h2>
        <SegmentedControl
          label="Tema"
          options={themeOptions}
          value={theme}
          onChange={handleThemeChange}
        />
      </Card>

      <Card>
        <h2 className="text-text mb-4 text-xl font-semibold">
          Hvor vil du starte?
        </h2>
        <p className="text-text-muted mb-6 text-sm">
          Siden du kommer til når du åpner appen.
        </p>
        <SegmentedControl
          label="Startside"
          options={startPageOptions}
          value={startPage}
          onChange={handleStartPageChange}
        />
      </Card>

      {invites.length > 0 && (
        <div className="border-primary/20 bg-primary/10 rounded-2xl border p-6 shadow-sm">
          <h2 className="text-text mb-4 text-xl font-semibold">
            Noen har spurt om du vil være med!
          </h2>
          <ul className="space-y-4">
            {invites.map((invite) => (
              <li
                key={invite.id}
                className="border-border bg-surface flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-text font-medium">
                    Du har blitt invitert til:
                  </p>
                  <p className="text-lg font-bold">
                    {invite.households?.name || "En husstand"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleRefuseInvite(invite.id)}
                    variant="danger"
                  >
                    Avvis
                  </Button>
                  <Button onClick={() => handleAcceptInvite(invite.id)}>
                    Godta og bli med
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Card>
        <h2 className="text-text mb-4 text-xl font-semibold">
          Be noen flere inn i varmen
        </h2>
        <p className="text-text-muted mb-6">
          Alle i husstanden deler de samme oppskriftene, menyene og den samme
          handlelisten. Det du gjør her, ser de andre med en gang!
        </p>
        <InviteForm
          householdId={householdId}
          onInvited={fetchMembers}
          run={run}
        />
      </Card>

      <Card>
        <h2 className="text-text mb-4 text-xl font-semibold">
          De som er med i {householdName}
        </h2>
        <ul className="divide-border divide-y">
          {members.map((member) => (
            <li
              key={member.id}
              className="flex items-center justify-between gap-4 py-4"
            >
              <div className="flex items-center gap-3">
                {member.avatar_url ? (
                  <img
                    src={member.avatar_url}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full">
                    <Icon icon={ui.user} className="h-5 w-5" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-text font-medium">
                      {member.display_name || member.email}
                    </p>
                    {member.role === "owner" && (
                      <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[10px] font-bold uppercase">
                        Eier
                      </span>
                    )}
                    {!member.user_id && (
                      <span className="bg-bg text-text-muted rounded-full px-2 py-0.5 text-[10px] font-bold uppercase">
                        Invitert
                      </span>
                    )}
                  </div>
                  <p className="text-text-muted text-xs">{member.email}</p>
                  <p className="text-text-muted text-xs">
                    Ble med for {formatDistanceToNow(member.created_at)} siden
                  </p>
                </div>
              </div>
              {member.role !== "owner" && (
                <Button
                  onClick={() => handleRemoveMember(member)}
                  variant="danger"
                  size="sm"
                  title="Fjern fra husstand"
                  aria-label={`Fjern ${member.email}`}
                >
                  <Icon icon={ui.delete} className="h-5 w-5" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
};

// --- Pieces ---

type Run = (
  action: () => Promise<void>,
  messages: { success?: string; failure: string },
) => Promise<void>;

/** A single text field with a submit button beside it */
const InlineForm = ({
  value,
  onChange,
  placeholder,
  buttonLabel,
  onSubmit,
  type = "text",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  buttonLabel: string;
  onSubmit: (value: string) => Promise<void>;
  type?: "text" | "email";
}) => {
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        const trimmed = value.trim();
        if (!trimmed) return;
        setSubmitting(true);
        try {
          await onSubmit(trimmed);
        } finally {
          setSubmitting(false);
        }
      }}
      className="flex flex-col gap-2 sm:flex-row sm:items-start"
    >
      <Input
        type={type}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      <Button
        type="submit"
        disabled={submitting}
        className="w-full px-6 sm:w-auto"
      >
        {submitting ? "Lagrer..." : buttonLabel}
      </Button>
    </form>
  );
};

const InviteForm = ({
  householdId,
  onInvited,
  run,
}: {
  householdId: string;
  onInvited: () => Promise<void>;
  run: Run;
}) => {
  const [email, setEmail] = useState("");

  return (
    <InlineForm
      type="email"
      value={email}
      onChange={setEmail}
      placeholder="E-postadresse til den du vil invitere"
      buttonLabel="Send invitasjon"
      onSubmit={(address) =>
        run(
          async () => {
            const res = await fetch("/api/household/invite", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: address, householdId }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
              throw new Error(
                data.error || "Vi klarte ikke å sende invitasjonen.",
              );
            }
            setEmail("");
            await onInvited();
          },
          {
            success: "Invitasjonen er sendt.",
            failure: "Vi klarte ikke å sende invitasjonen.",
          },
        ).catch(() => undefined)
      }
    />
  );
};

const ProfileCard = ({
  userId,
  fullName,
  avatarUrl: initialAvatarUrl,
  run,
}: {
  userId: string;
  fullName?: string;
  avatarUrl?: string;
  run: Run;
}) => {
  const [displayName, setDisplayName] = useState(fullName ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const uploadAvatar = async () => {
    if (!avatarFile) return;
    setUploading(true);
    try {
      await run(
        async () => {
          const extension = avatarFile.name.split(".").pop() || "jpg";
          const path = `${userId}/avatar.${extension}`;
          const { error: uploadError } = await supabase.storage
            .from("profile-images")
            .upload(path, avatarFile, { upsert: true });
          if (uploadError) throw uploadError;

          const { publicUrl } = supabase.storage
            .from("profile-images")
            .getPublicUrl(path).data;
          // The path is reused, so bust caches to show the new picture
          const url = `${publicUrl}?t=${Date.now()}`;

          const { error } = await supabase.auth.updateUser({
            data: { avatar_url: url },
          });
          if (error) throw error;

          setAvatarUrl(url);
          setAvatarFile(null);
        },
        {
          success: "Bildet er lastet opp.",
          failure: "Klarte ikke å laste opp bildet. Prøv igjen.",
        },
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <h2 className="text-text mb-4 text-xl font-semibold">Om deg</h2>
      <p className="text-text-muted mb-6 text-sm">
        Navnet og bildet ditt vises på oppskrifter du deler i biblioteket.
      </p>

      <div className="mb-6 flex items-center gap-5">
        {avatarUrl && !avatarFile ? (
          <img
            src={avatarUrl}
            alt="Profilbilde"
            className="border-border h-20 w-20 rounded-full border-2 object-cover"
          />
        ) : (
          <div
            className={`flex h-20 w-20 items-center justify-center rounded-full border-2 ${
              avatarFile
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-bg text-text-muted"
            }`}
          >
            <Icon icon={avatarFile ? ui.image : ui.user} className="h-8 w-8" />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
            />
            <span className="text-primary text-sm font-medium hover:underline">
              {avatarUrl ? "Bytt bilde" : "Last opp bilde"}
            </span>
          </label>
          {avatarFile && (
            <>
              <span className="text-text-muted text-xs">{avatarFile.name}</span>
              <Button size="sm" disabled={uploading} onClick={uploadAvatar}>
                {uploading ? "Laster opp..." : "Last opp"}
              </Button>
            </>
          )}
        </div>
      </div>

      <InlineForm
        value={displayName}
        onChange={setDisplayName}
        placeholder="f.eks. Ola Nordmann"
        buttonLabel="Lagre navn"
        onSubmit={(name) =>
          run(
            async () => {
              const { error } = await supabase.auth.updateUser({
                data: { full_name: name },
              });
              if (error) throw error;
            },
            {
              success: "Navnet ditt er lagret.",
              failure: "Ops, vi fikk ikke lagret navnet ditt.",
            },
          )
        }
      />
    </Card>
  );
};
