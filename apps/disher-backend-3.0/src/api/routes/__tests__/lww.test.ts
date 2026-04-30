import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { decideLww, type LwwState } from "../lww.js";

// 8.5 LWW pure function + property-based test (P1).
//
// decideLww mirrors the SQL WHERE clause in backup.ts. Tested via
// concrete cases for documented invariants + fast-check for general
// arbitraries.

const ISO = (ms: number) => new Date(ms).toISOString();

describe("decideLww — concrete cases", () => {
  it("accepts when no server row exists (insert path)", () => {
    expect(
      decideLww(null, {
        edit_count: 1,
        client_modified_at: ISO(1000),
        deleted_at: null,
      }),
    ).toBe("accept");
  });

  it("accepts incoming with greater edit_count", () => {
    const s: LwwState = {
      edit_count: 1,
      client_modified_at: ISO(1000),
      deleted_at: null,
    };
    const i: LwwState = {
      edit_count: 2,
      client_modified_at: ISO(500),
      deleted_at: null,
    };
    // Note: incoming has OLDER client_modified_at — edit_count is primary so
    // it still wins.
    expect(decideLww(s, i)).toBe("accept");
  });

  it("rejects incoming with lesser edit_count", () => {
    const s: LwwState = {
      edit_count: 5,
      client_modified_at: ISO(1000),
      deleted_at: null,
    };
    const i: LwwState = {
      edit_count: 4,
      client_modified_at: ISO(2000),
      deleted_at: null,
    };
    expect(decideLww(s, i)).toBe("reject");
  });

  it("on tie: accepts incoming with newer client_modified_at", () => {
    const s: LwwState = {
      edit_count: 3,
      client_modified_at: ISO(1000),
      deleted_at: null,
    };
    const i: LwwState = {
      edit_count: 3,
      client_modified_at: ISO(1500),
      deleted_at: null,
    };
    expect(decideLww(s, i)).toBe("accept");
  });

  it("on tie: accepts identical row (>= comparison) — idempotency invariant", () => {
    const s: LwwState = {
      edit_count: 3,
      client_modified_at: ISO(1000),
      deleted_at: null,
    };
    const i: LwwState = { ...s };
    expect(decideLww(s, i)).toBe("accept");
  });

  it("on tie: rejects incoming with older client_modified_at", () => {
    const s: LwwState = {
      edit_count: 3,
      client_modified_at: ISO(2000),
      deleted_at: null,
    };
    const i: LwwState = {
      edit_count: 3,
      client_modified_at: ISO(1000),
      deleted_at: null,
    };
    expect(decideLww(s, i)).toBe("reject");
  });

  it("soft-delete sticky: incoming delete wins over live server", () => {
    const s: LwwState = {
      edit_count: 10,
      client_modified_at: ISO(2000),
      deleted_at: null,
    };
    const i: LwwState = {
      edit_count: 1,
      client_modified_at: ISO(1000),
      deleted_at: ISO(3000),
    };
    expect(decideLww(s, i)).toBe("accept");
  });

  it("soft-delete sticky: cannot resurrect — stale insert against deleted server is rejected", () => {
    const s: LwwState = {
      edit_count: 1,
      client_modified_at: ISO(1000),
      deleted_at: ISO(2000),
    };
    const i: LwwState = {
      edit_count: 999,
      client_modified_at: ISO(9999),
      deleted_at: null,
    };
    expect(decideLww(s, i)).toBe("reject");
  });

  it("soft-delete sticky: redundant delete against already-deleted is rejected (no-op upsert)", () => {
    const s: LwwState = {
      edit_count: 5,
      client_modified_at: ISO(1000),
      deleted_at: ISO(2000),
    };
    const i: LwwState = {
      edit_count: 6,
      client_modified_at: ISO(3000),
      deleted_at: ISO(3000),
    };
    expect(decideLww(s, i)).toBe("reject");
  });
});

describe("decideLww — property-based", () => {
  // Arbitrary for an LwwState. edit_count >= 0, ISO timestamps from a small
  // window so collisions are realistic.
  const stateArb = (): fc.Arbitrary<LwwState> =>
    fc.record({
      edit_count: fc.integer({ min: 0, max: 100 }),
      client_modified_at: fc
        .integer({ min: 0, max: 10_000 })
        .map((n) => ISO(n)),
      deleted_at: fc.option(
        fc.integer({ min: 0, max: 10_000 }).map((n) => ISO(n)),
        { nil: null },
      ),
    });

  it("identity: decideLww(s, s) is always accept (idempotent re-send)", () => {
    fc.assert(
      fc.property(stateArb(), (s) => {
        // Server row never has deleted_at != null AND we re-send the same
        // tombstone — this hits the "soft-delete sticky reject redundant"
        // branch by design. Filter that case (idempotent re-send only
        // applies to live rows).
        if (s.deleted_at != null) return true;
        return decideLww(s, s) === "accept";
      }),
    );
  });

  it("monotonicity: bumping incoming.edit_count only ever flips reject→accept, never the reverse", () => {
    fc.assert(
      fc.property(
        stateArb(),
        stateArb(),
        fc.integer({ min: 1, max: 50 }),
        (server, incoming, bump) => {
          // Skip cases involving deleted_at — orthogonal axis.
          if (server.deleted_at != null || incoming.deleted_at != null)
            return true;
          const before = decideLww(server, incoming);
          const after = decideLww(server, {
            ...incoming,
            edit_count: incoming.edit_count + bump,
          });
          // If before was accept, after must remain accept.
          if (before === "accept") return after === "accept";
          // If before was reject, after may be either — but never worse.
          return true;
        },
      ),
    );
  });

  it("soft-delete sticky: once server.deleted_at is set, no incoming with deleted_at=null is ever accepted", () => {
    fc.assert(
      fc.property(stateArb(), stateArb(), (server, incoming) => {
        if (server.deleted_at == null) return true;
        const liveIncoming = { ...incoming, deleted_at: null };
        return decideLww(server, liveIncoming) === "reject";
      }),
    );
  });

  it("if server is null, every incoming is accepted (insert path)", () => {
    fc.assert(
      fc.property(stateArb(), (incoming) => {
        return decideLww(null, incoming) === "accept";
      }),
    );
  });

  it("decision is deterministic — same inputs always yield same output", () => {
    fc.assert(
      fc.property(fc.option(stateArb(), { nil: null }), stateArb(), (s, i) => {
        return decideLww(s, i) === decideLww(s, i);
      }),
    );
  });
});
