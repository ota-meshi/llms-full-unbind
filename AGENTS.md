# Agents.md

This file provides project guidelines for AI coding agents.

## Project Overview

`llms-full-unbind` is a specialized parser designed to extract pages from the `llms-full.txt` format. It programmatically unbinds monolithic `llms-full.txt` files into individual pages.

## Repository Structure

```text
llms-full-unbind/
├── packages/
│   ├── llms-full-unbind/           # Main package
│   │   ├── src/
│   │   │   ├── index.ts            # Entry point (exports unbind, unbindStream)
│   │   │   ├── types.ts            # Common type definitions (Page, StreamingParser)
│   │   │   ├── parser/
│   │   │   │   ├── doc-tag.ts                      # <doc> tag format parser
│   │   │   │   ├── page-tag.ts                     # <page> tag format parser
│   │   │   │   ├── h1.ts                           # H1 header format parser
│   │   │   │   ├── vitepress-plugin-llms.ts       # VitePress plugin format parser
│   │   │   │   ├── mintlify.ts                     # Mintlify format parser
│   │   │   │   └── utils/
│   │   │   │       └── tag-base.ts                 # Shared tag-based parser logic
│   │   │   └── utils/
│   │   │       ├── to-line.ts                      # String to lines conversion
│   │   │       ├── extract-header-title.ts         # Markdown header extraction
│   │   │       ├── iterate-md-lines.ts             # Iterate lines outside code blocks
│   │   │       └── html-tokenize.ts                # HTML tokenizer
│   │   ├── tests/
│   │   │   └── src/
│   │   │       ├── index.test.ts                   # Integration tests
│   │   │       ├── html-tokenize.test.ts           # Tokenizer tests
│   │   │       └── parser/
│   │   │           ├── doc-tag.test.ts             # <doc> tag format tests
│   │   │           ├── h1.test.ts                  # H1 header format tests (comprehensive)
│   │   │           ├── mintlify.test.ts            # Mintlify format tests
│   │   │           └── vitepress-plugin-llms.test.ts # VitePress plugin tests
│   │   ├── lib/                    # Build output
│   │   ├── tsdown.config.ts        # Build configuration
│   │   ├── package.json            # Package metadata
│   │   ├── tsconfig.json           # TypeScript configuration
│   │   ├── play.ts                 # Playground file
│   │   └── README.md               # Package documentation
│   └── llms-full-unbind-mcp/       # MCP server package
│       ├── src/
│       │   ├── cli.ts              # CLI entry (stdio MCP server)
│       │   ├── index.ts            # Package entry
│       │   ├── search/
│       │   │   └── search-index.ts # llms-full.txt indexing and search
│       │   ├── server/
│       │   │   └── index.ts        # MCP tool definitions
│       │   └── utils/
│       │       ├── fetch-body.ts   # Fetch helper with proxy support
│       │       └── query-to-regexp.ts # Parse regex-style queries
│       ├── tests/
│       │   └── src/
│       │       └── search-index.test.ts # Search index and query parser tests
│       ├── lib/                    # Build output
│       ├── tsdown.config.ts        # Build configuration
│       ├── package.json            # Package metadata
│       ├── tsconfig.json           # TypeScript configuration
│       └── README.md               # Package documentation
├── eslint.config.mjs               # ESLint configuration
├── tsconfig.json                   # Root TypeScript configuration
├── pnpm-workspace.yaml             # pnpm workspace configuration
├── pnpm-lock.yaml                  # Dependency lock file
├── package.json                    # Root package.json
├── renovate.json                   # Renovate configuration
├── AGENTS.md                       # AI agent guidelines
├── LICENSE                         # License file
└── README.md                       # Root documentation
```

## Tech Stack

- **Language**: TypeScript
- **Runtime**: Node.js >= 24.0.0
- **Package Manager**: pnpm
- **Build Tool**: tsdown
- **Test Framework**: Node.js built-in test runner (`node:test`)
- **Linter**: ESLint
- **Formatter**: Prettier
- **Release Management**: Changesets

## Key Commands

```bash
# Install dependencies
pnpm install

# Build
pnpm run build

# Run tests
pnpm run test

# Run tests with coverage
pnpm run cover

# Lint
pnpm run lint

# Lint with auto-fix
pnpm run eslint-fix

# Type check
pnpm run tsc
```

## Coding Conventions

### TypeScript

- Use ESM module format
- Maintain strict typing
- Document with JSDoc comments

### Testing

- Use `node:test` module
- Use `node:assert` for assertions
- Place test files in `tests/src/` directory
- Test file naming: `*.test.ts`

### Commits and Prs

- Use Changesets for version management
- Run `pnpm changeset` when adding changes

## API Overview

### `unbind(content: string): Iterable<Page>`

Parses a string synchronously and returns an iterable (Generator) of pages. Automatically detects the format. Use `Array.from(unbind(content))` to get an array.

### `unbindStream(stream: ReadableStream | AsyncIterable): AsyncIterable<Page>`

