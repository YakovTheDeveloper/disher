// Thin entry/loader. Its only job is to resolve env BEFORE the app bootstrap's
// module-load side effects run, then hand off to main.ts.
//
// In prod (docker) env is injected by docker-compose `env_file`, and `dotenv`
// is a devDependency that `pnpm --prod deploy` strips from the image — a static
// `import "dotenv/config"` here would crash the container with
// ERR_MODULE_NOT_FOUND. So we load dotenv ONLY outside production, via a guarded
// dynamic import (the module is never resolved when NODE_ENV==="production").
// The real bootstrap is then pulled in via a dynamic import so its static
// imports — which read LOCAL_DATABASE_URL etc. at module-load — are evaluated
// only AFTER .env has been applied (ESM hoists static imports, so this ordering
// is impossible to express with a top-level `import "./main.js"`).
if (process.env.NODE_ENV !== "production") {
  await import("dotenv/config");
}

await import("./main.js");

// Make this file a module so the top-level `await`s above are legal (it has no
// static imports/exports of its own — everything is loaded dynamically).
export {};
