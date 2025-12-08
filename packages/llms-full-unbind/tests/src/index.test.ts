import assert from "node:assert";
import { describe, it } from "node:test";
import { unbind, unbindStream, type Page } from "../../src/index.ts";

describe("unbind", () => {
  it("should parse a single doc tag", () => {
    const content = `<doc title="Test Title" desc="Test Description">Test Content</doc>`;
    const pages = unbind(content);

    assert.strictEqual(pages.length, 1);
    assert.strictEqual(pages[0].title, "Test Title");
    assert.strictEqual(pages[0].content, "Test Content");
    assert.deepStrictEqual(pages[0].metadata, {
      description: "Test Description",
    });
  });

  it("should parse multiple doc tags", () => {
    const content = `
<doc title="First" desc="First desc">First content</doc>
<doc title="Second" desc="Second desc">Second content</doc>
<doc title="Third">Third content without desc</doc>
`;
    const pages = unbind(content);

    assert.strictEqual(pages.length, 3);
    assert.strictEqual(pages[0].title, "First");
    assert.strictEqual(pages[1].title, "Second");
    assert.strictEqual(pages[2].title, "Third");
    assert.strictEqual(pages[2].metadata, undefined);
  });

  it("should handle empty content", () => {
    const pages = unbind("");
    assert.strictEqual(pages.length, 0);
  });

  it("should handle content without doc tags", () => {
    const content = "This is just plain text without any doc tags.";
    const pages = unbind(content);
    assert.strictEqual(pages.length, 0);
  });

  it("should trim whitespace from content", () => {
    const content = `<doc title="Test">
    
    Content with whitespace
    
</doc>`;
    const pages = unbind(content);

    assert.strictEqual(pages.length, 1);
    assert.strictEqual(pages[0].content, "Content with whitespace");
  });

  it("should parse doc tags with only title attribute", () => {
    const content = `<doc title="Only Title">Content here</doc>`;
    const pages = unbind(content);

    assert.strictEqual(pages.length, 1);
    assert.strictEqual(pages[0].title, "Only Title");
    assert.strictEqual(pages[0].content, "Content here");
    assert.strictEqual(pages[0].metadata, undefined);
  });

  it("should handle multiline content", () => {
    const content = `<doc title="Multiline" desc="Has multiple lines">
# Header

Some paragraph text.

\`\`\`javascript
const x = 1;
\`\`\`

More text.
</doc>`;
    const pages = unbind(content);

    assert.strictEqual(pages.length, 1);
    assert.ok(pages[0].content.includes("# Header"));
    assert.ok(pages[0].content.includes("```javascript"));
  });

  it("should handle special characters in content", () => {
    const content = `<doc title="Special Chars" desc="Contains &lt; and &gt;">Content with <code> tags and special chars: &amp;</doc>`;
    const pages = unbind(content);

    assert.strictEqual(pages.length, 1);
    assert.ok(pages[0].content.includes("<code>"));
  });
});

