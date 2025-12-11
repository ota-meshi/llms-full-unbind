/**
 * H1 header-based format tests
 *
 * Tests for H1 header-based format: `# Title` followed by content
 * Used by projects like https://svelte.dev/llms-full.txt
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { unbind, unbindStream, type Page } from "../../../src/index.ts";

/**
 * Helper function to create a ReadableStream from a string
 */
function stringToStream(
  str: string,
  chunkSize = 10,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  let offset = 0;

  return new ReadableStream({
    pull(controller) {
      if (offset >= bytes.length) {
        controller.close();
        return;
      }

      const chunk = bytes.slice(offset, offset + chunkSize);
      offset += chunkSize;
      controller.enqueue(chunk);
    },
  });
}

describe("unbind (H1 header format)", () => {
  it("should parse multiple pages with H1 headers", () => {
    const content = `# First Page

Content of first page.

# Second Page

Content of second page.

# Third Page

Content of third page.`;
    const pages = Array.from(unbind(content));

    assert.strictEqual(pages.length, 3);
    assert.strictEqual(pages[0].title, "First Page");
    assert.strictEqual(pages[1].title, "Second Page");
    assert.strictEqual(pages[2].title, "Third Page");
    assert.ok(pages[0].content.includes("First Page"));
    assert.ok(pages[1].content.includes("Second Page"));
    assert.ok(pages[2].content.includes("Third Page"));
  });

  it("should handle H1 headers with special characters", () => {
    const content = `# Page with (Parentheses) & Special-Chars_Here

Content here.

# Second Page

More content.`;
    const pages = Array.from(unbind(content));

    assert.strictEqual(pages.length, 2);
    assert.ok(pages[0].title?.includes("Parentheses"));
    assert.ok(pages[0].title?.includes("Special-Chars_Here"));
  });

  it("should handle H1 headers with markdown symbols", () => {
    const content = `# \`Code\` in **Title**

Some content.

# Another Title

More content.`;
    const pages = Array.from(unbind(content));

    assert.strictEqual(pages.length, 2);
    assert.ok(pages[0].title?.includes("Code"));
  });

  it("should handle H1 headers with anchor links (VitePress style)", () => {
    const content = `# Page Title {#custom-anchor}

Content here.

# Another Page {#another-id}

More content here.`;
    const pages = Array.from(unbind(content));

    assert.strictEqual(pages.length, 2);
    assert.strictEqual(pages[0].title, "Page Title");
    assert.strictEqual(pages[1].title, "Another Page");
  });

  it("should preserve H2 and H3 headers in content", () => {
    const content = `# Main Page

## Section 1

Content here.

### Subsection 1.1

More content.

# Another Page

## Different Section

Other content.`;
    const pages = Array.from(unbind(content));

    assert.strictEqual(pages.length, 2);
    assert.ok(pages[0].content.includes("## Section 1"));
    assert.ok(pages[0].content.includes("### Subsection 1.1"));
    assert.ok(pages[1].content.includes("## Different Section"));
  });

  it("should handle pages with code blocks", () => {
    const content = `# Programming Guide

Here's some code:

\`\`\`typescript
const x = 1;
function example() {
  return x;
}
\`\`\`

More text after code.

# Another Guide

Different code:

\`\`\`python
x = 1
\`\`\`

Final text.`;
    const pages = Array.from(unbind(content));

    assert.strictEqual(pages.length, 2);
    assert.ok(pages[0].content.includes("```typescript"));
    assert.ok(pages[0].content.includes("const x = 1;"));
    assert.ok(pages[1].content.includes("python"));
  });

  it("should handle multiple code blocks in one page", () => {
    const content = `# Multi-Block Example

First code:

\`\`\`javascript
const a = 1;
\`\`\`

Text between.

\`\`\`javascript
const b = 2;
\`\`\`

Last code block.

# Next Page

Some content.`;
    const pages = Array.from(unbind(content));

    assert.strictEqual(pages.length, 2);
    assert.ok(pages[0].content.includes("const a = 1;"));
    assert.ok(pages[0].content.includes("const b = 2;"));
  });

  it("should handle pages with lists", () => {
    const content = `# List Example

- Item 1
- Item 2
  - Nested item
- Item 3

1. First
2. Second
3. Third

# Another Page

More content.`;
    const pages = Array.from(unbind(content));

    assert.strictEqual(pages.length, 2);
    assert.ok(pages[0].content.includes("- Item 1"));
    assert.ok(pages[0].content.includes("1. First"));
  });

  it("should handle pages with tables", () => {
    const content = `# Table Example

| Column 1 | Column 2 |
|----------|----------|
| Value 1  | Value 2  |
| Value 3  | Value 4  |

# Another Page

Content.`;
    const pages = Array.from(unbind(content));

    assert.strictEqual(pages.length, 2);
    assert.ok(pages[0].content.includes("| Column 1"));
  });

  it("should handle empty lines between pages", () => {
    const content = `# Page 1

Content 1.


# Page 2

Content 2.


# Page 3

Content 3.`;
    const pages = Array.from(unbind(content));

    assert.strictEqual(pages.length, 3);
    assert.strictEqual(pages[0].title, "Page 1");
    assert.strictEqual(pages[1].title, "Page 2");
    assert.strictEqual(pages[2].title, "Page 3");
  });

  it("should handle inline HTML", () => {
    const content = `# HTML Example

This has <span>inline HTML</span> content.

# Another Example

More <b>bold</b> text.`;
    const pages = Array.from(unbind(content));

    assert.strictEqual(pages.length, 2);
    assert.ok(pages[0].content.includes("<span>"));
    assert.ok(pages[1].content.includes("<b>"));
  });

  it("should handle content with URLs", () => {
    const content = `# Links Example

Check out https://example.com for more info.

[Link Text](https://example.com)

# More Links

See https://another.com here.`;
    const pages = Array.from(unbind(content));

    assert.strictEqual(pages.length, 2);
    assert.ok(pages[0].content.includes("https://example.com"));
    assert.ok(pages[0].content.includes("[Link Text]"));
    assert.ok(pages[1].content.includes("https://another.com"));
  });

  it("should handle pages without trailing newline", () => {
    const content = `# First Page

Content of first page.

# Last Page

Final content without newline`;
    const pages = Array.from(unbind(content));

    assert.strictEqual(pages.length, 2);
    assert.strictEqual(pages[0].title, "First Page");
    assert.strictEqual(pages[1].title, "Last Page");
  });

  it("should handle H1 format with four pages", () => {
    const content = `# Page 1

Content 1.

# Page 2

Content 2.

# Page 3

Content 3.

# Page 4

Content 4.`;
    const pages = Array.from(unbind(content));

    assert.strictEqual(pages.length, 4);
    for (let i = 0; i < 4; i++) {
      assert.strictEqual(pages[i].title, `Page ${i + 1}`);
    }
  });

  it("should handle H1 headers with numbers in title", () => {
    const content = `# Version 1.0 API

First page about v1.0.

# Version 2.0 API

Second page about v2.0.`;
    const pages = Array.from(unbind(content));

    assert.strictEqual(pages.length, 2);
    assert.ok(pages[0].title?.includes("1.0"));
    assert.ok(pages[1].title?.includes("2.0"));
  });

  it("should handle single page with H1 header", () => {
    const content = `# Only Page

This is the only page in the document.`;
    const pages = Array.from(unbind(content));

    assert.strictEqual(pages.length, 1);
    assert.strictEqual(pages[0].title, "Only Page");
  });
});

