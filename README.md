# llms-full-unbind

A specialized monorepo for parsing and extracting pages from `llms-full.txt` files. Automatically detects and supports multiple documentation formats including `<doc>` tags, `<page>` tags, VitePress, `Source:`, and H1 headers formats.

## Features

- 🔍 **Automatic Format Detection**: Intelligently detects the format of your `llms-full.txt` file
- 📄 **Multiple Format Support**: Handles 5+ popular documentation formats
- ⚡ **Streaming Support**: Process large files efficiently with async streaming
- 🔗 **MCP Integration**: Includes Model Context Protocol server for AI integration

## Packages

- [`llms-full-unbind`](./packages/llms-full-unbind): Core parsing library with `unbind` and `unbindStream` functions
- [`llms-full-unbind-mcp`](./packages/llms-full-unbind-mcp): MCP server for Claude and other AI tools integration

## License

MIT
