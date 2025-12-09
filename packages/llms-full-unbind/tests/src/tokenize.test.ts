import assert from "node:assert";
import { describe, it } from "node:test";
import { tokenize } from "../../src/utils/tokenize.ts";

describe("tokenize", () => {
  it("should tokenize simple text", () => {
    const input = "Hello World";
    const tokens = Array.from(tokenize(input));
    assert.strictEqual(tokens.length, 1);
    assert.strictEqual(tokens[0].type, "text");
    assert.strictEqual(tokens[0].range.start, 0);
    assert.strictEqual(tokens[0].range.end, 11);
    assert.strictEqual(
      input.slice(tokens[0].range.start, tokens[0].range.end),
      "Hello World",
    );
  });

  it("should tokenize simple opening tag", () => {
    const input = "<div>";
    const tokens = Array.from(tokenize(input));
    assert.strictEqual(tokens.length, 1);
    assert.strictEqual(tokens[0].type, "openTag");
    if (tokens[0].type === "openTag") {
      assert.strictEqual(tokens[0].name, "div");
      assert.strictEqual(tokens[0].selfClosing, false);
      assert.deepStrictEqual(tokens[0].attrs, {});
    }
  });

  it("should tokenize self-closing tag", () => {
    const input = "<br/>";
    const tokens = Array.from(tokenize(input));
    assert.strictEqual(tokens.length, 1);
    assert.strictEqual(tokens[0].type, "openTag");
    if (tokens[0].type === "openTag") {
      assert.strictEqual(tokens[0].name, "br");
      assert.strictEqual(tokens[0].selfClosing, true);
    }
  });

  it("should tokenize closing tag", () => {
    const input = "</div>";
    const tokens = Array.from(tokenize(input));
    assert.strictEqual(tokens.length, 1);
    assert.strictEqual(tokens[0].type, "closeTag");
    if (tokens[0].type === "closeTag") {
      assert.strictEqual(tokens[0].name, "div");
    }
  });

  it("should tokenize tag with attributes", () => {
    const input = '<doc title="Test" desc="Description">';
    const tokens = Array.from(tokenize(input));
    assert.strictEqual(tokens.length, 1);
    assert.strictEqual(tokens[0].type, "openTag");
    if (tokens[0].type === "openTag") {
      assert.strictEqual(tokens[0].name, "doc");
      assert.deepStrictEqual(tokens[0].attrs, {
        title: "Test",
        desc: "Description",
      });
    }
  });

  it("should tokenize tag with single quoted attributes", () => {
    const input = "<doc title='Test' desc='Description'>";
    const tokens = Array.from(tokenize(input));
    assert.strictEqual(tokens.length, 1);
    assert.strictEqual(tokens[0].type, "openTag");
    if (tokens[0].type === "openTag") {
      assert.strictEqual(tokens[0].name, "doc");
      assert.deepStrictEqual(tokens[0].attrs, {
        title: "Test",
        desc: "Description",
      });
    }
  });

  it("should tokenize tag with boolean attributes", () => {
    const input = "<input checked disabled>";
    const tokens = Array.from(tokenize(input));
    assert.strictEqual(tokens.length, 1);
    assert.strictEqual(tokens[0].type, "openTag");
    if (tokens[0].type === "openTag") {
      assert.strictEqual(tokens[0].name, "input");
      assert.deepStrictEqual(tokens[0].attrs, {
        checked: true,
        disabled: true,
      });
    }
  });

  it("should tokenize tag with unquoted attribute values", () => {
    const input = "<div class=container id=main>";
    const tokens = Array.from(tokenize(input));
    assert.strictEqual(tokens.length, 1);
    assert.strictEqual(tokens[0].type, "openTag");
    if (tokens[0].type === "openTag") {
      assert.strictEqual(tokens[0].name, "div");
      assert.deepStrictEqual(tokens[0].attrs, {
        class: "container",
        id: "main",
      });
    }
  });

  it("should tokenize comment", () => {
    const input = "<!-- This is a comment -->";
    const tokens = Array.from(tokenize(input));
    assert.strictEqual(tokens.length, 1);
    assert.strictEqual(tokens[0].type, "comment");
    assert.strictEqual(
      input.slice(tokens[0].range.start, tokens[0].range.end),
      "<!-- This is a comment -->",
    );
  });

  it("should tokenize CDATA", () => {
    const input = "<![CDATA[Some data]]>";
    const tokens = Array.from(tokenize(input));
    assert.strictEqual(tokens.length, 1);
    assert.strictEqual(tokens[0].type, "cdata");
    assert.strictEqual(
      input.slice(tokens[0].range.start, tokens[0].range.end),
      "<![CDATA[Some data]]>",
    );
  });

  it("should tokenize CDATA (lowercase)", () => {
    const input = "<![cdata[Some data]]>";
    const tokens = Array.from(tokenize(input));
    assert.strictEqual(tokens.length, 1);
    assert.strictEqual(tokens[0].type, "cdata");
  });

  it("should tokenize DOCTYPE", () => {
    const input = "<!DOCTYPE html>";
    const tokens = Array.from(tokenize(input));
    assert.strictEqual(tokens.length, 1);
    assert.strictEqual(tokens[0].type, "doctype");
    assert.strictEqual(
      input.slice(tokens[0].range.start, tokens[0].range.end),
      "<!DOCTYPE html>",
    );
  });

  it("should tokenize DOCTYPE (lowercase)", () => {
    const input = "<!doctype html>";
    const tokens = Array.from(tokenize(input));
    assert.strictEqual(tokens.length, 1);
    assert.strictEqual(tokens[0].type, "doctype");
  });

  it("should tokenize mixed content", () => {
    const input = "<div>Hello</div>";
    const tokens = Array.from(tokenize(input));
    assert.strictEqual(tokens.length, 3);
    assert.strictEqual(tokens[0].type, "openTag");
    assert.strictEqual(tokens[1].type, "text");
    assert.strictEqual(tokens[2].type, "closeTag");
    assert.strictEqual(
      input.slice(tokens[1].range.start, tokens[1].range.end),
      "Hello",
    );
  });

  it("should tokenize text before and after tags", () => {
    const input = "Before<div>Middle</div>After";
    const tokens = Array.from(tokenize(input));
    assert.strictEqual(tokens.length, 5);
    assert.strictEqual(tokens[0].type, "text");
    assert.strictEqual(
      input.slice(tokens[0].range.start, tokens[0].range.end),
      "Before",
    );
    assert.strictEqual(tokens[1].type, "openTag");
    assert.strictEqual(tokens[2].type, "text");
    assert.strictEqual(
      input.slice(tokens[2].range.start, tokens[2].range.end),
      "Middle",
    );
    assert.strictEqual(tokens[3].type, "closeTag");
    assert.strictEqual(tokens[4].type, "text");
    assert.strictEqual(
      input.slice(tokens[4].range.start, tokens[4].range.end),
      "After",
    );
  });

  it("should tokenize doc tag example", () => {
    const input =
      '<doc title="Page Title" desc="Description">Content here</doc>';
    const tokens = Array.from(tokenize(input));
    assert.strictEqual(tokens.length, 3);
    assert.strictEqual(tokens[0].type, "openTag");
    if (tokens[0].type === "openTag") {
      assert.strictEqual(tokens[0].name, "doc");
      assert.deepStrictEqual(tokens[0].attrs, {
        title: "Page Title",
        desc: "Description",
      });
    }
    assert.strictEqual(tokens[1].type, "text");
    assert.strictEqual(
      input.slice(tokens[1].range.start, tokens[1].range.end),
      "Content here",
    );
    assert.strictEqual(tokens[2].type, "closeTag");
    if (tokens[2].type === "closeTag") {
      assert.strictEqual(tokens[2].name, "doc");
    }
  });

  it("should handle empty input", () => {
    const input = "";
    const tokens = Array.from(tokenize(input));
    assert.strictEqual(tokens.length, 0);
  });

  it("should handle only whitespace", () => {
    const input = "   \n\t  ";
    const tokens = Array.from(tokenize(input));
    assert.strictEqual(tokens.length, 1);
    assert.strictEqual(tokens[0].type, "text");
  });

  it("should tokenize nested tags", () => {
    const input = "<outer><inner>text</inner></outer>";
    const tokens = Array.from(tokenize(input));
    assert.strictEqual(tokens.length, 5);
    assert.strictEqual(tokens[0].type, "openTag");
    assert.strictEqual(tokens[1].type, "openTag");
    assert.strictEqual(tokens[2].type, "text");
    assert.strictEqual(tokens[3].type, "closeTag");
    assert.strictEqual(tokens[4].type, "closeTag");
  });

  it("should handle malformed tags as text", () => {
    const input = "<incomplete";
    const tokens = Array.from(tokenize(input));
    assert.strictEqual(tokens.length, 1);
    assert.strictEqual(tokens[0].type, "text");
  });

  it("should tokenize comment with text around", () => {
    const input = "Before<!-- comment -->After";
    const tokens = Array.from(tokenize(input));
    assert.strictEqual(tokens.length, 3);
    assert.strictEqual(tokens[0].type, "text");
    assert.strictEqual(
      input.slice(tokens[0].range.start, tokens[0].range.end),
      "Before",
    );
    assert.strictEqual(tokens[1].type, "comment");
    assert.strictEqual(tokens[2].type, "text");
    assert.strictEqual(
      input.slice(tokens[2].range.start, tokens[2].range.end),
      "After",
    );
  });

  it("should tokenize attributes with colons and hyphens", () => {
    const input = '<div data-id="123" xml:lang="en">';
    const tokens = Array.from(tokenize(input));
    assert.strictEqual(tokens.length, 1);
    assert.strictEqual(tokens[0].type, "openTag");
    if (tokens[0].type === "openTag") {
      assert.deepStrictEqual(tokens[0].attrs, {
        "data-id": "123",
        "xml:lang": "en",
      });
    }
  });
});
