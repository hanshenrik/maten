import React, { useState, useRef, useEffect } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import { Icon } from "@iconify/react";

// --- Primitives ---

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
    onMouseDown={(e) => {
      e.preventDefault();
      onClick();
    }}
    className={`min-w-[28px] rounded-lg px-1.5 py-1 text-sm font-medium transition-colors ${
      active
        ? "bg-primary/10 text-primary"
        : "text-text-muted hover:bg-primary/5 hover:text-text"
    }`}
  >
    {children}
  </button>
);

const Divider = () => <div className="bg-border mx-1 h-5 w-px self-center" />;

function Dropdown({
  label,
  active,
  children,
}: {
  label: React.ReactNode;
  active?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          setOpen((v) => !v);
        }}
        className={`flex items-center gap-0.5 rounded-lg px-1.5 py-1 text-sm font-medium transition-colors ${
          active
            ? "bg-primary/10 text-primary"
            : "text-text-muted hover:bg-primary/5 hover:text-text"
        }`}
      >
        {label}
        <Icon icon="hugeicons:arrow-down-01" className="h-3 w-3 opacity-50" />
      </button>
      {open && (
        <div
          className="border-border bg-surface absolute top-full left-0 z-50 mt-1 min-w-36 overflow-hidden rounded-xl border shadow-lg"
          onMouseDown={(e) => e.preventDefault()}
        >
          <div onClick={() => setOpen(false)}>{children}</div>
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
    onMouseDown={(e) => {
      e.preventDefault();
      onClick();
    }}
    className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm whitespace-nowrap transition-colors ${
      active
        ? "bg-primary/10 text-primary font-medium"
        : "text-text hover:bg-primary/5"
    }`}
  >
    {active && (
      <Icon icon="hugeicons:tick-01" className="h-3.5 w-3.5 shrink-0" />
    )}
    <span className={active ? "" : "ml-[22px]"}>{children}</span>
  </button>
);

// --- Heading dropdown ---

const HEADING_LEVELS = [1, 2, 3, 4] as const;

const headingLabel: Record<number, string> = {
  1: "Overskrift 1",
  2: "Overskrift 2",
  3: "Overskrift 3",
  4: "Overskrift 4",
};

const headingClass: Record<number, string> = {
  1: "text-base font-bold",
  2: "text-sm font-bold",
  3: "text-xs font-bold",
  4: "text-xs font-semibold text-text-muted",
};

function HeadingDropdown({ editor }: { editor: Editor | null }) {
  const activeLevel = HEADING_LEVELS.find((l) =>
    editor?.isActive("heading", { level: l }),
  );
  const isActive = activeLevel !== undefined;

  return (
    <Dropdown
      label={
        <span className="font-bold">{isActive ? `H${activeLevel}` : "H"}</span>
      }
      active={isActive}
    >
      {HEADING_LEVELS.map((level) => (
        <DropdownItem
          key={level}
          onClick={() => editor?.chain().focus().toggleHeading({ level }).run()}
          active={editor?.isActive("heading", { level }) ?? false}
        >
          <span className={headingClass[level]}>{headingLabel[level]}</span>
        </DropdownItem>
      ))}
    </Dropdown>
  );
}

// --- List dropdown ---

function ListDropdown({ editor }: { editor: Editor | null }) {
  const isBullet = editor?.isActive("bulletList") ?? false;
  const isOrdered = editor?.isActive("orderedList") ?? false;
  const isActive = isBullet || isOrdered;

  return (
    <Dropdown
      label={
        <Icon icon="hugeicons:left-to-right-list-bullet" className="h-4 w-4" />
      }
      active={isActive}
    >
      <DropdownItem
        onClick={() => editor?.chain().focus().toggleBulletList().run()}
        active={isBullet}
      >
        <span className="flex items-center gap-2">
          <Icon
            icon="hugeicons:left-to-right-list-bullet"
            className="h-4 w-4"
          />{" "}
          Punktliste
        </span>
      </DropdownItem>
      <DropdownItem
        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        active={isOrdered}
      >
        <span className="flex items-center gap-2">
          <Icon
            icon="hugeicons:left-to-right-list-number"
            className="h-4 w-4"
          />{" "}
          Numrert liste
        </span>
      </DropdownItem>
    </Dropdown>
  );
}

// --- Editor ---

type RichTextEditorProps = {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export const RichTextEditor = ({
  id,
  label,
  value,
  onChange,
  placeholder,
}: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [StarterKit, Markdown],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.storage.markdown.getMarkdown());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm prose-emerald text-text max-w-none px-4 py-3 min-h-32 outline-none",
      },
    },
  });

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-text mb-1 text-sm font-medium">
          {label}
        </label>
      )}
      <div className="border-border bg-surface focus-within:ring-primary overflow-hidden rounded-xl border transition-all focus-within:border-transparent focus-within:ring-2">
        <div className="border-border flex flex-wrap items-center gap-0.5 border-b px-2 py-1.5">
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
        {!editor?.getText() && placeholder && (
          <div className="text-text-muted pointer-events-none px-4 py-3 text-sm">
            {placeholder}
          </div>
        )}
        <EditorContent id={id} editor={editor} />
      </div>
    </div>
  );
};
