import type { DetectResult, StreamingParser } from "../types.ts";
import { DocTagStreamingParser } from "./doc-tag.ts";
import { H1StreamingParser } from "./h1.ts";
import { MintlifyStreamingParser } from "./mintlify.ts";
import { PageTagStreamingParser } from "./page-tag.ts";
import { VitepressPluginLlmsStreamingParser } from "./vitepress-plugin-llms.ts";

export type StreamingParserClass = {
  detect(lines: string[]): DetectResult;
  new (): StreamingParser;
};

export const streamingParsers: StreamingParserClass[] = [
  VitepressPluginLlmsStreamingParser,
  MintlifyStreamingParser,
  DocTagStreamingParser,
  PageTagStreamingParser,
  H1StreamingParser,
];
