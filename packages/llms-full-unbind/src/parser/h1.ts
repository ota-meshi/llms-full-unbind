/**
 * H1 Streaming Parser
 *
 * Parses content where each page starts with an H1 header (`# Title`).
 * Used by various markdown-based formats.
 *
 * For examples:
 * - https://svelte.dev/llms-full.txt
 * - https://nuxt.com/llms-full.txt
 * - https://docs.astro.build/llms-full.txt
 */
import {
  extractH1Title,
  extractHeaderTitle,
} from "../utils/extract-header-title.ts";
import type { Page, StreamingParser } from "../types.ts";
import { VitepressPluginLlmsStreamingParser } from "./vitepress-plugin-llms.ts";
import { MintlifyStreamingParser } from "./mintlify.ts";
import { LlmsTxt2ctxStreamingParser } from "./llms-txt2ctx.ts";
import { iterateMarkdownLinesWithoutCodeBlocks } from "../utils/iterate-md-lines.ts";

export class H1StreamingParser implements StreamingParser {
  private readonly bufferLines: string[] = [];

  /**
   * Detect if the current lines match the format
   * @param lines - Array of lines to check
   * @returns True if the lines match the format
   */
  public static detect(lines: string[]): "certain" | "maybe" | "no" {
    let h1Count = 0;
    let otherHeaderCount = 0;
    for (const { line } of iterateMarkdownLinesWithoutCodeBlocks(lines)) {
      if (extractH1Title(line) != null) {
        h1Count++;
      } else if (extractHeaderTitle(line) != null) {
        otherHeaderCount++;
      }
      if (h1Count >= 2) {
        if (
          otherHeaderCount > 30 &&
          VitepressPluginLlmsStreamingParser.detect(lines) === "no" &&
          MintlifyStreamingParser.detect(lines) === "no" &&
          LlmsTxt2ctxStreamingParser.detect(lines) === "no"
        ) {
          // If there are too many other headers, and no other parser matches, it will assume it's H1 style.
          return "certain";
        }
        return "maybe";
      }
    }
    if (h1Count > 0) {
      return "maybe";
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
    for (const { line, index } of iterateMarkdownLinesWithoutCodeBlocks(
      this.bufferLines,
    )) {
      if (extractH1Title(line) != null) {
        count++;
        if (count >= 2) {
          separatorIndex = index;
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
