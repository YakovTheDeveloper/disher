/**
 * Generate self-signed certificates for HTTPS on localhost.
 * Run: npx tsx scripts/generate-certs.ts
 */

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import selfsigned from "selfsigned";

const CERTS_DIR = join(import.meta.dirname, "../certs");

// Ensure certs directory exists
if (!existsSync(CERTS_DIR)) {
  mkdirSync(CERTS_DIR, { recursive: true });
}

async function main() {
  // Generate self-signed certificate
  const pems = await selfsigned.generate(null, {
    algorithm: "sha256",
    days: 365,
    keySize: 2048,
    extensions: [
      {
        name: "subjectAltName",
        altNames: [
          { type: 2, value: "localhost" }, // DNS
          { type: 7, ip: "127.0.0.1" },     // IP
          { type: 7, ip: "::1" },            // IPv6
        ],
      },
    ],
    attrs: [{ name: "commonName", value: "localhost" }],
  });

  writeFileSync(join(CERTS_DIR, "localhost-key.pem"), pems.private);
  writeFileSync(join(CERTS_DIR, "localhost-cert.pem"), pems.cert);

  console.log(`✅ Certificates generated in ${CERTS_DIR}`);
  console.log("   - localhost-key.pem (private key)");
  console.log("   - localhost-cert.pem (certificate)");
  console.log("   Valid for 365 days");
}

main();
