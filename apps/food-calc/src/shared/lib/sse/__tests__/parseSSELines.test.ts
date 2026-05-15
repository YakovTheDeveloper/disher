import { describe, expect, it } from 'vitest';
import { createSSEParser } from '../parseSSELines';

function tokenLine(content: string): string {
  return `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}`;
}

describe('createSSEParser — happy path', () => {
  it('accumulates content from delta tokens across one feed', () => {
    const chunks: string[] = [];
    const parser = createSSEParser((c) => chunks.push(c));
    const result = parser.feed(
      `${tokenLine('Hello')}\n${tokenLine(' world')}\n`,
    );
    expect(result).toEqual({ done: false, error: null });
    expect(chunks).toEqual(['Hello', ' world']);
  });

  it('signals done on [DONE]', () => {
    const parser = createSSEParser(() => {});
    const result = parser.feed(`${tokenLine('ok')}\ndata: [DONE]\n`);
    expect(result).toEqual({ done: true, error: null });
  });

  it('skips malformed JSON lines without throwing', () => {
    const chunks: string[] = [];
    const parser = createSSEParser((c) => chunks.push(c));
    parser.feed(`data: not-json\n${tokenLine('ok')}\n`);
    expect(chunks).toEqual(['ok']);
  });

  it('reassembles a JSON token split across two TCP chunks', () => {
    const chunks: string[] = [];
    const parser = createSSEParser((c) => chunks.push(c));
    const whole = tokenLine('split');
    parser.feed(whole.slice(0, 20));
    parser.feed(`${whole.slice(20)}\n`);
    expect(chunks).toEqual(['split']);
  });
});

describe('createSSEParser — error events', () => {
  it('surfaces a server error event delivered in one chunk', () => {
    const parser = createSSEParser(() => {});
    const result = parser.feed('event: error\ndata: "OpenRouter 500: boom"\n');
    expect(result).toEqual({ done: true, error: 'OpenRouter 500: boom' });
  });

  it('buffers `event: error` and its `data:` line split across TCP chunks', () => {
    // The regression: a complete `event: error\n` line in chunk 1, the paired
    // `data:` line only in chunk 2. The old lookahead lost the message.
    const parser = createSSEParser(() => {});
    const first = parser.feed('event: error\n');
    expect(first).toEqual({ done: false, error: null });
    const second = parser.feed('data: "stream aborted: upstream"\n\n');
    expect(second).toEqual({ done: true, error: 'stream aborted: upstream' });
  });

  it('tolerates a blank line between event: and data:', () => {
    const parser = createSSEParser(() => {});
    const result = parser.feed('event: error\n\ndata: "framed"\n');
    expect(result).toEqual({ done: true, error: 'framed' });
  });

  it('falls back to generic message when error event has no data line', () => {
    const parser = createSSEParser(() => {});
    parser.feed('event: error\n');
    const result = parser.end();
    expect(result).toEqual({ done: true, error: 'server error' });
  });
});

describe('createSSEParser — end()', () => {
  it('flushes a complete final line that had no trailing newline', () => {
    const chunks: string[] = [];
    const parser = createSSEParser((c) => chunks.push(c));
    // Whole token line, but the stream ended without a trailing `\n` — it
    // stays in the buffer until end() drains it.
    parser.feed(tokenLine('tail'));
    expect(chunks).toEqual([]);
    const flushed = parser.end();
    expect(chunks).toEqual(['tail']);
    expect(flushed).toEqual({ done: false, error: null });
  });
});
