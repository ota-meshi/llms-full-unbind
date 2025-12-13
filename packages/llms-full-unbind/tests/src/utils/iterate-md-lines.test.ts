import assert from "node:assert";
import { describe, it } from "node:test";
import { iterateMarkdownLinesWithoutCodeBlocks } from "../../../src/utils/iterate-md-lines.ts";

describe("iterateMarkdownLinesWithoutCodeBlocks", () => {
  it("should yield all lines when there are no code blocks", () => {
    const lines = ["Line 1", "Line 2", "Line 3"];
    const result = Array.from(iterateMarkdownLinesWithoutCodeBlocks(lines));

    assert.strictEqual(result.length, 3);
    assert.deepStrictEqual(result[0], { line: "Line 1", index: 0 });
    assert.deepStrictEqual(result[1], { line: "Line 2", index: 1 });
    assert.deepStrictEqual(result[2], { line: "Line 3", index: 2 });
  });

  it("should skip lines inside a code block", () => {
    const lines = [
      "Before code",
      "```",
      "code line 1",
      "code line 2",
      "```",
      "After code",
    ];
    const result = Array.from(iterateMarkdownLinesWithoutCodeBlocks(lines));

    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].line, "Before code");
    assert.strictEqual(result[0].index, 0);
    assert.strictEqual(result[1].line, "After code");
    assert.strictEqual(result[1].index, 5);
  });

  it("should handle multiple code blocks", () => {
    const lines = [
      "Line 1",
      "```",
      "code block 1",
      "```",
      "Line 2",
      "~~~",
      "code block 2",
      "~~~",
      "Line 3",
    ];
    const result = Array.from(iterateMarkdownLinesWithoutCodeBlocks(lines));

    assert.strictEqual(result.length, 3);
    assert.strictEqual(result[0].line, "Line 1");
    assert.strictEqual(result[0].index, 0);
    assert.strictEqual(result[1].line, "Line 2");
    assert.strictEqual(result[1].index, 4);
    assert.strictEqual(result[2].line, "Line 3");
    assert.strictEqual(result[2].index, 8);
  });

  it("should handle inline code fences", () => {
    const lines = ["Line with `inline code` here", "```", "block code", "```"];
    const result = Array.from(iterateMarkdownLinesWithoutCodeBlocks(lines));

    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].line, "Line with `inline code` here");
    assert.strictEqual(result[0].index, 0);
  });

  it("should support startIndex option", () => {
    const lines = ["Line 0", "Line 1", "Line 2", "Line 3"];
    const result = Array.from(
      iterateMarkdownLinesWithoutCodeBlocks(lines, { startIndex: 2 }),
    );

    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].line, "Line 2");
    assert.strictEqual(result[0].index, 2);
    assert.strictEqual(result[1].line, "Line 3");
    assert.strictEqual(result[1].index, 3);
  });

  it("should handle fence with more backticks as opening", () => {
    const lines = [
      "Before",
      "````",
      "code with triple backticks",
      "```",
      "still in code block",
      "````",
      "After",
    ];
    const result = Array.from(iterateMarkdownLinesWithoutCodeBlocks(lines));

    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].line, "Before");
    assert.strictEqual(result[1].line, "After");
  });

  it("should handle fence with tilde", () => {
    const lines = ["Before", "~~~", "code block with tilde", "~~~", "After"];
    const result = Array.from(iterateMarkdownLinesWithoutCodeBlocks(lines));

    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].line, "Before");
    assert.strictEqual(result[1].line, "After");
  });

  it("should trim whitespace from lines", () => {
    const lines = [
      "  Line with spaces  ",
      "```",
      "  code with spaces  ",
      "```",
      "\tLine with tabs\t",
    ];
    const result = Array.from(iterateMarkdownLinesWithoutCodeBlocks(lines));

    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].line, "Line with spaces");
    assert.strictEqual(result[1].line, "Line with tabs");
  });

  it("should handle empty lines", () => {
    const lines = ["Line 1", "", "```", "code", "```", "", "Line 2"];
    const result = Array.from(iterateMarkdownLinesWithoutCodeBlocks(lines));

    assert.strictEqual(result.length, 4);
    assert.strictEqual(result[0].line, "Line 1");
    assert.strictEqual(result[1].line, "");
    assert.strictEqual(result[2].line, "");
    assert.strictEqual(result[3].line, "Line 2");
  });

  it("should handle consecutive code blocks without content between", () => {
    const lines = [
      "Before",
      "```",
      "code 1",
      "```",
      "```",
      "code 2",
      "```",
      "After",
    ];
    const result = Array.from(iterateMarkdownLinesWithoutCodeBlocks(lines));

    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].line, "Before");
    assert.strictEqual(result[1].line, "After");
  });

  it("should handle fence markers in code content", () => {
    const lines = [
      "Before",
      "```typescript",
      "const fence = '```';",
      "```",
      "After",
    ];
    const result = Array.from(iterateMarkdownLinesWithoutCodeBlocks(lines));

    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].line, "Before");
    assert.strictEqual(result[1].line, "After");
  });

  it("should handle code block at the beginning", () => {
    const lines = ["```", "code at start", "```", "Content after"];
    const result = Array.from(iterateMarkdownLinesWithoutCodeBlocks(lines));

    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].line, "Content after");
  });

  it("should handle code block at the end", () => {
    const lines = ["Content before", "```", "code at end", "```"];
    const result = Array.from(iterateMarkdownLinesWithoutCodeBlocks(lines));

    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].line, "Content before");
  });

  it("should handle fence with language specifier", () => {
    const lines = [
      "Before",
      "```javascript",
      "console.log('test');",
      "```",
      "After",
    ];
    const result = Array.from(iterateMarkdownLinesWithoutCodeBlocks(lines));

    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].line, "Before");
    assert.strictEqual(result[1].line, "After");
  });

  it("should handle mixed fence types", () => {
    const lines = [
      "Line 1",
      "```",
      "backtick code",
      "```",
      "Line 2",
      "~~~",
      "tilde code",
      "~~~",
      "Line 3",
    ];
    const result = Array.from(iterateMarkdownLinesWithoutCodeBlocks(lines));

    assert.strictEqual(result.length, 3);
    assert.strictEqual(result[0].line, "Line 1");
    assert.strictEqual(result[1].line, "Line 2");
    assert.strictEqual(result[2].line, "Line 3");
  });

  it("should handle startIndex with code blocks", () => {
    const lines = ["Line 0", "```", "code", "```", "Line 1", "Line 2"];
    const result = Array.from(
      iterateMarkdownLinesWithoutCodeBlocks(lines, { startIndex: 1 }),
    );

    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].line, "Line 1");
    assert.strictEqual(result[1].line, "Line 2");
  });

  it("should handle empty array", () => {
    const lines: string[] = [];
    const result = Array.from(iterateMarkdownLinesWithoutCodeBlocks(lines));

    assert.strictEqual(result.length, 0);
  });

  it("should handle only code block", () => {
    const lines = ["```", "code only", "```"];
    const result = Array.from(iterateMarkdownLinesWithoutCodeBlocks(lines));

    assert.strictEqual(result.length, 0);
  });

  it("should preserve original line indices", () => {
    const lines = [
      "Line 0",
      "```",
      "code",
      "```",
      "Line 4",
      "Line 5",
      "```",
      "more code",
      "```",
      "Line 9",
    ];
    const result = Array.from(iterateMarkdownLinesWithoutCodeBlocks(lines));

    const indices = result.map((r) => r.index);
    assert.deepStrictEqual(indices, [0, 4, 5, 9]);
  });

  it("should handle fence at end of line with content", () => {
    const lines = ["Some text ```inline code``` more text", "Regular line"];
    const result = Array.from(iterateMarkdownLinesWithoutCodeBlocks(lines));

    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].line, "Some text ```inline code``` more text");
  });
});
