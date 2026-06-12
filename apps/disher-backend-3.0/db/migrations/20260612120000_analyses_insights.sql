-- Analyses gain a structured `insights` column: read-only observations the LLM
-- grounded in the window's actual days (evidence). Distinct from `idea_cards`
-- (now «hypotheses» — testable experiments the user can save). `summary` reuses
-- the existing `result_md` column so the pending('')/failed('⚠️…') sentinels on
-- that column keep working. See apps/food-calc/tds/analysis-structured-output.md.

alter table public.analyses
  add column insights jsonb not null default '[]'::jsonb;
