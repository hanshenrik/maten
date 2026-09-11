import React, { useState, useRef, useEffect, useId } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import { Icon } from "../ui/Icon";
import { cn } from "../../utils/cn";
import { ui } from "../../utils/icons";
import { Field, fieldClassName } from "./Field";

// --- Toolbar primitives ---

const toolbarItemClassName = (active?: boolean) =>
  cn(
    "rounded-lg px-1.5 py-1 text-sm font-medium transition-colors",
    active
      ? "bg-primary/10 text-primary"
      : "text-text-muted hover:bg-primary/5 hover:text-text",
  );

const ToolbarButton = ({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    title={title}
    aria-pressed={active}
    // mousedown + preventDefault keeps the editor selection intact
    onMouseDown={(e) => {
      e.preventDefault();
      onClick();
    }}
    className={cn("min-w-[28px]", toolbarItemClassName(active))}
  >
    {children}
  </button>
);

const Divider = () => <div className="bg-border mx-1 h-5 w-px self-center" />;

function Dropdown({
  label,
  title,
  active,
  children,
}: {
  label: React.ReactNode;
  title: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        title={title}
        aria-haspopup="menu"
        aria-expanded={open}
        onMouseDown={(e) => {
          e.preventDefault();
          setOpen((v) => !v);
        }}
        className={cn(
          "flex items-center gap-0.5",
          toolbarItemClassName(active),
        )}
      >
        {label}
        <Icon icon={ui.chevronDown} className="h-3 w-3 opacity-50" />
      </button>
      {open && (
        <div
          role="menu"
          className="border-border bg-surface absolute top-full left-0 z-50 mt-1 min-w-36 overflow-hidden rounded-xl border shadow-lg"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

const DropdownItem = ({
  onClick,
  active,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    role="menuitemradio"
    aria-checked={active}
    onMouseDown={(e) => {
      e.preventDefault();
      onClick();
    }}
    className={cn(
      "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm whitespace-nowrap transition-colors",
      active
        ? "bg-primary/10 text-primary font-medium"
        : "text-text hover:bg-primary/5",
    )}
  >
    {active && <Icon icon={ui.checked} className="h-3.5 w-3.5 shrink-0" />}
    <span className={active ? "" : "ml-[22px]"}>{children}</span>
  </button>
);

// --- Heading dropdown ---

const HEADINGS = [
  { level: 1, label: "Overskrift 1", className: "text-base font-bold" },
  { level: 2, label: "Overskrift 2", className: "text-sm font-bold" },
  { level: 3, label: "Overskrift 3", className: "text-xs font-bold" },
  {
    level: 4,
    label: "Overskrift 4",
    className: "text-xs font-semibold text-text-muted",
  },
] as const;

function HeadingDropdown({ editor }: { editor: Editor | null }) {
  const active = HEADINGS.find(({ level }) =>
    editor?.isActive("heading", { level }),
  );

  return (
    <Dropdown
      title="Overskrift"
      label={
        <span className="font-bold">{active ? `H${active.level}` : "H"}</span>
      }
      active={!!active}
    >
      {HEADINGS.map(({ level, label, className }) => (
        <DropdownItem
          key={level}
          onClick={() => editor?.chain().focus().toggleHeading({ level }).run()}
          active={active?.level === level}
        >
          <span className={className}>{label}</span>
        </DropdownItem>
      ))}
    </Dropdown>
  );
}

// --- List dropdown ---

function ListDropdown({ editor }: { editor: Editor | null }) {
  const isBullet = editor?.isActive("bulletList") ?? false;
  const isOrdered = editor?.isActive("orderedList") ?? false;

  return (
    <Dropdown
      title="Liste"
      label={<Icon icon={ui.bulletList} className="h-4 w-4" />}
      active={isBullet || isOrdered}
    >
      <DropdownItem
        onClick={() => editor?.chain().focus().toggleBulletList().run()}
        active={isBullet}
      >
        <span className="flex items-center gap-2">
          <Icon icon={ui.bulletList} className="h-4 w-4" /> Punktliste
        </span>
      </DropdownItem>
      <DropdownItem
        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        active={isOrdered}
      >
        <span className="flex items-center gap-2">
          <Icon icon={ui.numberedList} className="h-4 w-4" /> Nummerert liste
        </span>
      </DropdownItem>
    </Dropdown>
  );
}

// --- Editor ---

interface RichTextEditorProps {
  id?: string;
  label?: string;
  /** Markdown */
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
}

/** A small markdown editor: bold, italic, headings and lists. */
export const RichTextEditor = ({
  id,
  label,
  value,
  onChange,
  placeholder,
}: RichTextEditorProps) => {
  const generatedId = useId();
  const editorId = id ?? generatedId;

  const editor = useEditor({
    extensions: [StarterKit, Markdown],
    content: value,
    // Rendered on the server too, so wait for the client to create the editor
    immediatelyRender: false,
    // The toolbar reflects the selection, so it has to follow every change
    shouldRerenderOnTransaction: true,
    onUpdate: ({ editor }) => {
      onChange(editor.storage.markdown.getMarkdown());
    },
    editorProps: {
      attributes: {
        id: editorId,
        class:
          "prose prose-sm prose-emerald text-text max-w-none px-4 py-3 min-h-32 outline-none",
      },
    },
  });

  return (
    <Field htmlFor={editorId} label={label}>
      <div
        className={cn(
          fieldClassName,
          "focus-within:ring-primary overflow-hidden focus-within:border-transparent focus-within:ring-2",
        )}
      >
        <div
          role="toolbar"
          aria-label="Formatering"
          className="border-border flex flex-wrap items-center gap-0.5 border-b px-2 py-1.5"
        >
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleBold().run()}
            active={editor?.isActive("bold")}
            title="Fet (Ctrl+B)"
          >
            <strong>B</strong>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            active={editor?.isActive("italic")}
            title="Kursiv (Ctrl+I)"
          >
            <em>I</em>
          </ToolbarButton>
          <Divider />
          <HeadingDropdown editor={editor} />
          <ListDropdown editor={editor} />
        </div>
        <div className="relative">
          {editor && editor.isEmpty && placeholder && (
            <div
              aria-hidden
              className="text-text-muted pointer-events-none absolute top-0 left-0 px-4 py-3 text-sm"
            >
              {placeholder}
            </div>
          )}
          <EditorContent editor={editor} />
        </div>
      </div>
    </Field>
  );
};
