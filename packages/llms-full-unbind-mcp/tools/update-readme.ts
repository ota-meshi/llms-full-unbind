import * as gunshiGenerator from "gunshi/generator";
import { command } from "../src/cli/run.ts";
import pkg from "../package.json" with { type: "json" };
import * as fs from "node:fs";
import { plugin } from "gunshi";

const README_PATH = new URL("../README.md", import.meta.url);

const readmeText = fs.readFileSync(README_PATH);

const usageText = await gunshiGenerator.generate(null, command, {
  name: pkg.name,
  version: pkg.version,
  plugins: [
    plugin({
      id: "render-markdown",
      name: "render-markdown",
      setup(setupContext) {
        setupContext.decorateHeaderRenderer((_, ctx) => {
          return Promise.resolve(`> ${ctx.env.name} v${ctx.env.version}\n`);
        });
        setupContext.decorateUsageRenderer(async (baseRenderer, ctx) => {
          const usage = await baseRenderer(ctx);
          return usage
            .split("\n")
            .map((line) =>
              line.trim()
                ? line
                    .replace(/^(\s*)(\S)/gv, "$1- $2")
                    .replace(/<(.*?)>/gv, "`<$1>`")
                    .replaceAll(
                      /(\S)(\s{2,})(\S)/gv,
                      (_, before, _spaces, after) => `${before} ... ${after}`,
                    )
                : line,
            )
            .join("\n");
        });
      },
    }),
  ],
});

fs.writeFileSync(
  README_PATH,
  readmeText
    .toString()
    .replace(
      /<!-- CLI-USAGE-START -->[\s\S]*?<!-- CLI-USAGE-END -->/v,
      `<!-- CLI-USAGE-START -->\n\n${usageText.trim()}\n\n<!-- CLI-USAGE-END -->`,
    ),
);
