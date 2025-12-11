import type { UserConfig } from "tsdown";
import { defineConfig } from "tsdown";

const config: UserConfig = defineConfig({
  outDir: "lib",
  entry: { index: "src/index.ts", cli: "src/cli.ts" },
  format: "esm",
  dts: true,
  fixedExtension: false,
});
export default config;
