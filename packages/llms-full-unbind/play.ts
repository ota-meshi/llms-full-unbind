import { unbindStream } from "./src/index.ts";

// 1. Fetch the remote llms-full.txt
const response = await fetch(
  "https://fastht.ml/docs/llms-ctx-full.txt",
  //   "https://vuejs.org/llms-full.txt",
  //   "https://developers.cloudflare.com/llms-full.txt",
  //   "https://bun.sh/llms-full.txt",
  //   "https://docs.mangopay.com/llms-full.txt",
  //   "https://docs.x.com/llms-full.txt",
);

if (!response.body) {
  throw new Error("Response body is empty");
}

// 2. Unbind into pages
let count = 0;
for await (const page of unbindStream(response.body)) {
  // eslint-disable-next-line no-console -- Playground
  console.log(`- ${page.title || page.content.slice(0, 30)}`);
  count++;
}
// eslint-disable-next-line no-console -- Playground
console.log(`Extracted ${count} pages.`);
