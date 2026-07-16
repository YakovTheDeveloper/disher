import { Type, type Static } from "@sinclair/typebox";

// The analysis output contract, as TypeBox — one declaration, two consumers.
// The backend used to declare these types in
// `apps/disher-backend-3.0/src/shared/analysis-output.ts` and the SPA re-typed
// them by hand in `features/analysis/api/types.ts` under a comment that said
// "Frontend mirror of the backend analysis contract"; the mirror was kept true
// by eye. Both sides now derive from `Static<>` here.
//
// What lives here is the SHAPE only. The parser stays on each side and stays
// hand-written on purpose: it is permissive (drops malformed findings, coerces
// an unknown strength to "weak", demotes a neutral insight to an observation)
// and it guards a jsonb column holding UNVALIDATED LLM output. A schema cannot
// express "salvage what you can" — validating that column before INSERT is a
// separate, server-side job.
//
// THREE distinct entities, deliberately separate:
//   • observation — a neutral regularity the model SAW. Reference only, no
//                   valence, not the user's to keep.
//   • insight     — a good/bad takeaway ABOUT the user, ALWAYS valenced; the
//                   user can save it. A neutral insight is a category error.
//   • hypothesis  — a testable mini-experiment the user can save.

export const AnalysisStrengthSchema = Type.Union(
  [Type.Literal("weak"), Type.Literal("moderate"), Type.Literal("clear")],
  { title: "AnalysisStrength", description: "Confidence in a finding." },
);
export type AnalysisStrength = Static<typeof AnalysisStrengthSchema>;

// Whether an insight reads as a good thing or a bad thing. ORTHOGONAL to
// `strength` — a "clear" insight can be negative. "neutral" is only a coercion
// fallback: a neutral finding is an observation, so no parser KEEPS one.
export const AnalysisValenceSchema = Type.Union(
  [Type.Literal("positive"), Type.Literal("negative"), Type.Literal("neutral")],
  { title: "AnalysisValence" },
);
export type AnalysisValence = Static<typeof AnalysisValenceSchema>;

export const AnalysisEvidenceSchema = Type.Object(
  {
    days: Type.Array(Type.String(), {
      description: "Concrete day keys from the window. Non-empty unless the finding is grounded in foods alone.",
    }),
    foods: Type.Optional(Type.Array(Type.String())),
    events: Type.Optional(Type.Array(Type.String())),
  },
  { title: "AnalysisEvidence" },
);
export type AnalysisEvidence = Static<typeof AnalysisEvidenceSchema>;

// An insight's shape MINUS valence — it makes no good/bad claim, so there is no
// valence field to misread.
export const AnalysisObservationSchema = Type.Object(
  {
    title: Type.String(),
    detail: Type.String(),
    strength: AnalysisStrengthSchema,
    evidence: AnalysisEvidenceSchema,
  },
  { title: "AnalysisObservation" },
);
export type AnalysisObservation = Static<typeof AnalysisObservationSchema>;

export const AnalysisInsightSchema = Type.Object(
  {
    title: Type.String(),
    detail: Type.String(),
    valence: AnalysisValenceSchema,
    strength: AnalysisStrengthSchema,
    evidence: AnalysisEvidenceSchema,
  },
  { title: "AnalysisInsight" },
);
export type AnalysisInsight = Static<typeof AnalysisInsightSchema>;

export const AnalysisHypothesisSchema = Type.Object(
  {
    title: Type.String(),
    body: Type.String(),
    suggestedDays: Type.Optional(Type.Number()),
  },
  { title: "AnalysisHypothesis" },
);
export type AnalysisHypothesis = Static<typeof AnalysisHypothesisSchema>;

// Frozen snapshot of a hypothesis the user ticked when starting the analysis.
// Immutable — survives editing or deleting the live hypothesis.
export const AppliedHypothesisSchema = Type.Object(
  {
    id: Type.String(),
    title: Type.String(),
    body: Type.String(),
  },
  { title: "AppliedHypothesis" },
);
export type AppliedHypothesis = Static<typeof AppliedHypothesisSchema>;

// `summary` rides in the analyses.result_md column so its pending('') /
// failed('⚠️…') sentinels keep working — it is not a jsonb member.
export const AnalysisOutputSchema = Type.Object(
  {
    summary: Type.String(),
    observations: Type.Array(AnalysisObservationSchema),
    insights: Type.Array(AnalysisInsightSchema),
    hypotheses: Type.Array(AnalysisHypothesisSchema),
  },
  { title: "AnalysisOutput" },
);
export type AnalysisOutput = Static<typeof AnalysisOutputSchema>;
