import "@tiptap/core";

/** tiptap-markdown adds a storage entry but ships no types for it. */
declare module "@tiptap/core" {
  interface Storage {
    markdown: {
      getMarkdown(): string;
    };
  }
}
