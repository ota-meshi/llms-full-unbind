import type { UserConfig } from "tsdown";
import { defineConfig } from "tsdown";

const config: UserConfig[] = defineConfig([
  {
    clean: true,
    dts: true,
    outDir: "lib",
    entry: ["src/index.ts"],
    format: ["esm"],
    treeshake: true,
    fixedExtension: false,
  },
]);
export default config;
