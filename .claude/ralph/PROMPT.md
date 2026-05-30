# You are ONE iteration of a Ralph loop. Fresh context — the disk is your memory.

Goal: advance the merge-sync feature toward done, ONE item per run. You are an
EXECUTOR of an already-refined plan, not a critic. Do not redesign; implement.

## Do exactly this, in order:
1. Read `.claude/ralph/AGENT.md` and `.claude/ralph/fix_plan.md` IN FULL.
2. If `fix_plan.md` STATUS is `COMPLETE`, print "COMPLETE" and stop.
3. Pick the SINGLE highest-priority **actionable [RALPH]** item (top of file = highest):
   - SKIP every `[HUMAN]` item — those are design decisions reserved for the human.
   - SKIP any `[RALPH]` item (or sub-part) that depends on an unresolved `[HUMAN]`
     item; note the dependency next to it instead of guessing.
4. If NO actionable `[RALPH]` item remains (only `[HUMAN]` or human-blocked ones),
   set STATUS to `WAITING-HUMAN`, list the decision(s) needed, and stop.
5. Implement that one item FULLY. No placeholders, no stubs, no "TODO later".
   Match the surrounding code style.
6. Backpressure: `npm --prefix apps/food-calc run lint` then `npm --prefix apps/food-calc run test`.
   - RED → undo the edits you made for THIS item (leave the tree no worse than you
     found it), append the failure under the item in `fix_plan.md`, and stop.
   - GREEN → check the item `[x]` in `fix_plan.md`. If you learned a command or
     gotcha, append one line to `AGENT.md` § Learnings.
7. If that was the last unchecked actionable `[RALPH]` item, set STATUS to `COMPLETE`.

## Hard constraints
- ONE item per run. Don't batch.
- Edit ONLY files under `apps/food-calc/` for this feature. Touch nothing unrelated —
  other dev sessions are live in this same working tree.
- **NEVER run git** (no commit/reset/stash/checkout/add). The human owns commits.
  (git is also not in your allowed tools.)
- Smallest correct change. If an item turns out to need a judgment call you can't make
  mechanically, retag it `[HUMAN]` in fix_plan.md, note why, and stop.
