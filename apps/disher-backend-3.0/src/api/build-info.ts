import { execSync } from "child_process";
import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function readPackageVersion(): string {
  try {
    const pkgPath = resolve(__dirname, "../../package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as { version?: string };
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function readGitSha(): string {
  try {
    return execSync("git rev-parse --short HEAD", {
      cwd: resolve(__dirname, "../.."),
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    return "unknown";
  }
}

const PKG_VERSION = readPackageVersion();
const GIT_SHA = readGitSha();

export const MATCHER_VERSION = `${PKG_VERSION}+${GIT_SHA}`;

// Default pinned to deepseek-v4-flash (2026-06-05): it advertises
// `structured_outputs` in OpenRouter's supported_parameters, which both LLM
// heads now require for strict json_schema. deepseek-chat (the old default) is
// no longer in OpenRouter's model list and v4-pro lacks structured_outputs, so
// either would 500 a require_parameters request.
export function getLLMModel(): string {
  return process.env.SUGGESTION_MODEL ?? "deepseek/deepseek-v4-flash";
}
