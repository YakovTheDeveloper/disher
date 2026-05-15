-- 2026-05-15 — see apps/food-calc/tds/home-and-analyses-ui.md
--
-- Add a frozen snapshot of the hypotheses the user ticked when starting a
-- long analysis. Shape: {id,title,body}[]. The snapshot is immutable — it
-- survives editing or deleting the live hypothesis. Pre-launch single user,
-- no backfill: existing rows get the '[]' default.

begin;

alter table public.analyses
  add column applied_hypotheses jsonb not null default '[]'::jsonb;

commit;
