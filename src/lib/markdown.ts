import { Marked, type Tokens } from "marked";

/**
 * Recipes are shared between households, so their markdown is untrusted.
 * marked passes raw HTML straight through and doesn't check link schemes, so
 * we escape any HTML the author typed and drop links to anything that isn't a
 * web page or an e-mail address. Everything our editor produces survives.
 */

const escapeHtml = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const SAFE_URL = /^(https?:|mailto:|\/|#|\.\/|\.\.\/)/i;

const safeUrl = (href: string | null | undefined): string | null => {
  const trimmed = (href ?? "").trim();
  if (!trimmed) return null;
  // Relative and fragment links don't have a scheme; anything else must be
  // http(s) or mailto. Control characters could smuggle a scheme past the
  // regex, so strip those first.
  const cleaned = trimmed.replace(/[\u0000-\u001f\u007f]/g, "");
  return SAFE_URL.test(cleaned) || !/^[a-z][a-z0-9+.-]*:/i.test(cleaned)
    ? escapeHtml(cleaned)
    : null;
};

const renderer = new Marked({
  gfm: true,
  breaks: true,
  renderer: {
    html({ text }: Tokens.HTML | Tokens.Tag) {
      return escapeHtml(text);
    },
    link({ href, title, tokens }: Tokens.Link) {
      const url = safeUrl(href);
      const text = this.parser.parseInline(tokens);
      if (!url) return text;
      const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
      return `<a href="${url}"${titleAttr} rel="noopener noreferrer">${text}</a>`;
    },
    image({ href, title, text }: Tokens.Image) {
      const url = safeUrl(href);
      if (!url) return escapeHtml(text);
      const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
      return `<img src="${url}" alt="${escapeHtml(text)}"${titleAttr} loading="lazy" />`;
    },
  },
});

/** Markdown to HTML that is safe to inject with `set:html`. */
export function renderMarkdown(markdown: string | null | undefined): string {
  if (!markdown) return "";
  return renderer.parse(markdown, { async: false });
}

/**
 * A plain text version of some markdown, for previews and meta descriptions.
 * Rendering and then stripping tags is the simplest way to be sure every
 * kind of markup is gone.
 */
export function markdownToPlainText(
  markdown: string | null | undefined,
): string {
  if (!markdown) return "";
  return renderMarkdown(markdown)
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}
