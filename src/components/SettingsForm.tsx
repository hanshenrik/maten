import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Icon } from "@iconify/react";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

interface Member {
  id: string;
  user_id: string | null;
  email: string;
  role: string;
  created_at: string;
}

interface SettingsFormProps {
  userId: string;
  userEmail?: string;
  householdId?: string;
}

interface PendingInvite {
  id: string;
  household_id: string;
  households: {
    name: string;
  };
}

export const SettingsForm: React.FC<SettingsFormProps> = ({
  userId,
  userEmail,
  householdId,
}) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [householdName, setHouseholdName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameSubmitting, setNameSubmitting] = useState(false);

  const fetchInvites = async () => {
    if (!userEmail) return;
    try {
      const { data, error } = await supabase
        .from("household_members")
        .select(`id, household_id, households (name)`)
        .eq("email", userEmail)
        .is("user_id", null);

      if (error) throw error;
      setInvites((data as unknown as PendingInvite[]) || []);
    } catch (err) {
      console.error("Error fetching invites:", err);
    }
  };

  const fetchMembers = async () => {
    if (!householdId) {
      setLoading(false);
      return;
    }
    try {
      const [membersRes, householdRes] = await Promise.all([
        supabase
          .from("household_members")
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

      setMembers(membersRes.data || []);
      setHouseholdName(householdRes.data?.name || "");
    } catch (err: any) {
      console.error("Error fetching members:", err);
      setError("Kunne ikke hente husstandsmedlemmer.");
    } finally {
      if (householdId) {
        // Only finish loading if we were actually loading members
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchMembers();
    fetchInvites();
    if (!householdId) {
      setLoading(false);
    }
  }, [householdId, userEmail]);

  const clearHouseholdCache = () => {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf("=");
      const name =
        eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
      if (name.startsWith("maten_")) {
        document.cookie =
          name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      }
    }
  };

  const handleAcceptInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from("household_members")
        .update({ user_id: userId })
        .eq("id", inviteId);

      if (error) throw error;

      // Clear cache before reload
      clearHouseholdCache();

      // Reload the page to trigger middleware and update locals
      window.location.reload();
    } catch (err: any) {
      console.error("Error accepting invite:", err);
      setError("Kunne ikke godta invitasjonen.");
    }
  };

  const handleRefuseInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from("household_members")
        .delete()
        .eq("id", inviteId);

      if (error) throw error;
      fetchInvites();
    } catch (err: any) {
      console.error("Error refusing invite:", err);
      setError("Kunne ikke avvise invitasjonen.");
    }
  };

  const handleUpdateHouseholdName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!householdName.trim() || !householdId) return;

    setNameSubmitting(true);
    setError(null);

    try {
      const { error } = await supabase
        .from("households")
        .update({ name: householdName.trim() })
        .eq("id", householdId);

      if (error) throw error;
    } catch (err: any) {
      console.error("Error updating household name:", err);
      setError("Kunne ikke oppdatere husstandsnavn.");
    } finally {
      setNameSubmitting(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !householdId) return;

    setSubmitting(true);
    setError(null);

    try {
      // First, check if user exists to get their ID (optional for invitation model, but helpful)
      // Actually, we just insert into household_members with the email.
      // A trigger or background job could link the user_id if they already exist.

      const { error } = await supabase.from("household_members").insert({
        household_id: householdId,
        email: email.trim().toLowerCase(),
        role: "member",
      });

      if (error) {
        if (error.code === "23505") {
          throw new Error("Denne personen er allerede medlem.");
        }
        throw error;
      }

      setEmail("");
      fetchMembers();
    } catch (err: any) {
      console.error("Error adding member:", err);
      setError(err.message || "Kunne ikke invitere person.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (id: string, memberEmail: string) => {
    if (
      !confirm(
        `Er du sikker på at du vil fjerne ${memberEmail} fra husstanden?`,
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("household_members")
        .delete()
        .eq("id", id);

      if (error) throw error;
      fetchMembers();
    } catch (err: any) {
      console.error("Error removing member:", err);
      setError("Kunne ikke fjerne medlem.");
    }
  };

  if (loading) {
    return <div className="text-text-muted">Laster innstillinger...</div>;
  }

  if (!householdId) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-500">
        Fant ingen aktiv husstand. Vennligst logg ut og inn igjen for å
        initialisere din profil.
      </div>
    );
  }

  const isOwner = members.find((m) => m.user_id === userId)?.role === "owner";

  return (
    <div className="space-y-8">
      {isOwner && (
        <Card>
          <h2 className="text-text mb-4 text-xl font-semibold">
            Husstandsnavn
          </h2>
          <form
            onSubmit={handleUpdateHouseholdName}
            className="flex flex-col items-end gap-2 sm:flex-row sm:items-start"
          >
            <div className="flex w-full flex-1">
              <Input
                required
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                placeholder="Navn på husstanden"
              />
            </div>
            <Button
              type="submit"
              disabled={nameSubmitting}
              className="mt-2 w-full px-6 sm:mt-0 sm:w-auto"
            >
              {nameSubmitting ? "Lagrer..." : "Lagre navn"}
            </Button>
          </form>
        </Card>
      )}

      {invites.length > 0 && (
        <div className="border-primary/20 bg-primary/10 rounded-2xl border p-6 shadow-sm">
          <h2 className="text-text mb-4 text-xl font-semibold">
            Ventende invitasjoner
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
                    Godta og bytt
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Card>
        <h2 className="text-text mb-4 text-xl font-semibold">
          Inviter til din husstand
        </h2>
        <p className="text-text-muted mb-6">
          Medlemmer i din husstand deler nøyaktig samme oppskriftssamling,
          middagsplaner og handleliste. Alt skjer i sanntid!
        </p>

        <form
          onSubmit={handleAddMember}
          className="flex flex-col items-end gap-2 sm:flex-row sm:items-start"
        >
          <div className="flex w-full flex-1">
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-postadresse til den du vil invitere"
            />
          </div>
          <Button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full px-6 sm:mt-0 sm:w-auto"
          >
            {submitting ? "Inviterer..." : "Legg til i huset"}
          </Button>
        </form>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </Card>

      <Card>
        <h2 className="text-text mb-4 text-xl font-semibold">
          Medlemmer i husstanden
        </h2>

        <ul className="divide-border divide-y">
          {members.map((member) => (
            <li
              key={member.id}
              className="flex items-center justify-between py-4"
            >
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full">
                  <Icon icon="hugeicons:user-multiple" className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-text font-medium">{member.email}</p>
                    {member.role === "owner" && (
                      <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[10px] font-bold uppercase">
                        Eier
                      </span>
                    )}
                  </div>
                  <p className="text-text-muted text-xs">
                    Medlem siden{" "}
                    {new Date(member.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {member.role !== "owner" && (
                <Button
                  onClick={() => handleRemoveMember(member.id, member.email)}
                  variant="danger"
                  size="sm"
                  title="Fjern fra husstand"
                >
                  <Icon icon="hugeicons:delete-03" className="h-5 w-5" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
};
