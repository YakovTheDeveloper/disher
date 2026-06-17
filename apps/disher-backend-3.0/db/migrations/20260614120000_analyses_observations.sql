-- Analyses gain a structured `observations` column: neutral patterns the LLM
-- saw in the window, read-only reference the user CANNOT save (distinct from
-- `insights`, which are good/bad takeaways the user can keep, and `idea_cards`,
-- the saveable hypotheses). Splitting observations out of `insights` is the
-- 2026-06-14 «разграничение»: наблюдение (справка) ≠ инсайт (для себя, +/−).
-- See apps/food-calc/tds/hypotheses-insights.md §«Наблюдения ↔ Инсайты».
-- Pre-launch single user, no backfill: existing rows get the '[]' default, so
-- their old (mixed-semantics) `insights` keep rendering as insights.

alter table public.analyses
  add column observations jsonb not null default '[]'::jsonb;
