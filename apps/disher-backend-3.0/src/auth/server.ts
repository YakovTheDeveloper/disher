// Minimal better-auth instance for the @better-auth/cli to introspect.
// Wired up properly (handlers, plugins, secrets) in B3 — for now this only
// needs to be enough for `npx @better-auth/cli generate` to emit schema SQL.
//
// Choices baked in here that the migration depends on:
//  - postgres dialect (raw pg.Pool against LOCAL_DATABASE_URL)
//  - generateId: "uuid"          → user.id is `uuid`, not `text`
//  - user.modelName: "users"     → table is `public.users` (matches the
//                                  existing FK target name from `auth.users`)
//
// Everything else is left at default (singular `account`/`session`/`verification`,
// camelCase columns) — those tables are private to better-auth.

import { betterAuth } from "better-auth";
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
});
