const RE_EXTRACT_CODE_FENCE = /^[`~]{3,}/;

/**
 * Iterate over markdown lines, skipping code blocks
 * @param lines - Array of markdown lines
 * @returns Generator yielding lines outside code blocks
 */
export function* iterateMarkdownLinesWithoutCodeBlocks(
  lines: string[],
  option?: { startIndex?: number },
): Generator<{ line: string; index: number }> {
  let inCodeBlock: { openingFence: string } | null = null;

  for (let index = option?.startIndex ?? 0; index < lines.length; index++) {
    const line = lines[index].trim();
    const fence = RE_EXTRACT_CODE_FENCE.exec(line)?.[0];
    if (fence) {
      if (inCodeBlock) {
        if (fence.length < inCodeBlock.openingFence.length) {
          // Not a closing fence, because it's shorter than the opening fence
          continue;
        }
        inCodeBlock = null;
      } else {
        let start = fence.length;
        let closeFenceIndex = line.indexOf(fence, start);
        let hasClosingFence = false;
        while (closeFenceIndex >= 0) {
          start = closeFenceIndex + fence.length;
          if (line[start] !== fence[0]) {
            hasClosingFence = true;
            break;
          }
          while (line[start] === fence[0]) {
            start++;
          }
          closeFenceIndex = line.indexOf(fence, start);
        }
        if (hasClosingFence) {
          // It's inline code fence
          continue;
        }
        inCodeBlock = { openingFence: fence };
      }
      continue;
    }

    yield { line, index };
  }
}
