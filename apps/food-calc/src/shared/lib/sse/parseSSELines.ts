// Shared SSE parser for OpenRouter-style chat-completion streams.
//
// Single source of truth: previously this logic was duplicated in
// features/dish-analysis/api/runDishAnalysis.ts and
// pages/schedule/.../ScheduleFoodAnalyticsPage.tsx — two copies that drifted
// (one returned {done,error}, the other threw). The daily-analysis stream is
// a third consumer; rather than a fourth copy, everyone imports this.
//
// Stream framing handled:
//  - `data: {json}` token lines — delta.content is forwarded to onChunk.
//  - `data: [DONE]` — terminal, { done: true }.
//  - `event: error\ndata: "<msg>"` — terminal, { error: "<msg>" }.
//
// The bug this fixes: the old pure `parseSSELines(lines)` used a `lines[i+1]`
// lookahead for the error message. When the backend's `event: error\n` line
// and its `data:` line land in *different* TCP chunks, the lookahead misses
// and the message degrades to a generic "server error". The parser is now
// stateful — it remembers a pending `event: error` across feed() calls and
// pairs it with the `data:` line whenever it arrives.

export type SSEParseResult = {
  /** Stream is terminal — stop reading (saw [DONE] or an error). */
  done: boolean;
  /** Non-null when the stream ended with a server-sent error event. */
  error: string | null;
};

const CONTINUE: SSEParseResult = { done: false, error: null };

export type SSEParser = {
  /** Feed a raw decoded chunk. Partial trailing lines are buffered. */
  feed: (text: string) => SSEParseResult;
  /** Flush any buffered partial line at end of stream. */
  end: () => SSEParseResult;
};

export function createSSEParser(onChunk: (chunk: string) => void): SSEParser {
  // Partial trailing line carried between feed() calls.
  let buffer = '';
  // True after we saw `event: error` but before its paired `data:` line.
  let pendingError = false;

  function processLines(lines: string[]): SSEParseResult {
    for (const raw of lines) {
      const line = raw.trim();

      if (pendingError) {
        if (line.startsWith('data: ')) {
          pendingError = false;
          try {
            const msg = JSON.parse(line.slice(6));
            return {
              done: true,
              error: typeof msg === 'string' && msg ? msg : 'server error',
            };
          } catch {
            return { done: true, error: 'server error' };
          }
        }
        // Blank line between `event:` and `data:` is legal SSE framing — wait.
        if (line === '') continue;
        // Anything else means the error event carried no data line.
        pendingError = false;
        return { done: true, error: 'server error' };
      }

      if (!line) continue;

      if (line.startsWith('event: error')) {
        pendingError = true;
        continue;
      }

      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6);
      if (data === '[DONE]') return { done: true, error: null };

      try {
        const parsed = JSON.parse(data);
        const content = parsed?.choices?.[0]?.delta?.content;
        if (typeof content === 'string' && content.length > 0) onChunk(content);
      } catch {
        // Malformed JSON line — skip. A partial JSON line stays in `buffer`
        // and is completed by the next feed().
      }
    }
    return CONTINUE;
  }

  return {
    feed(text: string): SSEParseResult {
      buffer += text;
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      return processLines(lines);
    },
    end(): SSEParseResult {
      if (buffer.length === 0) {
        // A dangling `event: error` with no data line ever arriving.
        if (pendingError) {
          pendingError = false;
          return { done: true, error: 'server error' };
        }
        return CONTINUE;
      }
      const last = buffer;
      buffer = '';
      const result = processLines([last]);
      if (result.done) return result;
      if (pendingError) {
        pendingError = false;
        return { done: true, error: 'server error' };
      }
      return result;
    },
  };
}
