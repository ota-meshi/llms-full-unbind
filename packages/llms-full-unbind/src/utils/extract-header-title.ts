/**
 * Regular expression to match H1 headers
 */
const RE_H1_HEADER_PREFIX_LINE = /^#\s+/v;
/**
 * Regular expression to match headers
 */
const RE_HEADER_PREFIX_LINE = /^#+\s+/v;

/**
 * Extract title from H1 header line
 *
 * Parses lines like "# Title" or "# Title {#anchor-id}" (removes trailing attributes).
 * Supports VitePress-style anchor attributes in curly braces.
 *
 * @param line - A single line to parse
 * @returns The extracted title string, or null if line is not an H1 header
 */
export function extractH1Title(line: string): string | null {
  const trimmed = line.trim();
  const match = RE_H1_HEADER_PREFIX_LINE.exec(trimmed);
  if (!match) return null;
  let title = trimmed.slice(match[0].length).trim();
  // Remove trailing attributes like {#anchor-id}
  const attrIndex = title.lastIndexOf("{");
  if (attrIndex !== -1 && title.endsWith("}")) {
    title = title.slice(0, attrIndex).trim();
  }
  return title;
}

/**
 * Extract title from markdown header line (any level)
 *
 * Parses lines like "# Title", "## Title", "### Title", etc.
 * Removes trailing attributes in curly braces (e.g., {#anchor-id}).
 *
 * @param line - A single line to parse
 * @returns The extracted title string, or null if line is not a header
 */
export function extractHeaderTitle(line: string): string | null {
  const trimmed = line.trim();
  const match = RE_HEADER_PREFIX_LINE.exec(trimmed);
  if (!match) return null;
  let title = trimmed.slice(match[0].length).trim();
  // Remove trailing attributes like {#anchor-id}
  const attrIndex = title.lastIndexOf("{");
  if (attrIndex !== -1 && title.endsWith("}")) {
    title = title.slice(0, attrIndex).trim();
  }
  return title;
}
