import React, { useState } from "react";
import { Icon } from "./ui/Icon";
import { Button } from "./ui/Button";
import { ui } from "../utils/icons";

interface RecipeActionsProps {
  recipeId: string;
  isOwner: boolean;
  isPublic: boolean;
  initialIsSaved: boolean;
}

const GENERIC_ERROR = "Noe gikk galt. Prøv igjen.";

type Action = "save" | "remove" | "clone";

/** Save a shared recipe to your own book, remove it again, or copy it. */
export const RecipeActions = ({
  recipeId,
  isOwner,
  isPublic,
  initialIsSaved,
}: RecipeActionsProps) => {
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [busy, setBusy] = useState<Action | null>(null);

  const call = async (
    action: Action,
    path: string,
    method: "POST" | "DELETE",
    onOk: (data: { id?: string }) => void,
  ) => {
    setBusy(action);
    try {
      const res = await fetch(`/api/recipes/${recipeId}/${path}`, { method });
      if (!res.ok) throw new Error(GENERIC_ERROR);
      onOk(await res.json().catch(() => ({})));
    } catch {
      alert(GENERIC_ERROR);
    } finally {
      setBusy(null);
    }
  };

  const handleSave = () => call("save", "save", "POST", () => setIsSaved(true));

  const handleRemove = () => {
    if (
      !confirm(
        "Er du sikker på at du vil fjerne denne oppskriften fra «Min oppskriftsbok»?",
      )
    )
      return;
    call("remove", "save", "DELETE", () => setIsSaved(false));
  };

  const handleClone = () => {
    if (
      !confirm(
        "Vil du lage en kopi av denne oppskriften? Den havner i «Min oppskriftsbok» som en ny, uavhengig oppskrift.",
      )
    )
      return;
    call("clone", "clone", "POST", (data) => {
      window.location.href = `/recipes/${data.id}`;
    });
  };

  return (
    <div className="mb-8 flex flex-wrap gap-3">
      {!isOwner &&
        isPublic &&
        (isSaved ? (
          <Button
            variant="secondary"
            disabled={busy !== null}
            onClick={handleRemove}
            className="gap-2"
          >
            <Icon icon={ui.delete} className="h-5 w-5" />
            {busy === "remove" ? "Fjerner..." : "Fjern fra Min oppskriftsbok"}
          </Button>
        ) : (
          <Button
            variant="secondary"
            disabled={busy !== null}
            onClick={handleSave}
            className="gap-2"
          >
            <Icon icon={ui.add} className="h-5 w-5" />
            {busy === "save" ? "Lagrer..." : "Legg til i Min oppskriftsbok"}
          </Button>
        ))}

      <Button
        variant="secondary"
        disabled={busy !== null}
        onClick={handleClone}
        className="gap-2"
      >
        <Icon icon={ui.copy} className="h-5 w-5" />
        {busy === "clone" ? "Kopierer..." : "Lag en kopi"}
      </Button>
    </div>
  );
};
