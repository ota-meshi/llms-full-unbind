import * as gunshi from "gunshi";
import pkg from "../../package.json" with { type: "json" };
import { LLMsFullUnbindMcpServer } from "../server/index.ts";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const defined = gunshi.define({
  name: pkg.name,
  description: pkg.description,
  toKebab: true, // Apply to all arguments,
  args: {
    url: {
      type: "positional",
      description: "URLs to `llms-full.txt` files",
      multiple: true,
      required: true,
    },
  },
  run: async (options) => {
    const server = new LLMsFullUnbindMcpServer({
      llmsFullTxtURLs: options.values.url,
    });

    const transport = new StdioServerTransport();
    await server.connect(transport);

    log("LLMs Full Unbind MCP Server started successfully");
  },
});

export const command: gunshi.Command = defined;

/**
 * Run the CLI
 */
export async function runCli(): Promise<void> {
  await gunshi.cli(process.argv.slice(2), defined, {
    //
    // The MCP server will cause an error if it outputs anything other than MCP information to standard output,
    // so it will be disabled.
    //
    // name: pkg.name,
    // version: pkg.version
  });
}

/**
 * Logs a message with the package name as a prefix.
 * @param {string} message - The message to log.
 */
function log(message: string) {
  // Note: do not use console.log() because stdout is part of the server transport
  // eslint-disable-next-line no-console -- Ignore
  console.error(`[${pkg.name}] ${message}`);
}
