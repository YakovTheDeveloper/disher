import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Snapshot } from '@/shared/lib/snapshot';
import { mergedState, canon } from './support/world';

// Language-neutral conformance corpus for merge(). Each fixture is
// {local, incoming} → {expected}; the Kotlin client is expected to run the same
// files through its own merge and land on the same bytes.
//
// `expected` is NEVER hand-written. It is produced by running the REAL merge()
// under `npm run golden:regen`, and the resulting diff is the point at which the
// semantics get reviewed by a human. Hand-authoring it would encode what we
// BELIEVE merge does; generating it records what it DOES.
//
// status: 'canon'          — intended behaviour. A diff here is a regression.
// status: 'pins-known-bug' — pins behaviour we know is WRONG (see
//                            contracts/sync-merge/INVARIANTS.md). Kept because the
//                            second client must be bit-compatible with what
//                            production actually ships, not with the ideal. When
//                            the bug is fixed, these fixtures change — that diff
//                            is expected and must be reviewed, not rubber-stamped.

const HERE = path.dirname(fileURLToPath(import.meta.url));
// __tests__ → snapshot → lib → shared → src → food-calc → apps → <repo root>
const REPO_ROOT = path.resolve(HERE, '..', '..', '..', '..', '..', '..', '..');
const CORPUS = path.join(REPO_ROOT, 'contracts', 'sync-merge');

// Fail loudly rather than silently testing zero fixtures if the tree ever moves.
if (!existsSync(path.join(REPO_ROOT, 'pnpm-workspace.yaml'))) {
  throw new Error(
    `golden.test.ts: REPO_ROOT resolved to ${REPO_ROOT}, which is not the workspace root`,
  );
}

// The root resolving correctly does not mean the corpus is there. Without this,
// a missing contracts/ makes readdirSync below throw a raw ENOENT at module load
// — an error that names a path, not the problem. The corpus is the contract the
// second client conforms to; its absence must say so.
if (!existsSync(CORPUS)) {
  throw new Error(
    `golden.test.ts: conformance corpus missing at ${CORPUS}. It is tracked in git — ` +
      `a missing corpus means the tree is broken, not that fixtures are optional.`,
  );
}

const REGEN = process.env.GOLDEN_REGEN === '1';

/** merge() mutates its argument, and a regen rewrites the WHOLE fixture — inputs
 *  included — so a mutation that reaches `local`/`incoming` gets baked into the
 *  corpus as if it were authored. world.ts defuses that with a structuredClone;
 *  freezing makes the test throw here the day someone drops it, instead of
 *  silently shipping a corrupted fixture to the second client. */
function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }
  return value;
}

interface Fixture {
  name: string;
  description: string;
  status: 'canon' | 'pins-known-bug';
  local: Snapshot;
  incoming: Snapshot;
  expected: Snapshot | null;
}

const files = readdirSync(CORPUS)
  .filter((f) => f.endsWith('.json'))
  .sort();

describe('golden corpus — merge() conformance', () => {
  it('the corpus is not empty', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    const full = path.join(CORPUS, file);
    const fixture = deepFreeze(JSON.parse(readFileSync(full, 'utf8')) as Fixture);

    it(`${fixture.name} [${fixture.status}] — ${fixture.description}`, async () => {
      // mergedState() clones `incoming` before handing it to merge(), which
      // mutates its argument — without that the fixture object on disk would be
      // rewritten in memory and a regen would bake the mutation in.
      const actual = await mergedState(fixture.local, fixture.incoming);

      if (REGEN) {
        writeFileSync(
          full,
          JSON.stringify({ ...fixture, expected: actual }, null, 2) + '\n',
          'utf8',
        );
        return;
      }

      expect(fixture.expected, `${file} has no expected — run: npm run golden:regen`).not.toBeNull();
      expect(actual).toEqual(canon(fixture.expected as Snapshot));
    });
  }
});