Accepts a Web `ReadableStream` or AsyncIterable and yields parsed pages sequentially. Recommended for large files. Automatically detects the format.

### `Page` Interface

```typescript
interface Page {
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
}
```

## Supported Formats

### `<doc>` Tag Based Format

Wraps each page in a `<doc>` tag with optional attributes.
Generated by the [`llms_txt2ctx`](https://llmstxt.org/) CLI from the llms-txt package.
Used by [fastht.ml](https://fastht.ml/docs/llms-ctx-full.txt) and similar projects.

```markdown
<doc title="Page Title" desc="Optional description">
Content of the page...
</doc>
```

### `<page>` Tag Based Format

Wraps each page in a `<page>` tag.
Used by [cloudflare.com](https://developers.cloudflare.com/llms-full.txt).

```markdown
<page>
Content of the page...
</page>
```

### H1 Header Based Format

Pages are separated by H1 headers (`# Title`).
Used by projects like [svelte.dev](https://svelte.dev/llms-full.txt), [nuxt.com](https://nuxt.com/llms-full.txt), and [docs.astro.build](https://docs.astro.build/llms-full.txt).

```markdown
# Page Title

Content of the page...

# Another Page

More content...
```

### VitePress Plugin Format (`vitepress-plugin-llms`)

Generated by [`vitepress-plugin-llms`](https://github.com/okineadev/vitepress-plugin-llms).
Used by [vuejs.org](https://vuejs.org/llms-full.txt) and similar VitePress-based projects.

- [vuejs.org](https://vuejs.org/llms-full.txt)
- [vitejs.dev](https://vitejs.dev/llms-full.txt)
- [vitepress.dev](https://vitepress.dev/llms-full.txt)

<!-- prettier-ignore-start -->

```markdown
# Page Title {#optional-anchor}

Content of the page...

---
url: /optional/metadata.md
---

# Another Page

More content...
```

<!-- prettier-ignore-end -->

### Mintlify Format

Generated by [Mintlify](https://www.mintlify.com/docs/ai/llmstxt).
Used by [modelcontextprotocol.io](https://modelcontextprotocol.io/llms-full.txt) and similar Mintlify-based projects.

- [modelcontextprotocol.io](https://modelcontextprotocol.io/llms-full.txt)
- [bun.sh](https://bun.sh/llms-full.txt)

<!-- prettier-ignore-start -->

```markdown
# Page Title
Source: https://example.com/path/to/page

Content of the page...

# Another Page
Source: https://example.com/path/to/another

More content...
```

<!-- prettier-ignore-end -->

## Architecture

The codebase is organized by format type with shared parsing utilities:

- **`types.ts`**: Shared interfaces (`Page`, `StreamingParser`)
- **`parser/doc-tag.ts`**: Parser for `<doc>` tag format with streaming support
- **`parser/page-tag.ts`**: Parser for `<page>` tag format with streaming support
- **`parser/h1.ts`**: Parser for H1 header-based format with streaming support
- **`parser/vitepress-plugin-llms.ts`**: Parser for frontmatter-separated format with streaming support
- **`parser/mintlify.ts`**: Parser for header + source URL format with streaming support
- **`parser/utils/tag-base.ts`**: Shared logic for tag-based parsers (doc-tag, page-tag)
- **`utils/tokenize.ts`**: HTML tokenizer for parsing tag-based formats
- **`utils/extract-header-title.ts`**: Markdown header extraction utilities
- **`utils/iterate-md-lines.ts`**: Markdown line iteration with code block awareness
- **`utils/to-line.ts`**: String to lines conversion utilities
- **`index.ts`**: Entry point with format auto-detection and public API

## Notes

- Run tests before building to verify functionality
- Add corresponding tests when adding new features
- Ensure no ESLint errors before committing
- Parser detection logic prioritizes "certain" matches over "potential" matches
- HTML tokenizer supports tag attributes, comments, CDATA, and DOCTYPE declarations
- All parsers implement the `StreamingParser` interface for consistent streaming behavior

## MCP Server Package (`llms-full-unbind-mcp`)

The MCP (Model Context Protocol) server provides integration with Claude and other AI tools. It exposes the llms-full-unbind parser as MCP tools.

### Features

- **parse_llms_txt**: Tool to parse llms-full.txt files and extract individual pages
- Supports all formats that the main package supports
- StdIO transport for seamless integration

### Usage

```bash
# Build the MCP server
pnpm --filter llms-full-unbind-mcp run build

# Use in Claude configuration
# Add to your Claude config pointing to the built lib/index.js
```

## Maintaining This File

**IMPORTANT**: After completing any task that changes the project structure, adds new features, or establishes new patterns, you MUST update this `AGENTS.md` file before finishing. This includes:

- Adding/removing/renaming files or directories → Update "Repository Structure"
- Adding new API functions or types → Update "API Overview"
- Supporting new formats → Update "Supported Formats"
- Changing architecture or module organization → Update "Architecture"
- Discovering new conventions or gotchas → Add to relevant section or "Notes"

Keeping this document accurate and comprehensive improves the efficiency of all future development work.
