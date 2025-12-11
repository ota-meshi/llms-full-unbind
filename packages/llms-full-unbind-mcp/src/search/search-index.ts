import MiniSearch from "minisearch";
import { fetchBody } from "../utils/fetch-body.ts";
import type { Page } from "llms-full-unbind";
import { unbindStream } from "llms-full-unbind";
import type { LLMsFullUnbindMcpServerOptions } from "../server/index.ts";

type Doc = {
  readonly id: string;
  readonly title: string;
  readonly content: string;
};
type SearchResult = {
  path: string;
  matchTerms: string[];
  score: number;
};
export class SearchIndex {
  protected docs: Promise<{
    miniSearch: MiniSearch<Doc>;
    allDocuments: Map<string, Doc>;
  }>;

  public constructor(options: LLMsFullUnbindMcpServerOptions) {
    this.docs = setupDocIndex(options);
  }

  public async getContent(pathName: string): Promise<string | undefined> {
    const doc = (await this.docs).allDocuments.get(pathName);
    return doc?.content;
  }

  public async search(query: string | RegExp): Promise<SearchResult[]> {
    const docs = await this.docs;
    if (query instanceof RegExp) {
      const results: SearchResult[] = [];
      for (const [pathName, doc] of docs.allDocuments) {
        const match = query.exec(doc.content);
        if (match) {
          results.push({ path: pathName, score: 1, matchTerms: [match[0]] });
        }
      }
      return results;
    }

    const results = docs.miniSearch.search(query);
    return results.map((result) => {
      return { path: result.id, matchTerms: result.terms, score: result.score };
    });
  }
}

/**
 * Set up the document search index.
 */
async function setupDocIndex(options: LLMsFullUnbindMcpServerOptions): Promise<{
  miniSearch: MiniSearch<Doc>;
  allDocuments: Map<string, Doc>;
}> {
  // let segmenter: Intl.Segmenter | null = null;
  // if (Intl.Segmenter.supportedLocalesOf("ja").length > 0) {
  //   segmenter = new Intl.Segmenter("ja", { granularity: "word" });
  // }
  const allDocuments = new Map<string, Doc>();
  const miniSearch = new MiniSearch({
    fields: ["title", "content"],
    // ...(segmenter
    //   ? {
    //       tokenize: (text: string) => {
    //         const tokens: string[] = [];
    //         for (const seg of segmenter.segment(text)) {
    //           const token = seg.segment.trim();
    //           if (!token) continue;
    //           tokens.push(token);
    //         }
    //         return tokens;
    //       },
    //     }
    //   : {}),
    searchOptions: {
      fuzzy: 0.2,
      prefix: true,
    },
  });

  await Promise.all(
    options.llmsFullTxtURLs.map(async (urlStr) => {
      const url = new URL(urlStr);
      const responseBody = await fetchBody(url);
      for await (const page of unbindStream(responseBody)) {
        const doc: Doc = {
          id: resolvePageId(page, url, allDocuments.size + 1),
          title: page.title || "Untitled",
          content: page.content,
        };
        miniSearch.add(doc);
        allDocuments.set(doc.id, doc);
      }
    }),
  );

  return { miniSearch, allDocuments };
}

/**
 * Resolve the page ID from a Page object.
 */
function resolvePageId(page: Page, baseUrl: URL, fallbackSeq: number) {
  if (maybeValidUrlPath(page.metadata.url)) {
    const url = new URL(page.metadata.url, baseUrl);
    return url.toString();
  }
  if (maybeValidUrlPath(page.metadata.source)) {
    const url = new URL(page.metadata.source, baseUrl);
    return url.toString();
  }
  if (page.title != null) {
    return `${page.title.replaceAll(/\s+/g, "-")}-page-${fallbackSeq}`;
  }
  return `page-${fallbackSeq}`;
}

/**
 * Checks if the given value is a valid URL path.
 */
function maybeValidUrlPath(str: unknown): str is string {
  if (typeof str !== "string") {
    return false;
  }
  return (
    str.startsWith("http://") ||
    str.startsWith("https://") ||
    str.startsWith("/") ||
    str.startsWith("./") ||
    str.startsWith("../")
  );
}
