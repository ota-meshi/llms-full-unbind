import pkg from "../../package.json" with { type: "json" };
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod/v4";
import { SearchIndex } from "../search/search-index.ts";
import { queryToRegExp } from "../utils/query-to-regexp.ts";

const TOOL_READ_DOC = "read_doc";
const TOOL_SEARCH_DOC = "search_doc";

// Maximum number of search results to return
const SEARCH_LIMIT = 200;

export type LLMsFullUnbindMcpServerOptions = {
  llmsFullTxtURLs: string[];
};
/**
 * MCP Server for llms-full-unbind
 */
export class LLMsFullUnbindMcpServer {
  private readonly server: McpServer;

  private readonly searchIndex: SearchIndex;

  public constructor(options: LLMsFullUnbindMcpServerOptions) {
    this.server = new McpServer(
      {
        name: pkg.name,
        version: pkg.version,
        title: "llms-full-unbind MCP Server",
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      },
    );
    this.searchIndex = new SearchIndex(options);

    this.setupRequestHandlers();
  }

  /**
   * Set up request handlers
   */
  private setupRequestHandlers(): void {
    this.server.registerTool(
      TOOL_READ_DOC,
      {
        title: "Read Document",
        description: "Read the content of a document by its path or URL.",
        inputSchema: {
          path: z.string().describe("The path of the document."),
        },
        // outputSchema: z.string().describe("The content of the document."),
      },
      async (args) => {
        return await readDoc(args.path, this.searchIndex);
      },
    );
    this.server.registerTool(
      TOOL_SEARCH_DOC,
      {
        title: "Search Document",
        description: [
          "Search documents for a given query and return matching results.",
          "The search is case-insensitive and supports multiple words.",
          "The query can contain multiple words, and documents containing all words will be searched.",
          "The query can also be a valid single regular expression (JavaScript style). If using a full regular expression, enclose it in slashes and add flags as needed (e.g., `/pattern/i`).",
        ].join(" "),
        inputSchema: {
          query: z
            .string()
            .describe("The word to search for in the documents."),
        },
        outputSchema: {
          matches: z
            .array(
              z
                .object({
                  path: z
                    .string()
                    .describe("The path of the matching document."),
                  matchTerms: z
                    .array(z.string())
                    .describe("The matched terms in the document."),
                  score: z
                    .number()
                    .describe("The relevance score of the match."),
                })
                .describe("Search result object."),
            )
            .describe("List of search results."),
        },
      },
      async (args) => {
        return await searchDoc(args.query, this.searchIndex);
      },
    );
  }

  /**
   * Connect the server to a transport
   */
  public async connect(transport: Transport): Promise<void> {
    await this.server.connect(transport);
  }

  public close(): Promise<void> {
    return this.server.close();
  }
}

/**
 * Read a document by its path
 */
async function readDoc(pathName: string, searchIndex: SearchIndex) {
  try {
    const content = await searchIndex.getContent(pathName);
    if (content) {
      return {
        content: [
          {
            type: "text" as const,
            name: `Document: ${pathName}`,
            mimeType: "text/markdown",
            text: content,
          },
        ],
      };
    }
  } catch {
    // ignore
  }
  return {
    content: [
      {
        type: "text" as const,
        name: `Document: ${pathName}`,
        mimeType: "text/markdown",
        text: "No content found.",
      },
    ],
  };
}

/**
 * Search documents for a query
 */
async function searchDoc(query: string, searchIndex: SearchIndex) {
  const matches = await searchIndex.search(queryToRegExp(query) ?? query);

  const output = { matches: matches.slice(0, SEARCH_LIMIT) };
  return {
    content: [
      {
        type: "text" as const,
        mimeType: "application/json",
        text: JSON.stringify(output),
      },
    ],
    structuredContent: output,
  };
}
