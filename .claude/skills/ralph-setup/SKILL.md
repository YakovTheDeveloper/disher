---
description: Scaffold a Ralph loop (autonomous fresh-context fix loop) for the current feature — generates .claude/ralph/{PROMPT,fix_plan,AGENT}.md + ralph.sh
disable-model-invocation: true
---

# /ralph-setup — scaffold a Ralph loop for a feature

Ralph = an EXTERNAL bash loop re-invoking `claude -p` with FRESH context each
iteration; progress compounds on disk (`fix_plan.md`), not in the context window.
A skill cannot *be* a Ralph (in-session = context accumulates) — it can only
scaffold one. This skill generates the harness. Ralph EXECUTES an already-refined
plan; it does not find bugs — that critique/spec work happens BEFORE Ralph.

When invoked:

1. Ask the user, plainly: which feature? where is the spec/plan/tds doc? what's the
   fix list (or derive it from the doc / a prior review)? what's the Definition of Done?
2. Generate, under the repo:
   - `.claude/ralph/AGENT.md` — repo run-commands + the must-know project doctrine.
     `claude -p --bare` drops CLAUDE.md + auto-memory, so duplicate the essential
     invariants here. Keep it SHORT.
   - `.claude/ralph/fix_plan.md` — the prioritized checklist. Header `**STATUS:**
     IN-PROGRESS`. Tag EVERY item: `[RALPH]` = mechanical, the loop may do it;
     `[HUMAN]` = needs design judgment, the loop must SKIP/flag, never attempt.
     Order: silent-data-loss > correctness > mechanical > tests > docs. Note any
     `[RALPH]` item that depends on an unresolved `[HUMAN]` one.
   - `.claude/ralph/PROMPT.md` — one-item-per-run: read AGENT+fix_plan, pick top
     actionable `[RALPH]`, implement FULLY (no placeholders), run lint+test
     backpressure, on red undo-this-item-and-stop, on green check it off; set STATUS
     `COMPLETE` when no actionable `[RALPH]` remains, `WAITING-HUMAN` if only
     `[HUMAN]` items are left.
   - `ralph.sh` — the loop. ENFORCE:
     * `--bare`, `--permission-mode acceptEdits`, scoped `--allowedTools` that
       **excludes git** (Ralph physically cannot commit/reset/stash — the human owns
       commits and the working tree).
     * stop-on-red (no auto-revert), sentinel stops (COMPLETE / WAITING-HUMAN),
       `--max-turns` cap, `MAX` iteration cap, a non-git rescue snapshot before the run.
     * scope edits to the feature's source dir only (parallel sessions may be live).
3. Tell the user:
   - Resolve the `[HUMAN]` items (open spec decisions) BEFORE an unattended run, or
     Ralph will stop at `WAITING-HUMAN` when it reaches them.
   - Watch the FIRST iteration interactively before letting it run hands-off.
   - It burns tokens (specs reload every loop) and needs senior judgment watching it.
   - Review `git diff` yourself — Ralph never commits.

Keep the generated `fix_plan.md` and `PROMPT.md` short and unambiguous — spec errors
propagate across every iteration.
