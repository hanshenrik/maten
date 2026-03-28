/**
 * Splits an emoji from the start of a string.
 * Returns the emoji and the remaining text.
 */
export const splitEmojiFromName = (
  fullName: string,
): { emoji: string; name: string } => {
  if (!fullName) return { emoji: "", name: "" };

  // This regex matches an emoji at the start of the string followed by optional whitespace
  // \p{Emoji_Presentation} matches characters that are emojis by default
  // \p{Emoji}\uFE0F matches characters that become emojis when followed by the variation selector
  const match = fullName.match(
    /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)\s*(.*)$/u,
  );

  if (match) {
    return {
      emoji: match[1],
      name: match[2].trim(),
    };
  }

  return { emoji: "", name: fullName.trim() };
};

/**
 * Combines an emoji and a name into a single string.
 */
export const combineEmojiAndName = (emoji: string, name: string): string => {
  if (!emoji) return name.trim();
  if (!name) return emoji.trim();
  return `${emoji.trim()} ${name.trim()}`;
};
