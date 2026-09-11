import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { errorMessage } from "../utils/errors";
import { ui } from "../utils/icons";
import { DotMenu, dotMenuSeparator, type DotMenuEntry } from "./ui/DotMenu";
import { Dialog } from "./ui/Dialog";

interface PlanMenuProps {
  planId: string;
  /** The edit and copy links. The list leaves them out, the plan itself has them */
  withLinks?: boolean;
  /** Where to go once the plan is gone. Defaults to reloading the page */
  afterDelete?: string;
  className?: string;
}

/** The actions for one meal plan: edit or copy it, or delete it for good. */
export const PlanMenu = ({
  planId,
  withLinks = false,
  afterDelete,
  className,
}: PlanMenuProps) => {
  const [deleting, setDeleting] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const deletePlan = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("meal_plans")
        .delete()
        .eq("id", planId);
      if (error) throw error;

      // The pages are rendered on the server, so ask again without the plan
      if (afterDelete) window.location.href = afterDelete;
      else window.location.reload();
    } catch (err) {
      console.error("Feil ved sletting av meny:", err);
      setAlertMessage(`Feil ved sletting: ${errorMessage(err)}`);
      setDeleting(false);
    }
  };

  const items: DotMenuEntry[] = [
    ...(withLinks
      ? [
          { label: "Endre", icon: ui.edit, href: `/plans/${planId}/edit` },
          {
            label: "Lag kopi",
            icon: ui.copy,
            href: `/plans/new?copyFrom=${planId}`,
          },
          dotMenuSeparator,
        ]
      : []),
    {
      label: deleting ? "Sletter …" : "Slett meny",
      icon: ui.delete,
      onClick: () => setConfirmingDelete(true),
      variant: "danger",
      disabled: deleting,
    },
  ];

  return (
    <>
      <DotMenu
        items={items}
        label="Flere valg for menyen"
        className={className}
      />

      <Dialog
        open={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        onConfirm={() => {
          setConfirmingDelete(false);
          deletePlan();
        }}
        confirmLabel="Slett"
        confirmVariant="danger"
      >
        Er du helt sikker på at du vil slette denne menyen?
      </Dialog>

      <Dialog alert open={!!alertMessage} onClose={() => setAlertMessage(null)}>
        {alertMessage}
      </Dialog>
    </>
  );
};
