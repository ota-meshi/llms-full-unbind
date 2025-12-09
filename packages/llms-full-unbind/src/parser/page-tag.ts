/**
 * `<page>` tag based format parser
 *
 * Parses the `<page>` tag based format: `<page>content</page>`
 * Used by cloudflare.com project.
 *
 * For example: https://developers.cloudflare.com/llms-full.txt
 */

import { TagBaseStreamingParser } from "./utils/tag-base.ts";

/**
 * Streaming parser for <page> tag based format using tokenizer
 */
export class PageTagStreamingParser extends TagBaseStreamingParser {
  /**
   * Detect if the content matches <page> tag based format
   */
  public static detect(lines: string[]): "certain" | "maybe" | "no" {
    return TagBaseStreamingParser.detect(lines, "page");
  }

  public constructor() {
    super("page");
  }
}
