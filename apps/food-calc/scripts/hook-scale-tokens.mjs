#!/usr/bin/env node
// Claude Code PostToolUse hook, EXEC FORM. Invoked as:
//   node <this> ${tool_input.file_path}
// (Claude Code substitutes the path into argv — no shell, no stdin parsing, so it
// works the same on Windows/macOS/Linux.) For a .scss/.css edit it runs the token
// gate BUNDLE on that file and, on ANY violation, exits 2 so the combined message
// is fed back to Claude IN THE SAME TURN (exit 1 only shows a generic "hook error").
// No-op for any other file.
//
// Filename kept (settings.json hook path points here), but it now drives several
// gates — the point is fast, in-session feedback for the mistakes a literal grep
// can't see: scale/color var() to a nonexistent token, a component reading the
// reference tier (--ref-*), or a surface root painted with a non-sys fill.
//
// Separate from the check-*.mjs scripts on purpose: those exit 1 (standard lint
// failure for `lint:style` / lint-staged); a PostToolUse hook must exit 2 for
// stderr to reach the model.
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const filePath = process.argv[2];
if (!filePath || !/\.(scss|css)$/i.test(filePath)) process.exit(0);

const here = dirname(fileURLToPath(import.meta.url));
// Per-file gates (take a file arg) + the registry surface gate (ignores the arg,
// re-scans SURFACE_ROOTS — cheap, guards the app's highest-leverage paint on every
// scss edit). All exit 1 on violation; this hook aggregates and re-exits 2.
const CHECKERS = ['check-scale-tokens.mjs', 'check-token-tier.mjs', 'check-surface-token.mjs'];

let out = '';
for (const c of CHECKERS) {
  const r = spawnSync(process.execPath, [join(here, c), filePath], { encoding: 'utf8' });
  if (r.status && r.status !== 0) out += (r.stdout || '') + (r.stderr || '');
}
if (out) {
  process.stderr.write(out);
  process.exit(2); // exit 2 → stderr fed back to Claude
}
process.exit(0);
