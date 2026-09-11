import React, { Suspense, lazy } from "react";
import { cn } from "../../utils/cn";
import { Field, fieldClassName } from "./Field";
import type { RichTextEditorProps } from "./TipTapEditor";

// TipTap and tiptap-markdown weigh ~600 kB minified, so they get their own
// chunk instead of holding up hydration of the form around them.
const TipTapEditor = lazy(() =>
  import("./TipTapEditor").then(({ TipTapEditor }) => ({
    default: TipTapEditor,
  })),
);

/**
 * The same frame the editor renders into, so the form does not jump when the
 * editor chunk arrives. Mirrors the toolbar row and body height of TipTapEditor.
 */
const EditorSkeleton = ({ label }: { label?: string }) => (
  <Field label={label}>
    <div className={cn(fieldClassName, "overflow-hidden")}>
      {/* Same padding and text metrics as the real toolbar row */}
      <div className="border-border flex items-center gap-0.5 border-b px-2 py-1.5">
        <span className="px-1.5 py-1 text-sm">&nbsp;</span>
      </div>
      <div className="min-h-32" />
    </div>
  </Field>
);

/** A small markdown editor: bold, italic, headings and lists. */
export const RichTextEditor = (props: RichTextEditorProps) => (
  <Suspense fallback={<EditorSkeleton label={props.label} />}>
    <TipTapEditor {...props} />
  </Suspense>
);
