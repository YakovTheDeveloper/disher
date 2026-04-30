// Backwards-compat shim. Existing tests + a few legacy imports still call
// `verifySupabaseUser`; the actual implementation moved to ./auth.ts as part
// of Stage 0 of the supabase-to-own-solution-migration plan. New routes
// should `import { verifyUser } from "../auth.js"`.

export { verifyUser as verifySupabaseUser } from "./auth.js";
