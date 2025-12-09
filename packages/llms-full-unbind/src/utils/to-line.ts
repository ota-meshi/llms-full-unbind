/**
 * Convert string to lines, splitting on various line break types (CR, LF, CRLF)
 * @param input - Input string to convert
 * @returns Generator yielding individual lines
 */
export function* stringToLines(input: string): Iterable<string> {
  const reLineBreak = /\r\n|\n|\r/gv;

  let lastIndex = 0;
  for (const match of input.matchAll(reLineBreak)) {
    // Yield line before the line break
    const line = input.slice(lastIndex, match.index);
    yield line;
    lastIndex = match.index + match[0].length;
  }
  const remaining = input.slice(lastIndex);
  if (remaining) {
    yield remaining;
  }
}
/**
 * Convert various input types to lines
 * Handles Web ReadableStream, AsyncIterable, or string inputs
 * @param input - Input: ReadableStream, AsyncIterable, or string
 * @returns Async generator yielding individual lines
 */
export async function* toLines(
  input:
    | ReadableStream<Uint8Array>
    | AsyncIterable<Uint8Array | string>
    | string,
): AsyncIterable<string> {
  if (typeof input === "string") {
    yield* stringToLines(input);
    return;
  }
  if ("getReader" in input) {
    const reader = input.getReader();
    try {
      yield* readerToLines(reader);
    } finally {
      reader.releaseLock();
    }
    return;
  }

  yield* asyncIterableToLines(input);
}

/**
 * Convert ReadableStreamDefaultReader to lines
 * @param reader - ReadableStreamDefaultReader to convert
 * @returns Async iterable yielding lines
 */
function readerToLines(
  reader: ReadableStreamDefaultReader<Uint8Array>,
): AsyncIterable<string> {
  return asyncIterableToLines(toIterable());

  /**
   * Convert reader to AsyncIterable
   */
  async function* toIterable() {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield value;
    }
  }
}

/**
 * Convert AsyncIterable of chunks to lines
 * Handles both Uint8Array (decoded via TextDecoder) and string chunks
 * @param asyncIterable - AsyncIterable of Uint8Array or string chunks
 * @returns Async generator yielding individual lines
 */
async function* asyncIterableToLines(
  asyncIterable: AsyncIterable<Uint8Array | string>,
): AsyncIterable<string> {
  const reLineBreak = /\r\n|\n|\r/gv;

  const textDecoder = new TextDecoder();
  let buffer = "";

  for await (const chunk of asyncIterable) {
    const text =
      typeof chunk === "string"
        ? chunk
        : textDecoder.decode(chunk, { stream: true });

    buffer += text;
    reLineBreak.lastIndex = 0;
    let lastIndex = 0;
    for (const match of buffer.matchAll(reLineBreak)) {
      // Yield line before the line break
      const line = buffer.slice(lastIndex, match.index);
      yield line;
      lastIndex = match.index + match[0].length;
    }
    buffer = buffer.slice(lastIndex);
  }
  const remaining = textDecoder.decode();
  buffer += remaining;
  if (buffer) {
    yield buffer;
  }
}
