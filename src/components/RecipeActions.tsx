import React, { useState } from "react";
import { Icon } from "./ui/Icon";
import { Button } from "./ui/Button";
import { Dialog } from "./ui/Dialog";
import { ui } from "../utils/icons";

interface RecipeActionsProps {
  recipeId: string;
  isOwner: boolean;
  isPublic: boolean;
  initialIsSaved: boolean;
}

const GENERIC_ERROR = "Noe gikk galt. Prøv igjen.";

type Action = "save" | "remove";

/** Save a shared recipe to your own book, or remove it again. */
export const RecipeActions = ({
  recipeId,
  isOwner,
  isPublic,
  initialIsSaved,
}: RecipeActionsProps) => {
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [busy, setBusy] = useState<Action | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [confirmingRemove, setConfirmingRemove] = useState(false);

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
      setAlertMessage(GENERIC_ERROR);
    } finally {
      setBusy(null);
    }
  };

  const handleSave = () => call("save", "save", "POST", () => setIsSaved(true));

  const handleRemove = () =>
    call("remove", "save", "DELETE", () => setIsSaved(false));

  // Owners, and anyone looking at a private recipe, have nothing to save
  if (isOwner || !isPublic) return null;

  return (
    <>
      <div className="mb-8 flex flex-wrap gap-3">
        {isSaved ? (
          <Button
            variant="secondary"
            disabled={busy !== null}
            onClick={() => setConfirmingRemove(true)}
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
        )}
      </div>

      <Dialog
        open={confirmingRemove}
        onClose={() => setConfirmingRemove(false)}
        onConfirm={() => {
          setConfirmingRemove(false);
          handleRemove();
        }}
        confirmLabel="Fjern"
        confirmVariant="danger"
      >
        Er du sikker på at du vil fjerne denne oppskriften fra «Min
        oppskriftsbok»?
      </Dialog>

      <Dialog alert open={!!alertMessage} onClose={() => setAlertMessage(null)}>
        {alertMessage}
      </Dialog>
    </>
  );
};
