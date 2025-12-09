/**
 * HTML tokenizer
 * Parses HTML-like content into tokens: tags, comments, CDATA, DOCTYPE, and text
 */

export type TokenRange = {
  start: number;
  end: number;
};

export type OpeningTagToken = {
  type: "openTag";
  name: string;
  selfClosing: false;
  attrs: Record<string, string | boolean>;
  range: TokenRange;
};
export type SelfClosingTagToken = {
  type: "openTag";
  name: string;
  selfClosing: true;
  attrs: Record<string, string | boolean>;
  range: TokenRange;
};
export type ClosingTagToken = {
  type: "closeTag";
  name: string;
  range: TokenRange;
};
export type CommentToken = { type: "comment"; range: TokenRange };
export type CDATAToken = { type: "cdata"; range: TokenRange };
export type DoctypeToken = { type: "doctype"; range: TokenRange };
export type TextToken = { type: "text"; range: TokenRange };
export type Token =
  | OpeningTagToken
  | SelfClosingTagToken
  | ClosingTagToken
  | CommentToken
  | CDATAToken
  | DoctypeToken
  | TextToken;

/**
 * Tokenize HTML-like content into tokens (generator)
 */
export function* tokenize(input: string): Generator<Token> {
  let pos = 0;
  let lastTokenEnd = 0;

  while (pos < input.length) {
    // Try to match a tag or special construct
    if (input[pos] === "<") {
      const token =
        parseOpeningTag(input, pos) ??
        parseClosingTag(input, pos) ??
        parseComment(input, pos) ??
        parseCdata(input, pos) ??
        parseDoctype(input, pos);
      if (token) {
        if (lastTokenEnd < token.range.start) {
          // Yield text token for content between last token and this token
          yield {
            type: "text",
            range: { start: lastTokenEnd, end: token.range.start },
          };
        }
        yield token;
        lastTokenEnd = token.range.end;
        pos = token.range.end;
        continue;
      }
    }
    // Move to next character
    pos++;
  }

  // Yield remaining text as text token if any
  if (lastTokenEnd < pos) {
    yield {
      type: "text",
      range: { start: lastTokenEnd, end: pos },
    };
  }
}

/**
 * Parse opening tag or self-closing tag from input at given position
 */
function parseOpeningTag(
  input: string,
  startPos: number,
): OpeningTagToken | SelfClosingTagToken | null {
  const reName = /[^\s!\/>]+/vy;
  reName.lastIndex = startPos + 1;
  const name = reName.exec(input)?.[0];
  if (name == null) return null;

  let pos = reName.lastIndex;

  const { attrs, nextIndex } = parseAttributes(input, pos);
  pos = nextIndex;

  // Check for self-closing
  let selfClosing = false;
  if (input.startsWith("/>", pos)) {
    selfClosing = true;
    pos += 2;
  } else if (input.startsWith(">", pos)) {
    pos += 1;
  } else {
    // Malformed tag
    return null;
  }

  return {
    type: "openTag",
    name,
    selfClosing,
    attrs,
    range: { start: startPos, end: pos },
  };
}

/**
 * Parse attributes from a string like 'title="foo" desc="bar"'
 */
function parseAttributes(
  input: string,
  startPos: number,
): { attrs: Record<string, string | boolean>; nextIndex: number } {
  const attrs: Record<string, string | boolean> = {};
  let pos = startPos;

  while (pos < input.length) {
    // Skip whitespace
    while (pos < input.length && /\s/v.test(input[pos])) pos++;
    if (pos >= input.length) break;

    // Parse attribute name
    const nameMatch = /^([\w\-:]+)/v.exec(input.slice(pos));
    if (!nameMatch) break;
    const name = nameMatch[1];
    pos += name.length;

    // Skip whitespace
    while (pos < input.length && /\s/v.test(input[pos])) pos++;

    // Check for '='
    if (input[pos] !== "=") {
      // Attribute without value
      attrs[name] = true;
      continue;
    }
    pos++; // Skip '='

    // Skip whitespace
    while (pos < input.length && /\s/v.test(input[pos])) pos++;

    // Parse attribute value (quoted)
    if (input[pos] === '"' || input[pos] === "'") {
      const end = input.indexOf(input[pos], pos + 1);
      if (end > -1) {
        const value = input.slice(pos + 1, end);
        attrs[name] = value;
        pos = end + 1;
        continue;
      }
    }

    // Unquoted attribute value (until whitespace, self closing, or end)
    let value = "";
    while (pos < input.length && !/[\s\/>]/v.test(input[pos])) {
      value += input[pos++];
    }
    attrs[name] = value;
  }

  return { attrs, nextIndex: pos };
}

/**
 * Parse closing tag token from input at given position
 */
function parseClosingTag(
  input: string,
  startPos: number,
): ClosingTagToken | null {
  if (!input.startsWith("</", startPos)) return null;
  const endPos = input.indexOf(">", startPos + 2);
  if (endPos < 0) return null;
  const tagName = input.slice(startPos + 2, endPos).trim();
  return {
    type: "closeTag",
    name: tagName,
    range: { start: startPos, end: endPos + 1 },
  };
}

/**
 * Parse comment token from input at given position
 */
function parseComment(input: string, startPos: number): CommentToken | null {
  if (!input.startsWith("<!--", startPos)) return null;
  const endPos = input.indexOf("-->", startPos + 4);
  if (endPos < 0) return null;
  return { type: "comment", range: { start: startPos, end: endPos + 3 } };
}

/**
 * Parse CDATA token from input at given position
 */
function parseCdata(input: string, startPos: number): CDATAToken | null {
  if (!/^<!\[cdata\[/iv.test(input.slice(startPos))) return null;
  const endPos = input.indexOf("]]>", startPos + 9);
  if (endPos < 0) return null;
  return { type: "cdata", range: { start: startPos, end: endPos + 3 } };
}

/**
 * Parse DOCTYPE token from input at given position
 */
function parseDoctype(input: string, startPos: number): DoctypeToken | null {
  if (!/^<!doctype/iv.test(input.slice(startPos))) return null;
  const endPos = input.indexOf(">", startPos + 9);
  if (endPos < 0) return null;
  return { type: "doctype", range: { start: startPos, end: endPos + 1 } };
}
