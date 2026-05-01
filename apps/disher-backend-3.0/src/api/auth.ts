// Provider-neutral JWT verification for protected routes. Backed by
// better-auth bearer-token verification (B4 of the supabase migration);
// call sites (backup.ts, analytics.ts) only know about `verifyUser`.
export { verifyUserBearer as verifyUser } from "../auth/verify-bearer.js";
