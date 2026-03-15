import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Icon } from "@iconify/react";

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

  const handleAcceptInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from("household_members")
        .update({ user_id: userId })
        .eq("id", inviteId);

      if (error) throw error;

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
    return <div className="text-gray-500">Laster innstillinger...</div>;
  }

  if (!householdId) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
        Fant ingen aktiv husstand. Vennligst logg ut og inn igjen for å
        initialisere din profil.
      </div>
    );
  }

  const isOwner = members.find((m) => m.user_id === userId)?.role === "owner";

  return (
    <div className="space-y-8">
      {isOwner && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Husstandsnavn
          </h2>
          <form onSubmit={handleUpdateHouseholdName} className="flex gap-2">
            <input
              type="text"
              required
              value={householdName}
              onChange={(e) => setHouseholdName(e.target.value)}
              placeholder="Navn på husstanden"
              className="flex-1 rounded-xl border border-gray-300 px-4 py-3 transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={nameSubmitting}
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition-all hover:bg-blue-700 disabled:opacity-50"
            >
              {nameSubmitting ? "Lagrer..." : "Lagre navn"}
            </button>
          </form>
        </div>
      )}

      {invites.length > 0 && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-blue-900">
            Ventende invitasjoner
          </h2>
          <ul className="space-y-4">
            {invites.map((invite) => (
              <li
                key={invite.id}
                className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    Du har blitt invitert til:
                  </p>
                  <p className="text-lg font-bold text-blue-700">
                    {invite.households?.name || "En husstand"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRefuseInvite(invite.id)}
                    className="rounded-lg border border-gray-200 bg-white px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 hover:text-red-600"
                  >
                    Avvis
                  </button>
                  <button
                    onClick={() => handleAcceptInvite(invite.id)}
                    className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
                  >
                    Godta og bytt
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Inviter til din husstand
        </h2>
        <p className="mb-6 text-gray-600">
          Medlemmer i din husstand deler nøyaktig samme oppskriftssamling,
          middagsplaner og handleliste. Alt skjer i sanntid!
        </p>

        <form onSubmit={handleAddMember} className="flex gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-postadresse til den du vil invitere"
            className="flex-1 rounded-xl border border-gray-300 px-4 py-3 transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition-all hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Inviterer..." : "Legg til i huset"}
          </button>
        </form>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Medlemmer i husstanden
        </h2>

        <ul className="divide-y divide-gray-100">
          {members.map((member) => (
            <li
              key={member.id}
              className="flex items-center justify-between py-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <Icon icon="hugeicons:user-multiple" className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{member.email}</p>
                    {member.role === "owner" && (
                      <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700 uppercase">
                        Eier
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Medlem siden{" "}
                    {new Date(member.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {member.role !== "owner" && (
                <button
                  onClick={() => handleRemoveMember(member.id, member.email)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  title="Fjern fra husstand"
                >
                  <Icon icon="hugeicons:delete-03" className="h-5 w-5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
