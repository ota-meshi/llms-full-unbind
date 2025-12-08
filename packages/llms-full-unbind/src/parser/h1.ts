import { extractH1Title } from "../utils/extract-header-title.ts";
import type { Page, StreamingParser } from "../types.ts";

export class H1StreamingParser implements StreamingParser {
  private readonly bufferLines: string[] = [];

  /**
   * Detect if the current lines match the format
   * @param lines - Array of lines to check
   * @returns True if the lines match the format
   */
  public static detect(lines: string[]): "certain" | "maybe" | "no" {
    for (let index = lines.length - 1; index >= 0; index--) {
      const line = lines[index];
      if (extractH1Title(line) != null) {
        return "maybe";
      }
    }
    return "no";
  }

  /**
   * Process final content in buffer
   */
  public *flush(): Generator<Page> {
    yield* extractPages(this.bufferLines);
    this.bufferLines.length = 0;
  }

  /**
   * Append line to the buffer
   */
  public appendLine(line: string): Generator<Page> {
    this.bufferLines.push(line);
    return this.processBuffer();
  }

  /**
   * Process the buffer and return complete pages
   */
  private *processBuffer(): Generator<Page> {
    let separatorIndex: number | null = null;
    let count = 0;
    for (let i = 0; i < this.bufferLines.length; i++) {
      const line = this.bufferLines[i];
      if (extractH1Title(line) != null) {
        count++;
        if (count >= 2) {
          separatorIndex = i;
          break;
        }
      }
    }
    if (separatorIndex == null) return;

    // Extract lines up to the last separator
    const lines = this.bufferLines.splice(0, separatorIndex);
    yield* extractPages(lines);
  }
}

/**
 * Extract pages from lines
 */
function* extractPages(lines: string[]): Generator<Page> {
  const contents: string[] = [];
  for (const element of lines) {
    const headerTitle = extractH1Title(element);
    if (headerTitle != null) {
      // Remove starting empty lines
      while (contents.length > 0 && !contents[0].trim()) {
        contents.shift();
      }
      const content = contents.join("\n").trim();
      if (content) {
        yield {
          title: extractH1Title(contents[0]),
          content,
          metadata: {},
        };
      }
      contents.length = 0;
    }
  }
  // Remove starting empty lines
  while (contents.length > 0 && !contents[0].trim()) {
    contents.shift();
  }
  const content = contents.join("\n").trim();
  if (content) {
    yield {
      title: extractH1Title(contents[0]),
      content,
      metadata: {},
    };
  }
}
