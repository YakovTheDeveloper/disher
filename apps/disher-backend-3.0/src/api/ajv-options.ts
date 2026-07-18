import type { FastifyServerOptions } from "fastify";

// The Ajv configuration for route-schema validation, in ONE place.
//
// It lives here rather than inline in buildApp because a test that builds a
// bare `Fastify()` gets Fastify's DEFAULTS, not ours — and the two now disagree
// on the single option below. That gap is not theoretical: user-reports.test.ts
// asserted that a wrong-typed `text` is coerced to a string and passed, which
// is true under a bare instance and FALSE in production. The test was green for
// two commits while pinning the opposite of what we ship.
//
// Any test that exercises validation must build with `buildApp`, or pass this
// to `Fastify({ ajv: AJV_OPTIONS })`. Otherwise it is testing a different app.
export const AJV_OPTIONS: FastifyServerOptions["ajv"] = {
  customOptions: {
    // OFF, against Fastify's default (`'array'` — see @fastify/ajv-compiler's
    // default-ajv-options.js; note it is 'array', not `true`: a superset that
    // includes every scalar coercion AND scalar↔single-element-array).
    //
    // Coercion REWRITES the request before the handler sees it ("This option
    // modifies original data" — ajv.js.org/guide/modifying-data). On a JSON
    // body that is pure loss: the wire format already carries the types, so
    // there is nothing to recover, and `null` silently becomes `0` for an
    // integer field (the hazard behind fastify#3121).
    //
    // The cost is real and is paid on the OTHER request parts: a querystring is
    // always text on the wire, so `?limit=100` cannot satisfy `Type.Integer()`
    // with coercion off. Every querystring in this codebase is therefore
    // declared `Type.String()` and parsed by its handler — see admin.ts /
    // billing.ts. Fastify's sanctioned answer is a per-httpPart validator
    // (body off, querystring/params/headers on); we do not do that, because it
    // means hand-copying Fastify's other Ajv defaults into our own instances
    // with no way to import them, and they would drift silently on upgrade.
    // If a route ever genuinely needs a typed querystring, that trade flips.
    coerceTypes: false,
  },
};
