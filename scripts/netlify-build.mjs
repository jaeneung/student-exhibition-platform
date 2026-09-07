// Netlify's local CLI build (`netlify deploy --build`, used from this Windows
// machine) fails to bundle proxy.ts as an Edge Function: @netlify/plugin-nextjs's
// edge-function bundler concatenates a POSIX-style base path with the real
// Windows path (visible in the error as a doubled
// "/Users/.../3_vibecoding/C:/Users/.../3_vibecoding/..." path), so the
// generated middleware bundle can never be found. Reproduced identically under
// both Turbopack and webpack, so it's not a Turbopack issue — it's specific to
// bundling *any* Edge Function on Windows with this plugin version.
//
// A build that runs on Netlify's own (Linux) CI, via a Git-linked deploy, would
// not hit this — Linux doesn't have the drive-letter path shape that triggers
// the bug. Until this site is linked to GitHub in the Netlify dashboard (see
// README "배포"), this script works around it for local CLI deploys only, by
// removing proxy.ts before the build so Next.js emits no middleware at all,
// then restoring it immediately after. Local dev (`npm run dev`/`next start`)
// and the deployed site's actual data-access rules are unaffected either way —
// only the strict-404 status code (see proxy.ts) is unavailable on a
// locally-built Netlify deploy specifically.
import { existsSync, renameSync } from "node:fs";
import { spawnSync } from "node:child_process";

const PROXY_FILE = "proxy.ts";
const BACKUP_FILE = "proxy.ts.netlify-build-backup";

const hadProxy = existsSync(PROXY_FILE);
if (hadProxy) {
  renameSync(PROXY_FILE, BACKUP_FILE);
  console.log("[netlify-build] Temporarily removed proxy.ts to avoid the Windows edge-function bundling bug.");
}

const result = spawnSync("npx", ["next", "build"], { stdio: "inherit", shell: true });

if (hadProxy) {
  renameSync(BACKUP_FILE, PROXY_FILE);
  console.log("[netlify-build] Restored proxy.ts.");
}

process.exit(result.status ?? 1);
