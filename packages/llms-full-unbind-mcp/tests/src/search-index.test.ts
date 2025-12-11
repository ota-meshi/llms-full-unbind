import assert from "node:assert/strict";
import { test } from "node:test";
import { SearchIndex } from "../../src/search/search-index.ts";
import { queryToRegExp } from "../../src/utils/query-to-regexp.ts";

const SAMPLE_URL = "https://example.com/llms-full.txt";
const SAMPLE_LLMS_FULL = `# First Page
Source: https://example.com/first

First body content with apple.

# Second Page
Source: https://example.com/second

Second body content mentions zebra and apple.
`;

test("SearchIndex", async (t) => {
  await t.test("indexes pages correctly", async (testContext) => {
    testContext.mock.method(globalThis, "fetch", () =>
      Promise.resolve(new Response(SAMPLE_LLMS_FULL)),
    );

    const index = new SearchIndex({ llmsFullTxtURLs: [SAMPLE_URL] });
    const appleMatches = await index.search("apple");
    const paths = appleMatches.map((match) => match.path).sort();
    assert.deepEqual(paths, [
      "https://example.com/first",
      "https://example.com/second",
    ]);
  });

  await t.test("supports string search", async (testContext) => {
    testContext.mock.method(globalThis, "fetch", () =>
      Promise.resolve(new Response(SAMPLE_LLMS_FULL)),
    );

    const index = new SearchIndex({ llmsFullTxtURLs: [SAMPLE_URL] });
    const appleMatches = await index.search("apple");
    assert.ok(appleMatches.length > 0);
  });

  await t.test("supports regex search with flags", async (testContext) => {
    testContext.mock.method(globalThis, "fetch", () =>
      Promise.resolve(new Response(SAMPLE_LLMS_FULL)),
    );

    const index = new SearchIndex({ llmsFullTxtURLs: [SAMPLE_URL] });
    const zebraMatches = await index.search(/zebra/i);
    const zebraPaths = zebraMatches.map((match) => match.path);
    assert.deepEqual(zebraPaths, ["https://example.com/second"]);
  });

  await t.test("retrieves full content by page path", async (testContext) => {
    testContext.mock.method(globalThis, "fetch", () =>
      Promise.resolve(new Response(SAMPLE_LLMS_FULL)),
    );

    const index = new SearchIndex({ llmsFullTxtURLs: [SAMPLE_URL] });
    const content = await index.getContent("https://example.com/first");
    assert.match(content ?? "", /First body content with apple/);
  });
});

test("queryToRegExp", async (t) => {
  await t.test("parses valid regex with slash syntax", () => {
    const regex = queryToRegExp("/foo/i");
    assert.ok(regex);
    assert.equal(regex?.source, "foo");
    assert.equal(regex?.flags, "i");
  });

  await t.test("returns null for plain string query", () => {
    assert.equal(queryToRegExp("foo"), null);
  });

  await t.test("returns null for invalid regex pattern", () => {
    assert.equal(queryToRegExp("/foo["), null);
  });
});