describe("unbindStream", () => {
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

  /**
   * Helper function to create an AsyncIterable from a string
   */
  async function* stringToAsyncIterable(
    str: string,
    chunkSize = 10,
  ): AsyncIterable<Uint8Array> {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);

    for (let i = 0; i < bytes.length; i += chunkSize) {
      // Add a small delay to make it truly async
      await Promise.resolve();
      yield bytes.slice(i, i + chunkSize);
    }
  }

  it("should parse a single doc tag from stream", async () => {
    const content = `<doc title="Stream Test" desc="Stream Description">Stream Content</doc>`;
    const pages: Page[] = [];

    for await (const page of unbindStream(stringToStream(content))) {
      pages.push(page);
    }

    assert.strictEqual(pages.length, 1);
    assert.strictEqual(pages[0].title, "Stream Test");
    assert.strictEqual(pages[0].content, "Stream Content");
  });

  it("should parse multiple doc tags from stream", async () => {
    const content = `
<doc title="First" desc="First desc">First content</doc>
<doc title="Second">Second content</doc>
`;
    const pages: Page[] = [];

    for await (const page of unbindStream(stringToStream(content))) {
      pages.push(page);
    }

    assert.strictEqual(pages.length, 2);
    assert.strictEqual(pages[0].title, "First");
    assert.strictEqual(pages[1].title, "Second");
  });

  it("should work with AsyncIterable input", async () => {
    const content = `<doc title="Async Test">Async Content</doc>`;
    const pages: Page[] = [];

    for await (const page of unbindStream(stringToAsyncIterable(content))) {
      pages.push(page);
    }

    assert.strictEqual(pages.length, 1);
    assert.strictEqual(pages[0].title, "Async Test");
  });

  it("should handle small chunks correctly", async () => {
    const content = `<doc title="Small Chunks" desc="Testing">Content here</doc>`;
    const pages: Page[] = [];

    // Use very small chunk size (1 byte)
    for await (const page of unbindStream(stringToStream(content, 1))) {
      pages.push(page);
    }

    assert.strictEqual(pages.length, 1);
    assert.strictEqual(pages[0].title, "Small Chunks");
    assert.strictEqual(pages[0].content, "Content here");
  });

  it("should handle large chunks correctly", async () => {
    const content = `<doc title="Large Chunks">Large content test</doc>`;
    const pages: Page[] = [];

    // Use chunk size larger than content
    for await (const page of unbindStream(stringToStream(content, 1000))) {
      pages.push(page);
    }

    assert.strictEqual(pages.length, 1);
    assert.strictEqual(pages[0].title, "Large Chunks");
  });

  it("should yield pages as soon as they are complete", async () => {
    const content = `<doc title="First">First</doc><doc title="Second">Second</doc>`;
    const pages: Page[] = [];

    for await (const page of unbindStream(stringToStream(content, 5))) {
      pages.push(page);
    }

    assert.strictEqual(pages.length, 2);
  });

  it("should handle empty stream", async () => {
    const pages: Page[] = [];

    for await (const page of unbindStream(stringToStream(""))) {
      pages.push(page);
    }

    assert.strictEqual(pages.length, 0);
  });

  it("should produce same results as unbind", async () => {
    const content = `
<doc title="Title 1" desc="Desc 1">Content 1</doc>
Some text in between
<doc title="Title 2" desc="Desc 2">Content 2</doc>
`;

    const syncPages = unbind(content);
    const streamPages: Page[] = [];

    for await (const page of unbindStream(stringToStream(content))) {
      streamPages.push(page);
    }

    assert.strictEqual(syncPages.length, streamPages.length);
    for (let i = 0; i < syncPages.length; i++) {
      assert.strictEqual(syncPages[i].title, streamPages[i].title);
      assert.strictEqual(syncPages[i].content, streamPages[i].content);
      assert.deepStrictEqual(syncPages[i].metadata, streamPages[i].metadata);
    }
  });
});

describe("Real-world format", () => {
  it("should parse llms-full.txt style content", () => {
    const content = `<docs>
<doc title="FastHTML concise guide" desc="A brief overview of idiomatic FastHTML apps"># Concise reference

## About FastHTML

FastHTML is a library for building web applications.</doc>
<doc title="HTMX reference" desc="Brief description of HTMX">## Contents

* htmx Core Attributes
* htmx CSS Classes</doc>
</docs>`;

    const pages = unbind(content);

    assert.strictEqual(pages.length, 2);
    assert.strictEqual(pages[0].title, "FastHTML concise guide");
    assert.ok(pages[0].content.includes("# Concise reference"));
    assert.strictEqual(pages[1].title, "HTMX reference");
    assert.ok(pages[1].content.includes("## Contents"));
  });

  it("should handle content with code blocks containing angle brackets", () => {
    const content = `<doc title="Code Example" desc="Has code">
\`\`\`html
<div class="container">
  <p>Hello</p>
</div>
\`\`\`
</doc>`;

    const pages = unbind(content);

    assert.strictEqual(pages.length, 1);
    assert.ok(pages[0].content.includes('<div class="container">'));
  });
});

