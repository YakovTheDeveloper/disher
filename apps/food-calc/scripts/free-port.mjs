import killPort from 'kill-port';

const ports = process.argv.slice(2).map(Number).filter(Number.isFinite);
if (!ports.length) {
  console.error('Usage: free-port <port> [port...]');
  process.exit(1);
}

for (const port of ports) {
  try {
    await killPort(port);
    console.log(`[free-port] cleared :${port}`);
  } catch {
    // kill-port@2 resolves even on an empty port; a reject here means
    // the OS-level kill itself failed — log and keep going so vite still tries.
    console.log(`[free-port] could not clear :${port} (continuing)`);
  }
}
