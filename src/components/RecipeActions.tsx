import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { Button } from "./ui/Button";
import { ui } from "../utils/icons";

interface RecipeActionsProps {
  recipeId: string;
  isOwner: boolean;
  isPublic: boolean;
  initialIsSaved: boolean;
}

export const RecipeActions: React.FC<RecipeActionsProps> = ({
  recipeId,
  isOwner,
  isPublic,
  initialIsSaved,
}) => {
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [cloning, setCloning] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/recipes/${recipeId}/save`, {
        method: "POST",
      });
      if (res.ok) {
        setIsSaved(true);
      } else {
        alert("Noe gikk galt. Prøv igjen.");
      }
    } catch {
      alert("Noe gikk galt. Prøv igjen.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (
      !confirm(
        "Er du sikker på at du vil fjerne denne oppskriften fra «Min oppskriftsbok»?",
      )
    )
      return;

    setRemoving(true);
    try {
      const res = await fetch(`/api/recipes/${recipeId}/save`, {
        method: "DELETE",
      });
      if (res.ok) {
        setIsSaved(false);
      } else {
        alert("Noe gikk galt. Prøv igjen.");
      }
    } catch {
      alert("Noe gikk galt. Prøv igjen.");
    } finally {
      setRemoving(false);
    }
  };

  const handleClone = async () => {
    if (
      !confirm(
        "Vil du lage en kopi av denne oppskriften? Den havner i «Min oppskriftsbok» som en ny, uavhengig oppskrift.",
      )
    )
      return;

    setCloning(true);
    try {
      const res = await fetch(`/api/recipes/${recipeId}/clone`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        window.location.href = `/recipes/${data.id}`;
      } else {
        alert("Noe gikk galt. Prøv igjen.");
      }
    } catch {
      alert("Noe gikk galt. Prøv igjen.");
    } finally {
      setCloning(false);
    }
  };

  return (
    <div className="mb-8 flex flex-wrap gap-3">
      {!isOwner && isPublic && (
        <>
          {isSaved ? (
            <Button
              variant="secondary"
              disabled={removing}
              onClick={handleRemove}
              className="flex items-center gap-2"
            >
              <Icon icon={ui.delete} className="h-5 w-5" />
              <span>
                {removing ? "Fjerner..." : "Fjern fra Min oppskriftsbok"}
              </span>
            </Button>
          ) : (
            <Button
              variant="secondary"
              disabled={saving}
              onClick={handleSave}
              className="flex items-center gap-2"
            >
              <Icon icon={ui.add} className="h-5 w-5" />
              <span>
                {saving ? "Lagrer..." : "Legg til i Min oppskriftsbok"}
              </span>
            </Button>
          )}
        </>
      )}

      <Button
        variant="secondary"
        disabled={cloning}
        onClick={handleClone}
        className="flex items-center gap-2"
      >
        <Icon icon={ui.copy} className="h-5 w-5" />
        <span>{cloning ? "Kopierer..." : "Lag en kopi"}</span>
      </Button>
    </div>
  );
};