describe("VueJS llms-full.txt format", () => {
  it("should parse markdown-separator format", () => {
    const content = `# Introduction {#introduction}

Vue.js is a progressive JavaScript framework.

## Getting Started

Start building with Vue.

---

# Components Basics {#components-basics}

Components are reusable Vue instances.

## Defining a Component

Here's how to define a component.

---

# Reactivity

Vue's reactivity system.`;

    const pages = unbind(content);

    assert.strictEqual(pages.length, 3);
    assert.strictEqual(pages[0].title, "Introduction");
    assert.strictEqual(pages[1].title, "Components Basics");
    assert.strictEqual(pages[2].title, "Reactivity");
    assert.ok(pages[0].content.includes("Vue.js is a progressive"));
    assert.ok(pages[1].content.includes("Components are reusable"));
  });

  it("should extract URL metadata from content", () => {
    const content = `# Template Syntax

Some content here.

url: /guide/essentials/template-syntax.md

---

# Computed Properties

More content.`;

    const pages = unbind(content);

    assert.strictEqual(pages.length, 2);
    assert.strictEqual(pages[0].title, "Template Syntax");
    assert.deepStrictEqual(pages[0].metadata, {
      url: "/guide/essentials/template-syntax.md",
    });
    assert.strictEqual(pages[1].metadata, undefined);
  });

  it("should handle content without H1 headers", () => {
    const content = `Some content without header

---

## Only H2 Header

Content with only H2.`;

    const pages = unbind(content);

    assert.strictEqual(pages.length, 2);
    assert.strictEqual(pages[0].title, "");
    assert.strictEqual(pages[1].title, "");
    assert.ok(pages[0].content.includes("Some content without header"));
  });

  it("should handle H1 with anchor tags", () => {
    const content = `# Options API {#options-api}

The Options API.

---

# Composition API {#composition-api}

The Composition API.`;

    const pages = unbind(content);

    assert.strictEqual(pages.length, 2);
    assert.strictEqual(pages[0].title, "Options API");
    assert.strictEqual(pages[1].title, "Composition API");
  });

  it("should handle empty sections", () => {
    const content = `# First Section

Content here.

---

---

# Third Section

More content.`;

    const pages = unbind(content);

    // Empty sections should be filtered out
    assert.strictEqual(pages.length, 2);
    assert.strictEqual(pages[0].title, "First Section");
    assert.strictEqual(pages[1].title, "Third Section");
  });
});

describe("VueJS format streaming", () => {
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

  it("should stream parse VueJS format", async () => {
    const content = `# First Page {#first}

Content of first page.

---

# Second Page {#second}

Content of second page.`;

    const pages: Page[] = [];

    for await (const page of unbindStream(stringToStream(content))) {
      pages.push(page);
    }

    assert.strictEqual(pages.length, 2);
    assert.strictEqual(pages[0].title, "First Page");
    assert.strictEqual(pages[1].title, "Second Page");
  });

  it("should produce same results as unbind for VueJS format", async () => {
    const content = `# Title 1

Content 1.

---

# Title 2

Content 2.

---

# Title 3

Content 3.`;

    const syncPages = unbind(content);
    const streamPages: Page[] = [];

    for await (const page of unbindStream(stringToStream(content))) {
      streamPages.push(page);
    }

    assert.strictEqual(syncPages.length, streamPages.length);
    for (let i = 0; i < syncPages.length; i++) {
      assert.strictEqual(syncPages[i].title, streamPages[i].title);
      assert.strictEqual(syncPages[i].content, streamPages[i].content);
      assert.deepStrictEqual(syncPages[i].metadata, streamPages[i].metadata);
    }
  });

  it("should handle small chunks for VueJS format", async () => {
    const content = `# Small Chunks Test

Testing small chunks.

---

# Another Section

More content.`;

    const pages: Page[] = [];

    // Use very small chunk size (1 byte)
    for await (const page of unbindStream(stringToStream(content, 1))) {
      pages.push(page);
    }

    assert.strictEqual(pages.length, 2);
    assert.strictEqual(pages[0].title, "Small Chunks Test");
    assert.strictEqual(pages[1].title, "Another Section");
  });
});