describe("unbindStream (H1 header format)", () => {
  it("should stream parse H1 format with multiple pages", async () => {
    const content = `# First Page

Content of first.

# Second Page

Content of second.`;
    const stream = stringToStream(content);
    const pages: Page[] = [];

    for await (const page of unbindStream(stream)) {
      pages.push(page);
    }

    assert.strictEqual(pages.length, 2);
    assert.strictEqual(pages[0].title, "First Page");
    assert.strictEqual(pages[1].title, "Second Page");
  });

  it("should produce same results as unbind for H1 format", async () => {
    const content = `# Page 1

First content with **bold** text.

# Page 2

Second content with \`code\`.

# Page 3

Third content.`;
    const syncPages = Array.from(unbind(content));
    const streamPages: Page[] = [];

    for await (const page of unbindStream(stringToStream(content))) {
      streamPages.push(page);
    }

    assert.strictEqual(streamPages.length, syncPages.length);
    for (let i = 0; i < syncPages.length; i++) {
      assert.strictEqual(streamPages[i].title, syncPages[i].title);
      assert.strictEqual(streamPages[i].content, syncPages[i].content);
    }
  });

  it("should handle small chunks for H1 format", async () => {
    const content = `# Page

Some content here.

# Second Page

More content.`;
    const stream = stringToStream(content, 5); // Very small chunks
    const pages: Page[] = [];

    for await (const page of unbindStream(stream)) {
      pages.push(page);
    }

    assert.strictEqual(pages.length, 2);
    assert.strictEqual(pages[0].title, "Page");
  });

  it("should handle multiple pages with streaming", async () => {
    const content = `# Page 1

Content 1.

# Page 2

Content 2.

# Page 3

Content 3.

# Page 4

Content 4.`;
    const stream = stringToStream(content);
    const pages: Page[] = [];

    for await (const page of unbindStream(stream)) {
      pages.push(page);
    }

    assert.strictEqual(pages.length, 4);
    for (let i = 1; i <= 4; i++) {
      assert.strictEqual(pages[i - 1].title, `Page ${i}`);
    }
  });

  it("should handle code blocks during streaming", async () => {
    const content = `# Code Example

\`\`\`javascript
function test() {
  return true;
}
\`\`\`

# Another Page

More content.`;
    const stream = stringToStream(content);
    const pages: Page[] = [];

    for await (const page of unbindStream(stream)) {
      pages.push(page);
    }

    assert.strictEqual(pages.length, 2);
    assert.ok(pages[0].content.includes("function test()"));
  });

  it("should stream large content efficiently", async () => {
    const pagesArray = Array.from(
      { length: 10 },
      (_, i) => `# Page ${i + 1}\n\nContent ${i + 1}.`,
    );
    const content = pagesArray.join("\n\n");
    const stream = stringToStream(content);
    const pages: Page[] = [];

    for await (const page of unbindStream(stream)) {
      pages.push(page);
    }

    assert.strictEqual(pages.length, 10);
    assert.strictEqual(pages[0].title, "Page 1");
    assert.strictEqual(pages[9].title, "Page 10");
  });
});

