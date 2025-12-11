const RE_REGEXP_STR = /^\/(.+)\/([a-z]*)$/u;
/**
 * Converts a query string to a RegExp.
 */
export function queryToRegExp(query: string): RegExp | null {
  const reParts = RE_REGEXP_STR.exec(query);
  if (!reParts) return null;
  try {
    const re = new RegExp(reParts[1], reParts[2]);
    return re;
  } catch {
    // ignore
  }
  return null;
}
