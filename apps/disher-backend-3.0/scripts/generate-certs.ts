/**
 * Generate self-signed certificates for HTTPS on localhost AND LAN IPs.
 * SAN includes localhost, 127.0.0.1, ::1 plus every non-internal IPv4 of this
 * machine (e.g. 192.168.x.x). That makes `npm run dev:front` reachable from a
 * phone on the same Wi-Fi without a hostname mismatch.
 *
 * Re-run whenever your LAN IP changes (new Wi-Fi, VPN toggle).
 * Run: npx tsx scripts/generate-certs.ts
 */

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { networkInterfaces } from "node:os";
import { join } from "node:path";
import selfsigned from "selfsigned";

const CERTS_DIR = join(import.meta.dirname, "../certs");

if (!existsSync(CERTS_DIR)) {
  mkdirSync(CERTS_DIR, { recursive: true });
}

function collectLanIps(): string[] {
  const ifaces = networkInterfaces();
  const ips: string[] = [];
  for (const list of Object.values(ifaces)) {
    if (!list) continue;
    for (const net of list) {
      if (net.family === "IPv4" && !net.internal) ips.push(net.address);
    }
  }
  return [...new Set(ips)];
}

async function main() {
  const lanIps = collectLanIps();

  const altNames = [
    { type: 2, value: "localhost" },
    { type: 7, ip: "127.0.0.1" },
    { type: 7, ip: "::1" },
    ...lanIps.map((ip) => ({ type: 7, ip })),
  ];

  const pems = await selfsigned.generate(null, {
    algorithm: "sha256",
    days: 365,
    keySize: 2048,
    extensions: [{ name: "subjectAltName", altNames }],
    attrs: [{ name: "commonName", value: "localhost" }],
  });

  writeFileSync(join(CERTS_DIR, "localhost-key.pem"), pems.private);
  writeFileSync(join(CERTS_DIR, "localhost-cert.pem"), pems.cert);

  console.log(`✅ Certificates generated in ${CERTS_DIR}`);
  console.log("   - localhost-key.pem (private key)");
  console.log("   - localhost-cert.pem (certificate)");
  console.log("   Valid for 365 days. SAN entries:");
  console.log("     DNS: localhost");
  console.log("     IP:  127.0.0.1, ::1");
  if (lanIps.length > 0) {
    console.log(`     IP:  ${lanIps.join(", ")}  (LAN)`);
  } else {
    console.log("     (no non-internal IPv4 found — phone access won't work)");
  }
}

main();
