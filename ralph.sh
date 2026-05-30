#!/usr/bin/env bash
# Ralph loop for the merge-sync feature.
#   - true Ralph: fresh context per iteration (claude -p re-invoked each loop)
#   - current branch, NO git operations (git is excluded from --allowedTools,
#     so Ralph physically cannot commit / reset / stash — the human owns commits)
#   - stop-on-red backpressure (a broken iteration HALTS the loop for inspection;
#     no auto-revert, because we never touch git)
#   - parallel dev sessions are live: edits are scoped to apps/food-calc/ by the prompt
#
# Run from the repo root:  bash ralph.sh [max_iterations]
# Windows: run in Git Bash or WSL.

set -uo pipefail
cd "$(dirname "$0")"                       # repo root
PROMPT=".claude/ralph/PROMPT.md"
FIX=".claude/ralph/fix_plan.md"
APP="apps/food-calc"
MAX="${1:-40}"

# Non-git rescue snapshot of the core files Ralph is most likely to touch.
STAMP="$(date +%Y%m%d-%H%M%S)"
BK=".claude/ralph/backup-$STAMP"
mkdir -p "$BK"
cp "$APP/src/shared/lib/dexie/schema.ts"   "$BK/" 2>/dev/null || true
cp "$APP/src/shared/lib/snapshot/index.ts" "$BK/" 2>/dev/null || true
echo "Rescue snapshot of core files -> $BK   (git is NOT used; review diffs yourself)"

i=0
while [ "$i" -lt "$MAX" ]; do
  i=$((i+1))
  echo "──────── Ralph iteration $i / $MAX ────────"

  # No --bare: it disables OAuth/keychain auth (would break subscription login).
  # No --max-turns: not a flag in this CLI version. git is absent from --allowedTools
  # → Ralph physically cannot commit/reset/stash.
  claude -p "$(cat "$PROMPT")" \
    --permission-mode acceptEdits \
    --allowedTools "Read Edit Write Grep Glob Bash(npm *) Bash(npx *)" \
    --output-format text
  rc=$?
  [ "$rc" -ne 0 ] && { echo "claude exited $rc — stopping."; break; }

  # Stop conditions read from the agent's compounding disk state.
  grep -q '^\*\*STATUS:\*\* COMPLETE'      "$FIX" && { echo "✅ COMPLETE";                       break; }
  grep -q '^\*\*STATUS:\*\* WAITING-HUMAN' "$FIX" && { echo "⏸  WAITING-HUMAN — your call needed."; break; }

  # Independent backpressure (defence in depth — the agent runs these too).
  npm --prefix "$APP" run lint && npm --prefix "$APP" run test \
    || { echo "❌ lint/test RED after iteration $i — halting for inspection."; break; }
done

echo "Ralph stopped after $i iteration(s)."
echo "Review with: git status / git diff   (Ralph never commits — that's yours)."
