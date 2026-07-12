import { execSync } from 'node:child_process';
import killPort from 'kill-port';

const ports = process.argv.slice(2).map(Number).filter(Number.isFinite);
if (!ports.length) {
  console.error('Usage: free-port <port> [port...]');
  process.exit(1);
}

// Who is still LISTENING on `port`? Returns the set of PIDs (empty = free).
// kill-port hides its outcome (it swallows every failure and always resolves),
// so we verify against the OS directly instead of trusting the kill call.
function listenersOn(port) {
  const pids = new Set();
  if (process.platform === 'win32') {
    let out = '';
    try {
      out = execSync('netstat -nao', { encoding: 'utf8' });
    } catch {
      return pids; // netstat unavailable — don't block the dev server
    }
    // Match the local-address column ending in :<port> on a LISTENING row,
    // for both IPv4 (0.0.0.0:5173) and IPv6 ([::1]:5173) binds.
    const re = new RegExp(`^\\s*TCP\\s+\\S*:${port}\\s+\\S+\\s+LISTENING\\s+(\\d+)`, 'gm');
    for (const m of out.matchAll(re)) pids.add(m[1]);
  } else {
    try {
      const out = execSync(`lsof -nP -iTCP:${port} -sTCP:LISTEN -t`, { encoding: 'utf8' });
      for (const pid of out.split('\n').map((s) => s.trim()).filter(Boolean)) pids.add(pid);
    } catch {
      // lsof exits non-zero when nothing is listening — that's "free".
    }
  }
  return pids;
}

for (const port of ports) {
  try {
    await killPort(port);
    console.log(`[free-port] cleared :${port}`);
  } catch {
    // kill-port@2 resolves even on an empty port; a reject here means
    // the OS-level kill itself failed — log and keep going so we still verify.
    console.log(`[free-port] could not clear :${port} (verifying)`);
  }

  // kill-port lies about success, so confirm the port is actually free before
  // handing off to `vite --strictPort` (which hard-crashes on a busy port with
  // no hint about the culprit). Fail fast here with the offending PID instead.
  const stillBusy = listenersOn(port);
  if (stillBusy.size) {
    const pidList = [...stillBusy].join(', ');
    console.error(
      `[free-port] :${port} is still held by PID ${pidList} after kill-port.\n` +
        `  Another dev server (e.g. \`dev-local\` vs \`dev-network\`) is likely already running on it.\n` +
        `  Kill it manually — Windows: taskkill /F /PID ${[...stillBusy][0]}  ·  *nix: kill -9 ${[...stillBusy][0]}`,
    );
    process.exit(1);
  }
}
