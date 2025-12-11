# llms-full-unbind-mcp

Model Context Protocol (MCP) server that exposes the [`llms-full-unbind`](https://github.com/ota-meshi/llms-full-unbind) parser as searchable MCP tools. It downloads one or more `llms-full.txt` files, indexes the pages, and serves them over the MCP standard transports.

## Quick Start

```bash
# Run against one or more llms-full.txt URLs
npx -y llms-full-unbind-mcp https://example.com/llms-full.txt https://another.example.com/llms-full.txt
```

The server speaks MCP over stdio, so it is ready to be wired into Claude or other MCP-compatible clients.

## Tools

- `read_doc`
  - Input: `{ path: string }`
  - Returns the markdown content of a single page by its indexed path/URL.
- `search_doc`
  - Input: `{ query: string }`
  - Performs full-text search across all indexed pages. The query can be plain text or a regex-style string (e.g. `/pattern/i`). Returns up to 200 scored matches with their paths and matched terms.

## CLI Options

Positional arguments only:

- `url` (required, multiple): one or more URLs pointing to `llms-full.txt` files to index.

Environment:

- Respects common proxy variables (`HTTPS_PROXY`, `HTTP_PROXY`, etc.) when fetching remote files.

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
