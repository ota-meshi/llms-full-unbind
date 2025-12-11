# llms-full-unbind-mcp

This is a Model Context Protocol (MCP) server that uses the [`llms-full-unbind`](https://github.com/ota-meshi/llms-full-unbind) parser to split `llms-full.txt` files into individual pages and provide per-page information in response to AI requests.
It downloads one or more `llms-full.txt` files, indexes the pages, and serves them over the MCP standard transports.

## Quick Start

```bash
# Run with one or more llms-full.txt URLs
npx -y llms-full-unbind-mcp https://example.com/llms-full.txt https://another.example.com/llms-full.txt
```

The server speaks the MCP protocol over stdio, so it can be connected directly to Claude or any other MCP-compatible client.

## Provided Tools

- `read_doc`
  - Input: `{ path: string }`
  - Returns the Markdown content of a single page specified by the indexed path/URL.
- `search_doc`
  - Input: `{ query: string }`
  - Performs full-text search across all pages. Queries can be plain text or regular expressions (e.g., `/pattern/i`). Returns up to 200 results with scores, paths, and matched terms.

## CLI Options

CLI Usage:

<!-- CLI-USAGE-START -->

> llms-full-unbind-mcp v0.1.3

- USAGE:
  - llms-full-unbind-mcp `<OPTIONS>` `<url>`

- ARGUMENTS:
  - url ... URLs to `llms-full.txt` files

- OPTIONS:
  - -h, --help ... Display this help message
  - -v, --version ... Display this version

<!-- CLI-USAGE-END -->

Environment variables:

- When fetching remote files, standard proxy variables such as `HTTPS_PROXY` and `HTTP_PROXY` are supported.

## Development

```bash
pnpm install
pnpm run lint
pnpm run type-check
pnpm run build
pnpm run test
```

## License

MIT
