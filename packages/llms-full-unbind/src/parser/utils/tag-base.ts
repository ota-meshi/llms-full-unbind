import type { DetectResult, Page, StreamingParser } from "../../types.ts";
import type {
  ClosingTagToken,
  OpeningTagToken,
} from "../../utils/html-tokenize.ts";
import { tokenize } from "../../utils/html-tokenize.ts";

/**
 * Base class for tag-based streaming parsers
 * Provides shared logic for parsing `<doc>` and `<page>` tag formats
 */
export class TagBaseStreamingParser implements StreamingParser {
  /**
   * Detect if content contains matching tag-based format
   * @param lines - Array of lines to check
   * @param tagName - Tag name to detect (e.g., "doc", "page")
   * @returns "certain" if matching tag pairs found, "unknown" otherwise
   */
  public static detect(lines: string[], tagName: string): DetectResult {
    if (!lines.findLast((line) => line.includes(`</${tagName}`))) {
      // Does not contain a closing tag
      return "unknown";
    }
    const content = lines.join("\n");

    const openTags: OpeningTagToken[] = [];
    const closeTags: ClosingTagToken[] = [];
    for (const token of tokenize(content)) {
      if (token.type === "openTag" && token.name === tagName) {
        // Found opening tag
        if (!token.selfClosing) {
          openTags.push(token);
        }
      } else if (token.type === "closeTag" && token.name === tagName) {
        // Found closing tag
        closeTags.push(token);
      }
      if (openTags.length > 0 && openTags.length === closeTags.length) {
        return "certain";
      }
    }

    return "unknown";
  }

  private input = "";

  private readonly tagName: string;

  protected constructor(tagName: string) {
    this.tagName = tagName;
  }

  /**
   * Process final content in buffer
   */
  public *flush(): Generator<Page> {
    for (const { page } of this.processContent(this.input)) {
      yield page;
    }
  }

  /**
   * Append line to the buffer
   */
  public *appendLine(line: string): Generator<Page> {
    this.input += `${line}\n`;
    if (!line.includes(`</${this.tagName}`)) return;

    let nextIndex = 0;
    for (const processed of this.processContent(this.input)) {
      yield processed.page;
      nextIndex = processed.nextIndex;
    }
    this.input = this.input.slice(nextIndex);
  }

  /**
   * Process content and yield complete pages using tokenizer
   */
  private *processContent(
    input: string,
  ): Generator<{ page: Page; nextIndex: number }> {
    type OpenTagStack = {
      token: OpeningTagToken;
      parent?: OpenTagStack | null;
    };
    let openTagStack: OpenTagStack | null = null;
    for (const token of tokenize(input)) {
      if (
        token.type === "openTag" &&
        !token.selfClosing &&
        token.name === this.tagName
      ) {
        openTagStack = { token, parent: openTagStack };
      } else if (
        token.type === "closeTag" &&
        token.name === this.tagName &&
        openTagStack != null
      ) {
        if (openTagStack.parent == null) {
          // Found a complete tag with matching open and close tags
          const content = input
            .slice(openTagStack.token.range.end, token.range.start)
            .trim();
          yield {
            page: {
              title:
                typeof openTagStack.token.attrs.title === "string"
                  ? openTagStack.token.attrs.title
                  : null,
              content,
              metadata: openTagStack.token.attrs,
            },
            nextIndex: token.range.end,
          };
        }
        openTagStack = openTagStack.parent ?? null;
      }
    }
  }
}
