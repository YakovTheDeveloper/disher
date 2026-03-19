/**
 * Generates the anon token for the frontend and writes it to food-calc/.env.local.
 *
 * Reads TRIPLIT_JWT_SECRET and TRIPLIT_PROJECT_ID from backend .env,
 * signs an anon JWT, and updates VITE_TRIPLIT_TOKEN in food-calc/.env.local.
 *
 * Usage: npx tsx scripts/gen-anon-token.ts
 * Runs automatically via backend's predev hook.
 */

import { SignJWT } from "jose";
import { config } from "dotenv";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

config({ path: resolve(__dirname, "../.env") });

const jwtSecret = process.env.TRIPLIT_JWT_SECRET ?? "secret";
const projectId = process.env.TRIPLIT_PROJECT_ID ?? "local-project-id";

const anonToken = await new SignJWT({
  "x-triplit-token-type": "anon",
  "x-triplit-project-id": projectId,
})
  .setProtectedHeader({ alg: "HS256", typ: "JWT" })
  .sign(new TextEncoder().encode(jwtSecret));

const envLocalPath = resolve(__dirname, "../../food-calc/.env.local");
const key = "VITE_TRIPLIT_TOKEN";

let content = "";
if (existsSync(envLocalPath)) {
  content = readFileSync(envLocalPath, "utf-8");
}

const line = `${key}=${anonToken}`;

if (content.includes(`${key}=`)) {
  content = content.replace(new RegExp(`^${key}=.*$`, "m"), line);
} else {
  content = content.trimEnd() + (content ? "\n" : "") + line + "\n";
}

writeFileSync(envLocalPath, content);
console.log(`Wrote ${key} to ${envLocalPath}`);
