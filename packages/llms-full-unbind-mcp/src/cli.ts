#!/usr/bin/env node
import { runCli } from "./cli/run.ts";

void runCli().catch((error) => {
  // eslint-disable-next-line no-console -- Error logging is necessary for debugging
  console.error("Unhandled error:", error);
  throw error;
});