describe("format detection (H1 header)", () => {
  it("should detect H1 format with multiple pages", () => {
    const content = `# Page 1

Content.

# Page 2

More content.`;
    const pages = Array.from(unbind(content));

    assert.strictEqual(pages.length, 2);
    assert.ok(pages.every((p) => p.title));
  });

  it("should detect H1 format even without title attribute", () => {
    const content = `# Markdown Header

Content without structured format.

# Another Section

More content.`;
    const pages = Array.from(unbind(content));

    assert.strictEqual(pages.length, 2);
    assert.strictEqual(pages[0].title, "Markdown Header");
    assert.strictEqual(pages[1].title, "Another Section");
  });

  it("should handle mixed content with multiple H1s and H2s", () => {
    const content = `# Main Topic

## Subsection 1
Content.

## Subsection 2
More content.

# Another Topic

## Different subsection
Final content.`;
    const pages = Array.from(unbind(content));

    assert.strictEqual(pages.length, 2);
    assert.ok(pages[0].content.includes("## Subsection 1"));
    assert.ok(pages[1].content.includes("## Different subsection"));
  });

  it("should handle content with many H2 headers and no other format markers", () => {
    const content = `# Getting Started

## Introduction

Some intro text.

## Setup

Setup instructions.

# Advanced Usage

## Configuration

Advanced config.

## Troubleshooting

Common issues.`;
    const pages = Array.from(unbind(content));

    assert.strictEqual(pages.length, 2);
    assert.strictEqual(pages[0].title, "Getting Started");
    assert.strictEqual(pages[1].title, "Advanced Usage");
  });

  it("should maintain metadata as empty object for H1 format", () => {
    const content = `# Page 1

Content.

# Page 2

More content.`;
    const pages = Array.from(unbind(content));

    assert.deepStrictEqual(pages[0].metadata, {});
    assert.deepStrictEqual(pages[1].metadata, {});
  });
});
