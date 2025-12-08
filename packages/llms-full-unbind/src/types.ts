/**
 * Represents a single page extracted from llms-full.txt
 */
export interface Page {
  /** The title of the page */
  title: string | null;
  /** The extracted text content */
  content: string;
  /** Optional metadata from the page */
  metadata: Record<string, unknown>;
}

/**
 * Interface for streaming parsers
 */
export interface StreamingParser {
  /**
   * Append line to the buffer and yield any completed pages
   */
  appendLine(line: string): Generator<Page>;

  /**
   * Flush remaining content (optional)
   */
  flush?(): Iterable<Page>;
}
