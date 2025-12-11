import { defineConfig } from "eslint/config";
import myPlugin from "@ota-meshi/eslint-plugin";
import markdown from "@eslint/markdown";
import prettier from "eslint-plugin-prettier";
import markdownPreferences from "eslint-plugin-markdown-preferences";
import markdownLinks from "eslint-plugin-markdown-links";

// eslint-disable-next-line no-process-env -- Ignore
if (process.env.HTTPS_PROXY) process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

export default defineConfig([
  {
    ignores: [
      ".nyc_output/",
      "coverage/",
      "node_modules/",
      ".changeset/",
      "pnpm-lock.yaml",
      "**/pnpm-lock.yaml",
      "coverage/**",
      "lib/**",
      "packages/*/lib/**",
      "packages/*/coverage/**",
      "packages/*/node_modules/**",
      "!.github/",
      "!.vscode/",
      "!.devcontainer/",
    ],
  },
  {
    plugins: {
      prettier,
    },
  },
  {
    files: [
      "js",
      "mjs",
      "cjs",
      "ts",
      "mts",
      "cts",
      "vue",
      "json",
      "yaml",
    ].flatMap((ext) => [`*.${ext}`, `**/*.${ext}`]),
    extends: [
      myPlugin.config({
        node: true,
        ts: true,
        eslintPlugin: true,
        packageJson: true,
        json: true,
        yaml: true,
        // md: true,
        prettier: true,
        vue3: true,
      }),
    ],
    rules: {
      complexity: "off",
      "func-style": "off",
      "n/file-extension-in-import": "off",
      "one-var": "off",
      "no-return-await": "off",
    },
  },
  {
    files: ["**/*.ts", "**/*.mts"],
    rules: {
      "@typescript-eslint/switch-exhaustiveness-check": [
        "error",
        {
          allowDefaultCaseForExhaustiveSwitch: false,
          considerDefaultExhaustiveForUnions: true,
          requireDefaultForNonUnion: true,
        },
      ],
      "default-case": "off",
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "mdast",
              message: "Please use `src/language/ast-types.ts` instead.",
            },
            {
              name: "mdast-util-math",
              importNames: ["Math", "InlineMath"],
              message: "Please use `src/language/ast-types.ts` instead.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["**/*.md", "*.md"].flatMap((pattern) => [
      `${pattern}/*.js`,
      `${pattern}/*.mjs`,
    ]),
    rules: {
      "n/no-missing-import": "off",
    },
  },
  {
    files: ["**/*.md", "*.md"],
    extends: [
      markdown.configs.recommended,
      markdownPreferences.configs.standard,
      markdownLinks.configs.recommended,
    ],
    language: "markdown-preferences/extended-syntax",
    rules: {
      "prettier/prettier": "error",
      "markdown/no-missing-link-fragments": "off",
      "markdown/no-multiple-h1": ["error", { frontmatterTitle: "" }],
      "markdown-preferences/heading-casing": [
        "error",
        {
          ignorePatterns: ["llms-full-unbind", "MCP"],
        },
      ],
      "markdown-preferences/table-header-casing": [
        "error",
        {
          ignorePatterns: ["ID", "RECOMMENDED"],
        },
      ],
      "markdown-links/no-dead-urls": [
        "error",
        {
          ignoreUrls: [
            "https://www.npmjs.com/package/llms-full-unbind",
            "https://github.com/ota-meshi/llms-full-unbind",
          ],
          allowedAnchors: {
            "/^https:\\/\\/eslint-online-playground\\.netlify\\.app\\//u":
              "/.*/u",
          },
        },
      ],
      "markdown-links/no-missing-path": [
        "error",
        {
          anchorOption: {
            slugify: "mdit-vue",
          },
        },
      ],
    },
  },
  {
    files: ["docs/**/*.md"],
    rules: {
      "markdown-preferences/definitions-last": "off",
      "markdown-preferences/no-tabs": ["error", { ignoreCodeBlocks: ["*"] }],
    },
  },
  {
    files: [".github/ISSUE_TEMPLATE/*.md"],
    rules: {
      "prettier/prettier": "off",
      "markdown/no-missing-label-refs": "off",
    },
  },
  {
    files: ["CHANGELOG.md"],
    rules: {
      "markdown-preferences/definitions-last": "off",
      "markdown-preferences/prefer-link-reference-definitions": "off",
      "markdown-links/no-dead-urls": "off",
    },
  },
  {
    files: ["**/tests/**/*.ts"],
    rules: {
      "@typescript-eslint/no-floating-promises": "off",
    },
  },
]);
