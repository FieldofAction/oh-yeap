/* Decides whether a data value may render as an eyebrow.
 * The rule (see src/styles/eyebrow.css): one word, or a date.
 * Returns the trimmed text when it qualifies, otherwise null, so callers
 * render the eyebrow only when the data earns it and leave the field intact.
 */
const ONE_WORD = /^\S+$/;
const DATE = /^(\d{4}|[A-Za-z]{3,9}\.?\s\d{4}|\d{4}\s?[–-]\s?\d{4})$/;

export function eyebrowWord(value) {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text) return null;
  return ONE_WORD.test(text) || DATE.test(text) ? text : null;
}
