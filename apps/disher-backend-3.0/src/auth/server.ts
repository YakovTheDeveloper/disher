// Production better-auth instance.
//
// Owns: schema-generating config (CLI generate reads this file), runtime
// password verification (signUpEmail / signInEmail), session management,
// bearer-token issuance for the SPA. HTTP route mounting is in B3 (the
// Fastify handler that proxies to `auth.handler`).
//
// Schema baked in here (see ../../db/migrations/better-auth-schema.sql for
// the CLI-generated SQL — do NOT regenerate without comparing the diff
// against init.sql, or test/dev DBs will silently desync):
//  - generateId: "uuid"          → user.id is `uuid`, not `text`
//  - user.modelName: "users"     → table is `public.users` (matches the
//                                  existing FK target name from `auth.users`)
//
// Plugins:
//  - bearer() — issues a `set-auth-token` response header on sign-in/-up that
//    callers (browser SPA, tests via Fastify.inject) read once and then send
//    back as `Authorization: Bearer <token>`. Required for non-cookie auth.

import { betterAuth } from "better-auth";
import { bearer } from "better-auth/plugins";
import pg from "pg";

const connectionString = process.env.LOCAL_DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "LOCAL_DATABASE_URL is required for better-auth (CLI generate + runtime)"
  );
}

export const auth = betterAuth({
  database: new pg.Pool({ connectionString }),
  user: {
    modelName: "users",
  },
  advanced: {
    database: {
      generateId: "uuid",
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  plugins: [bearer()],
});
