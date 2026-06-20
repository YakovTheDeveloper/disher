#!/usr/bin/env node
// Claude Code PostToolUse hook, EXEC FORM. Invoked as:
//   node <this> ${tool_input.file_path}
// (Claude Code substitutes the path into argv — no shell, no stdin parsing, so it
// works the same on Windows/macOS/Linux.) For a .scss/.css edit it runs the narrow
// token check on that one file and, on a violation, exits 2 so the message is fed
// back to Claude. No-op for any other file.
//
// Separate from check-scale-tokens.mjs on purpose: that script exits 1 (standard
// lint failure for `lint:style` / lint-staged), while a PostToolUse hook must exit
// 2 for stderr to reach the model (exit 1 only shows a generic "hook error").
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const filePath = process.argv[2];
if (!filePath || !/\.(scss|css)$/i.test(filePath)) process.exit(0);

const checker = join(dirname(fileURLToPath(import.meta.url)), 'check-scale-tokens.mjs');
const r = spawnSync(process.execPath, [checker, filePath], { encoding: 'utf8' });
if (r.status && r.status !== 0) {
  process.stderr.write((r.stdout || '') + (r.stderr || ''));
  process.exit(2); // exit 2 → stderr fed back to Claude
}
process.exit(0);
