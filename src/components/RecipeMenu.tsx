import React, { useState } from "react";
import { DotMenu, dotMenuSeparator, type DotMenuEntry } from "./ui/DotMenu";
import { Dialog } from "./ui/Dialog";
import { supabase } from "../lib/supabase";
import { errorMessage } from "../utils/errors";
import { ui } from "../utils/icons";

interface RecipeMenuProps {
  recipeId: string;
  isOwner: boolean;
}

/** An action waiting for the user to say yes in the confirmation dialog */
interface PendingAction {
  message: string;
  confirmLabel: string;
  danger?: boolean;
  run: () => void;
}

const GENERIC_ERROR = "Noe gikk galt. Prøv igjen.";

/** The secondary actions for a recipe: edit or delete it, or copy it into your own book. */
export const RecipeMenu = ({ recipeId, isOwner }: RecipeMenuProps) => {
  const [cloning, setCloning] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);

  const handleClone = () =>
    setPending({
      message:
        "Vil du lage en kopi av denne oppskriften? Den havner i «Min oppskriftsbok» som en ny, uavhengig oppskrift.",
      confirmLabel: "Lag en kopi",
      run: clone,
    });

  const clone = async () => {
    setCloning(true);
    try {
      const res = await fetch(`/api/recipes/${recipeId}/clone`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(GENERIC_ERROR);
      const { id } = await res.json();
      window.location.href = `/recipes/${id}`;
    } catch {
      setAlertMessage(GENERIC_ERROR);
      setCloning(false);
    }
  };

  const handleDelete = () =>
    setPending({
      message: "Er du helt sikker på at du vil slette denne godbiten?",
      confirmLabel: "Slett",
      danger: true,
      run: deleteRecipe,
    });

  const deleteRecipe = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("recipes")
        .delete()
        .eq("id", recipeId);
      if (error) throw error;

      window.location.href = "/recipes";
    } catch (err) {
      console.error("Feil ved sletting av oppskrift:", err);
      setAlertMessage(
        `Vi klarte dessverre ikke å slette oppskriften: ${errorMessage(err)}`,
      );
      setDeleting(false);
    }
  };

  const busy = cloning || deleting;

  const items: DotMenuEntry[] = [
    ...(isOwner
      ? [{ label: "Endre", icon: ui.edit, href: `/recipes/${recipeId}/edit` }]
      : []),
    {
      label: cloning ? "Kopierer …" : "Lag en kopi",
      icon: ui.copy,
      onClick: handleClone,
      disabled: busy,
    },
    ...(isOwner
      ? [
          dotMenuSeparator,
          {
            label: deleting ? "Sletter …" : "Slett",
            icon: ui.delete,
            onClick: handleDelete,
            variant: "danger" as const,
            disabled: busy,
          },
        ]
      : []),
  ];

  return (
    <>
      <DotMenu items={items} label="Flere valg for oppskriften" />

      <Dialog
        open={!!pending}
        onClose={() => setPending(null)}
        onConfirm={() => {
          pending?.run();
          setPending(null);
        }}
        confirmLabel={pending?.confirmLabel}
        confirmVariant={pending?.danger ? "danger" : "primary"}
      >
        {pending?.message}
      </Dialog>

      <Dialog alert open={!!alertMessage} onClose={() => setAlertMessage(null)}>
        {alertMessage}
      </Dialog>
    </>
  );
};
