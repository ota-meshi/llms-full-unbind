/**
 * Represents a single page extracted from llms-full.txt
 */
export interface Page {
  /** The title of the page */
  title: string;
  /** The extracted text content */
  content: string;
  /** Optional metadata from the page */
  metadata?: Record<string, unknown>;
}

/**
 * Format type for llms-full.txt files
 */
export type Format = "llms-txt2ctx" | "vitepress-plugin-llms" | "mintlify";

/**
 * Interface for streaming parsers
 */
export interface StreamingParser {
  /**
   * Process the buffer and return complete pages
   */
  processBuffer(): Generator<Page>;

  /**
   * Append data to the buffer
   */
  append(data: string): void;

  /**
   * Flush remaining content (optional)
   */
  flush?(): Generator<Page>;
}
